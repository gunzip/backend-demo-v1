import path from "node:path";

import { generateAzureFunctions } from "./generator/generate-azure-functions.js";

generateAzureFunctions({
  projectRoot: path.resolve("apps/api-first-af/api"),
}).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
