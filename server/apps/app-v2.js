"use strict";
on("onMyTurn", (gameState) => {
    const availableMoves = getAvailableMoves(gameState);
    if (availableMoves.length === 0) {
        return null;
    }
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    if (randomMove == null) {
        return null;
    }
    return { x: randomMove.x, y: randomMove.y };
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
