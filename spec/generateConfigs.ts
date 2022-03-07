import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";

const originalConfigsDir = "./spec/confs";
const generatedConfigsDir = "./build/spec";

const tokensList = "./spec/tokens.json";

function generateConfigs() {
  const configs = readdirSync(originalConfigsDir);
  const tokens = JSON.parse(readFileSync(tokensList, "utf8"));

  if (existsSync(generatedConfigsDir)) {
    rmSync(generatedConfigsDir, { recursive: true, force: true });
  }
  mkdirSync(generatedConfigsDir, { recursive: true });

  for (const configName of configs) {
    const config = JSON.parse(readFileSync(originalConfigsDir + "/" + configName, "utf8"));

    for (const spec of config.verify) {
      for (const token of tokens) {
        const specParts = spec.split("/");
        const specName = specParts[specParts.length - 1];
        const tokenParts = token.split("/");
        const tokenName = tokenParts[tokenParts.length - 1].split(".")[0]
        const newConfigName = (config.cache + "_" + tokenName + "_" + specName.replace(".spec", ".conf"));

        writeFileSync(`${generatedConfigsDir}/${newConfigName}`, JSON.stringify({
            ...config,
            files: [...config.files, token + ":MockToken"],
            verify: [spec],
            cache: config.cache + "_" + tokenName,
          }));
      }
    }
  }
}

generateConfigs();
