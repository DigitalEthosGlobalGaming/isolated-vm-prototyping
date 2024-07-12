type Events = "tick" | "onMyTurn";

declare const on: (event: Events, callback: Function) => void;

declare const emit: (event: string, args: any[]) => void;

declare function log(...args: any): void;

// Tik tak toe game state
type GameState = {
    board: string[][],
    currentPlayer: string,
    winner: string | null
}

declare const application: {
    events: {
        "tick": (delta: number) => void;
        "onStart": () => void;
        "onStop": () => void;
        "onReload": () => void;
        "onMyTurn": (GameState) => void;
    };
    data: Record<string, any>
}

declare function makeMove(x,y): void;

declare function getData<T>(key: string, def: T): T;
/**
 * For value to persist it must be JSON serializable
 * @param key 
 * @param value 
 */
declare function setData<T>(key: string, value: T): void;
