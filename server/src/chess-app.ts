import { IsolatedAppManifest } from "./app";
import { createAppById } from "./server";
import OpenAI from "openai";
import { getConfigValue } from "./utilities/config";
const openai = new OpenAI({
    apiKey: getConfigValue("OPENAI_API_KEY")
});

const globalDefinition = `
type GameState = {
    currentPlayer: "X"| "O",
    board: string[][]
}

declare function takeTurn(GameState): {x: number, y: number};
`;

let latestApp: IsolatedAppManifest = {
    script: "",
    id: "app-2",
    version: "1.0.0"
};

const planningPromptParts = [
    "You are an expert assistant that will write out steps to write a tik tak toe bot.",
    "Ignore making generic programming tips, make it specific about how this code can be improved for playing tik tak toe",
    "You must analyse some provided code and create a list of steps that might make this code better.",
    "You can also choose to rewrite the code completely",
    "You must only respond with the plan/changes not the actual code",
    "Below is the existing code"
];

function getPlanningPrompt(app: IsolatedAppManifest): string [] {
    return [...planningPromptParts, app?.script ?? ""];
}

async function chat(messages:string[]) {
    const completion = await openai.chat.completions.create({
        messages: [{"role": "system", "content": messages.join("\n")}],
        model: "gpt-3.5-turbo",
      });
    return completion.choices[0].message.content;
    
}

const promptParts = [
    "You are an expert who can write an amazing tik tak toe bot in javascript.",
    "Using an existing code base and a plan to improve the code make changes to the code.",
    "You must not use any external imports or requires",
    "The code must be complete with no placeholders",
    "You must also only reply with ONLY the code, not any other words or comments about it",
    "Also don't start with ```javascript or anything like that, just the code itself",
    "The plan you must follow is:"
];

function getPrompt(plan: string, app: IsolatedAppManifest): string[] {
    return [...promptParts, plan, "The existing code is", app?.script ?? ""];
}

function getFinishCodePrompt(code: string) {
    return [
        "You are an expert who must ensure code for an advanced amazing tik tak toe bot in javascript is complete.",
        "Given the following code finish it off.",
        "You must not use any external imports or requires",
        "You must reply with the new full file.",
        "You must not leave any placeholders in the code or have any unfinished code",
        "You must also only reply with ONLY the code, not any other words or comments about it",
        "Also don't start with ```javascript or anything like that, just the code itself",
        "Below is global definitions that you can use in the code",
        globalDefinition,
        "Below is the code:",
        code
    ]
}



export function getLatestApp() {
    return latestApp;
}

export async function createAppUsingBot(app: IsolatedAppManifest) {
    const initialBot = createAppById("app-2");
    let newApp = {...(latestApp), ...(app ?? {})};
    if (newApp?.script == "") {
        newApp.script = await initialBot?.loadScript() ?? "";
    }
    const plan = await chat(getPlanningPrompt(newApp));
    if (plan == null) {
        throw new Error("Error creating plan");
    }
    console.log("--------PLAN-------");
    console.log(plan);



    const newScript = await chat(getPrompt(plan,newApp));
    if (newScript == null) {
        throw new Error("Error creating new script");
    }

    const finishedScript = await chat(getFinishCodePrompt(newScript));
    if (finishedScript == null) {
        throw new Error("Error creating new script");
    }

    console.log("--------CODE-------");
    console.log(finishedScript);

    newApp.version = newApp.version + 1;
    newApp.id = `OPENAI-v${newApp.version}`;
    newApp.script = finishedScript;
    latestApp = newApp;

    return latestApp;

}

