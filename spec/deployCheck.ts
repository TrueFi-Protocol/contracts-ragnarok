import { readdirSync, existsSync } from "fs";
import ignoreSpec from "./ignoreSpec.json"

const expectedDir = "./spec/expected";

function deployCheck() {
  if (!existsSync(expectedDir)) {
    console.log("true");
  } else {
    const expected = readdirSync(expectedDir);
    for (const expFile of expected) {
      if (!ignoreSpec.includes(expFile)) {
        console.log("false");
        return
      }
    }
    console.log("true");
  }
}

deployCheck();
