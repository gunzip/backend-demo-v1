import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateHonoServer } from "./generator/generate-hono-server";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

await generateHonoServer({
  projectRoot: path.resolve(currentDirPath, ".."),
});
