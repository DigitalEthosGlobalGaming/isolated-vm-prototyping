type MaterialType = "steel" | "";



type MarketItem = {
    name: string,
    price: number,
    materials: Materials[]
}

type SpaceShip = {

}

type Building = {
    name: string,
    materials: Materials[],
    price: number,
    buildTime: number
}

type SpaceGame = {
    market: MarketItem[],
    player: {
        money: number,
        ships: SpaceShip[]
    }
    build: 
}