import { loadApiConfig } from "./config";
import { createServer } from "./server";

const config = loadApiConfig(process.env);
const server = createServer();

server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
