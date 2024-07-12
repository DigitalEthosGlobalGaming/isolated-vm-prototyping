
on("onMyTurn", (gameState: GameState) => {
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

log("Tobias was here!");


function getAvailableMoves(gameState: GameState): Move[] {
    const availableMoves: Move[] = [];
    for (let i = 0; i < gameState.board.length; i++) {
        for (let j = 0; j < gameState.board[i].length; j++) {
            if (gameState.board[i][j] === "") {
                availableMoves.push({ x: i, y: j });
            }
        }
    }
    return availableMoves;
}

interface Move {
    x: number;
    y: number;
}