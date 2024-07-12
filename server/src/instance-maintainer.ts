import path from "path";
import fs from "fs";
import { IsolatedAppManifest } from "./app";


// Current file directory
const basePath = path.resolve(__dirname, "../");
const appsDirectory = path.join(basePath, "apps");


function getApps(): IsolatedAppManifest[] {
    const files = fs.readdirSync(appsDirectory);
    const apps:Record<string,IsolatedAppManifest> = {};
    for (const file of files) {
        if (file.endsWith(".js")) {
            try {
                // split the file name by -v and get the end but with .js
                const version = file.split("-v").pop()?.replace(".js","");
                const id = file.replace(".js","").substring(0,file.indexOf("-v"));
                apps[id] = {
                    id: id,
                    version: version ?? "1.0.0",
                    scriptPath: `${appsDirectory}/${file}`
                };
            } catch(e) {

            }

        }
    }
    return Object.values(apps);
}

export function getInstalledApps() {
    return getApps();

}