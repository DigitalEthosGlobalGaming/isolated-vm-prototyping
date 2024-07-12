"use strict";
let currentNumber = getData("currentNumber", 0);
on("tick", () => {
    currentNumber = currentNumber + -1;
    setData("currentNumber", currentNumber);
    log('Mik', currentNumber);
});
on("onMyTurn", (gameState) => {
    const availableMoves = getAvailableMoves(gameState);
    if (availableMoves.length === 0) {
        log("No available moves");
        return;
    }
    const bestMove = findBestMove(gameState, availableMoves);
    if (bestMove == null) {
        log("no best move found");
        return;
    }
    if (makeMove == null) {
        log("no make move function found");
        return;
    }
    makeMove(bestMove.x, bestMove.y);
});
function getAvailableMoves(gameState) {
    const availableMoves = [];
    for (let i = 0; i < gameState.board.length; i++) {
        for (let j = 0; j < gameState.board[i].length; j++) {
            if (gameState.board[i][j] === "") {
                availableMoves.push({ x: i, y: j });
            }
        }
    }
    return availableMoves;
}
function findBestMove(gameState, availableMoves) {
    let bestMove = null;
    let bestScore = -Infinity;
    for (const move of availableMoves) {
        const newGameState = tryMakeMove(gameState, move);
        const score = minimax(newGameState, 0, false);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}
function tryMakeMove(gameState, move) {
    const newGameState = Object.assign({}, gameState);
    newGameState.board[move.x][move.y] = "X"; // Assuming the bot is playing as "X"
    return newGameState;
}
function minimax(gameState, depth, isMaximizingPlayer) {
    if (isMaximizingPlayer) {
        let maxScore = -Infinity;
        const availableMoves = getAvailableMoves(gameState);
        for (const move of availableMoves) {
            const newGameState = tryMakeMove(gameState, move);
            const score = minimax(newGameState, depth + 1, false);
            maxScore = Math.max(maxScore, score);
        }
        return maxScore;
    }
    else {
        let minScore = Infinity;
        const availableMoves = getAvailableMoves(gameState);
        for (const move of availableMoves) {
            const newGameState = tryMakeMove(gameState, move);
            const score = minimax(newGameState, depth + 1, true);
            minScore = Math.min(minScore, score);
        }
        return minScore;
    }
}
