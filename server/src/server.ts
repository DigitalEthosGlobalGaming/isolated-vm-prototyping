import { IsolatedApp, IsolatedAppManifest } from "./app";
import { createAppUsingBot } from "./chess-app";
import { getInstalledApps } from "./instance-maintainer";



const installedApps = getInstalledApps();

const isolatedEnvironments: Record<string, IsolatedApp> = {};
for (const app of installedApps) {
    const newApp = new IsolatedApp(app);
    isolatedEnvironments[app.id] = newApp;
}

export function getAppById(id: string) {
    return installedApps.find(app => app.id == id) ?? null;
}

export function createAppById(id: string) {
    const app = getAppById(id);
    if (app == null) {
        return null;
    }
    const newApp = new IsolatedApp(app);
    isolatedEnvironments[app.id] = newApp;
    return newApp;
}


// 60 frames a second.
const maxTickRate = 2;
const interval = 1000 / maxTickRate;

setInterval(() => {
    for (const app of Object.values(isolatedEnvironments)) {
        app.tick();
    }
}, interval);


type GameState = {
    board: string[][],
    currentPlayer: string,
    winner: string | null
}

class Game {
    appA: IsolatedApp;
    appB: IsolatedApp;
    currentPlayer: IsolatedApp;
    gameState: GameState;
    constructor(appA: IsolatedApp, appB: IsolatedApp) {
        this.appA = appA;
        this.appB = appB;
        appA.start();
        appB.start();
        this.currentPlayer = appA;
        this.gameState = {
            board: [
                ["", "", ""],
                ["", "", ""],
                ["", "", ""]
            ],
            currentPlayer: appA.id,
            winner: null
        };
    }
    makeMove(player: string, x: number, y: number) {
        if (this.gameState.winner != null) {
            return;
        }
        if (this.gameState.board[x][y] !== "") {
            return;
        }
        if (this.currentPlayer.id !== player) {
            return;
        }
        this.gameState.board[x][y] = player;
    }

    async nextTurn() {      
        const nextPlayer = this.currentPlayer.id === this.appA.id ? this.appB : this.appA;
        try {
            const move = await this.currentPlayer.runEvent("onMyTurn", {
                board: this.generateBoard(),
                currentPlayer: this.getLetter(this.currentPlayer.id),
            });
            if (move == null) {
                this.gameState.winner = nextPlayer.id;
                console.error("No move returned", this.currentPlayer.manifest.id);
                return;
            }
            this.makeMove(this.currentPlayer.id, move.x, move.y);            
            // this.printBoard();
            this.currentPlayer = this.currentPlayer.id === this.appA.id ? this.appB : this.appA;
            if (this.isGameEnded()) {
                return;
            }
        }
        catch(e) {
            this.gameState.winner = nextPlayer.id;
            console.error("Exception", e);
            return;
        }
        await this.nextTurn();
    }
    isGameEnded() {
        const board = this.gameState.board;
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (board[i][0] !== "" && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
                this.gameState.winner = board[i][0];
                return true;
            }
        }
        // Check columns
        for (let i = 0; i < 3; i++) {
            if (board[0][i] !== "" && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
                this.gameState.winner = board[0][i];
                return true;
            }
        }
        // Check diagonals
        if (board[0][0] !== "" && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
            this.gameState.winner = board[0][0];
            return true;
        }
        if (board[0][2] !== "" && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
            this.gameState.winner = board[0][2];
            return true;
        }
        // Check if there are any empty cells left
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === "") {
                    return false;
                }
            }
        }
        // No empty cells left, it's a draw
        this.gameState.winner = "draw";
        return true;
    }

    getLetter(id: string) {
        const {X,O} = this.getPlayers();
        return id === X ? "X" : id === O ? "O" : " ";
    }

    getPlayers() {
        return {
            X: this.appA.id,
            O: this.appB.id
        }
    }

    generateBoard() {
        const board:string[][] = [['','',''],['','',''],['','','']];
        const {X,O} = this.getPlayers();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.gameState.board[i][j] === X) {
                    board[i][j] = "X";
                } else if (this.gameState.board[i][j] === O) {
                    board[i][j] = "O";
                }
            }
        }
        return board;
    }

    printBoard() {
        const X = this.appA.id;
        const O = this.appB.id;
        console.log("Board:");
        console.log(this.gameState.board.map(row => row.map(cell => cell === X ? "X" : cell === O ? "O" : " ").join(" | ")).join("\n---------\n"));
    }

    async run(): Promise<IsolatedApp> {
        await this.nextTurn();
        const winner = this.gameState.winner;
        if (winner == "draw") {
            return this.appA;
        }
        return winner === this.appA.id ? this.appA : this.appB;
    }
}

let appAManifest: IsolatedAppManifest | null = getAppById("app-2");
let appBManifest: IsolatedAppManifest | null = getAppById("app-2");
const maxEvolutions = 10;
const gamesToPlay = 10;

let currentEvolution = 0;
async function startNewEvolution() {
    currentEvolution = currentEvolution + 1;
    if (currentEvolution > maxEvolutions) {
        return appAManifest;
    }
    if (appAManifest == null || appBManifest == null) {
        return;
    }
    const winners = {"a": 0, "b": 0};
    

    console.log(`Starting match: ${appAManifest.id} vs ${appBManifest.id}`);
    for (let i = 0; i < gamesToPlay; i++) {
        const appA = new IsolatedApp(appAManifest);
        const appB = new IsolatedApp(appBManifest);
        const game = new Game(appA, appB);
        const winner = await game.run();
        if (winner != null) {
            if (winner === appA) {
                winners["a"] = winners["a"] + 1;
            } else if (winner === appB) {
                winners["b"] = winners["b"] + 1;
            }
        }
    }
    
    let overallWinnerLetter: "a"|"b" = "a";
    for (const [id, wins] of Object.entries(winners)) {
        if (overallWinnerLetter == null || wins > winners[overallWinnerLetter]) {
            overallWinnerLetter = id as any;
        }
    }
    


    let overallWinnerManifest = null;

    if (overallWinnerLetter == "a") {
        overallWinnerManifest = appAManifest;
    } else {
        overallWinnerManifest = appBManifest;
    }

    console.log(`${overallWinnerManifest.id} won by ${winners[overallWinnerLetter]}/${gamesToPlay}`);


    if (currentEvolution == maxEvolutions) {
        return overallWinnerManifest;
    }

    appAManifest = overallWinnerManifest ?? null;
    if (appAManifest == null) {
        throw new Error("AppA manifest not found");
    }
    appBManifest = await createAppUsingBot(appAManifest, );

    return await startNewEvolution();
}

async function start() {
    const bestScript = await startNewEvolution();
    console.log("Best script\n", bestScript);
}
if (false as any) {
    start();
}

const myApp = createAppById("random-app");
if (myApp != null) {
    myApp?.start()
}