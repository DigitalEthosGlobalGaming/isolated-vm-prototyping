import { Context, Isolate } from "isolated-vm";
import fs from "fs";
import path from "path";
import { v4 } from "uuid";

export type IsolatedAppManifest = {
    id: string;
    version: string;
    scriptPath?: string;
    script?: string;
}

const baseScriptPath = path.resolve(__dirname, "../app-base.js");
const baseScript = fs.readFileSync(baseScriptPath).toString();


function makeHash(str: string) {
    var hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
function generateUUID(): string {
    return v4();
}

export class IsolatedApp {
    id: string = "";
    manifest: IsolatedAppManifest;
    running: boolean = false;
    isolate?: Isolate;
    currentContext?: Context;
    lastTick: number = 0;
    data: Record<string, any> = {};
    callbacks: Record<string, Function> = {};
    watcher: fs.FSWatcher | null = null;
    watchDebouncer: NodeJS.Timeout | null = null;
    scriptHash: number = 0;
    script?: string;
    asyncResponses: Record<string, {
        resolve: Function,
        reject: Function
    }> = {};

    constructor(manifest: IsolatedAppManifest) {
        this.manifest = manifest;
        this.id = generateUUID();
        if (this.manifest.script != null) {
            this.script = this.manifest.script;
        }
        // This is the isolated app
    }

    cleanup() {
        if (this.isolate == null) {
            return;
        }
        this.isolate.dispose();
    }

    watch() {
        if (this.watcher != null) {
            this.watcher.close();
        }
        if (this.manifest.scriptPath != null) {
            this.watcher = fs.watch(this.manifest.scriptPath, (event: any) => {
                if (event == "change") {
                    this.reload();
                }
            });
        }
    }

    reload() {
        if (this.watchDebouncer != null) {
            clearTimeout(this.watchDebouncer);
        }
        this.watchDebouncer = setTimeout(() => {
            const newScript = this.loadScript();
            const newHash = makeHash(newScript);
            if (newHash == this.scriptHash) {
                return;
            }

            this.stop();
            this.start();
        }, 1000);
    }

    loadScript() {
        if ((this.manifest.script ?? "") != "") {
            return this.script ?? "";
        }
        if (this.manifest.scriptPath == null) {
            return "";
        }
        const script = fs.readFileSync(this.manifest.scriptPath).toString();
        return script;
    }

    callback(id: string, error: boolean, data: any) {
        const response = this.asyncResponses[id];
        
        delete this.asyncResponses[id];
        if (response == null) {
            return;
        }

        if (error) {
            response.reject(data);
        } else {
            response.resolve(data);
        }
    }

    setupFunctions() {
        const context = this?.currentContext;
        if (context == null) {
            return;
        }
        const jail = context.global;

        const log = (...args: any[]) => {
            this.log(...args);
        }

        jail.setSync('log', log);

        jail.setSync('_sync_setData', (key: string, value: any) => {
            this.data[key] = value;
        });

        jail.setSync('_sync_callback', (id: string, isError:boolean, value: string) => {
            try {
                let data = null;
                value = value ?? "";
                if (value != "") {
                    data = JSON.parse(value);
                }
                this.callback(id, isError, data);
            } catch (e) {
                this.error("Invalid data type for callback", value);
            }
        });

        const makeMove = (x: number, y: number) => {
            if (this.callbacks['makeMove']) {
                this.callbacks['makeMove'](x, y);
            } else {
                log("No make move function found");
            }
        }

        jail.setSync('makeMove', makeMove);
    }

    start() {
        try {
            if (this.running) {
                return;
            }

            const script = this.loadScript() ?? "";

            if (script == "") {
                this.log("Script not found ", this.manifest);
                return;
            }

            const isolate = new Isolate();
            this.isolate = isolate;
            const context = isolate.createContextSync();
            this.currentContext = context;

            this.setupFunctions();
            context.evalSync(baseScript);

            for (const i in this.data) {
                const data = JSON.parse(this.data[i]);
                context.evalSync(`application.data['${i}'] = ${data};`);
            }

            context.evalSync(script);


            // Start the app
            this.running = true;

            this.scriptHash = makeHash(script);

        } catch (e) {
            this.log(e);
        }
        this.watch();
    }

    log(...args: any[]) {
        console.log(`${this.id}-${this.manifest.id}:`, ...args);
    }
    warn(...args: any[]) {
        console.warn(`${this.id}-${this.manifest.id}:`, ...args);
    }
    error(...args: any[]) {
        console.error(`${this.id}-${this.manifest.id}:`, ...args);
    }


    stop() {
        // Stop the app
        this.running = false;
        this.cleanup();
    }

    async runEvent<T = any> (event: string, ...args: any):Promise<T> {
        const result = await this._handleEvent({
            event,
            data: args,
            isAsync: true
        });

        return result;
    }

    runSyncEvent(event: string, ...args: any) {
        this._handleEvent({
            event,
            data: args,
            isAsync: false
        });
    }

    async _handleEvent(options: {
        event: string,
        data: any,
        isAsync: boolean
    }): Promise<any> {
        let p = new Promise((resolve, reject) => {
            try {
                const { event, data, isAsync } = options;
                let id = "";
                const callResolve = (data: any) => {
                    resolve(data);
                }
                try {
                    const dataJson = JSON.stringify(data);
                    if (isAsync) {                    
                        id = generateUUID();
                        this.asyncResponses[id] = {
                            resolve: (data: any) => {
                                callResolve(data);
                            },
                            reject: (...data: any) => {
                                reject(...data)
                            }
                        };
                    }
                    this.currentContext?.eval(`emit('${event}',${dataJson},'${id}');`);
                } catch (e) {
                    this.log(e);
                }
            } catch(e) {
                console.error("EEE", e);
            }
        });

        await p;

        return p;
    }

    tick() {
        if (this.running == true) {
            const now = Date.now();
            let delta = now - this.lastTick;
            if (this.lastTick == 0) {
                delta = 0;
            }
            this.runSyncEvent("tick", delta);
            this.lastTick = now;
        }
    }
}