
const Materials = [
    {
        code: "STEEL",
        name: "Steel",
    },
    {
        code: "IRON",
        name: "Iron",
    },
    {
        code: "SOIL",
        name: "soil",
    },
    {
        code: "STONE",
        name: "stone",
    },
    {
        code: "REGOLITH",
        name: "Regolith",
    },
    {
        code: "WASTE",
        name: "Waste",
    }
];

const Recipes = [
    {
        code: "PROCESS_REGOLITH",
        name: "Process Regolith",
        description: "Process regolith into useful materials",
        buildingCode: "PROCESSOR",
        duration: 10,
        requirements: [
            {
                materialCode: "REGOLITH",
                amount: 10,
            }
        ],
        produces: [
            {
                materialCode: "IRON",
                chance: 0.1,
                minAmount: 0,
                maxAmount: 1
            },
            {
                materialCode: "STONE",
                minAmount: 1,
                maxAmount: 2
            },
            {
                materialCode: "WASTE",
                minAmount: 5,
                maxAmount: 10
            },
        ]
    },
    {
        code: "PROCESS_WASTE",
        name: "Process Waste",
        description: "Process waste into useful materials",
        buildingCode: "PROCESSOR",
        duration: 10,
        requirements: [
            {
                materialCode: "WASTE",
                amount: 10,
            }
        ],
        produces: [
            {
                materialCode: "REGOLISH",
                amount: 1,
            },
            {
                materialCode: "SOIL",
                amount: 2,
            },
        ]
    }
];



const Buildings = [
    {
        "code": "REFINER",
        "name": "Refiner",
        "description": "",
    },
    {
        "code": "PROCESSOR",
        "name": "Refiner",
        "description": "",
    }
];

export const GameData = {
    materials: Materials,
    buildings: Buildings,
    recipes: Recipes
}