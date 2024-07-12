/* eslint-disable no-console */
import { config } from "dotenv";
import path from "path";
import { replaceString } from "./replace-string";

export default function loadConfig(basePath: string): any {
  basePath = replaceString(basePath, "\\", "/");
  basePath = replaceString(basePath, "/dist/", "/");
  let environmentConfig: any = {};
  const appEnvironment = process.env.ENVIRONMENT ?? "production";

  const configPaths = ["", `.${appEnvironment.toLowerCase()}`, ".secure"];

  let configFolderPath = replaceString(path.resolve(basePath, "./"), "\\", "/");
  configFolderPath = configFolderPath.substring(
    0,
    configFolderPath.indexOf("/src")
  );
  for (const i in configPaths) {
    const configFileName = configPaths[i]?.trim();
    const configPath = path.resolve(
      configFolderPath,
      `./.env${configFileName?.trim()}`
    );
    const result = config({ path: configPath });
    if (result.error) {
      if (appEnvironment == "local") {
        console.warn(`Unable to find environment file for ${configPath}`);
      }
    } else {
      environmentConfig = { ...environmentConfig, ...result.parsed };
    }
  }
  const envValues = { ...environmentConfig, ...process.env };
  for (const key in envValues) {
    envValues[key.toLowerCase()] = envValues[key];
  }
  return envValues;
}

let configValues: any = null;

export function getConfigValue(key: string, def?: any) {
  if (configValues == null) {
    configValues = loadConfig(path.resolve(__dirname, "../"));
  }

  return configValues[key.toLowerCase()] ?? def;
}
