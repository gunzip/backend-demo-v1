import { serve } from "@hono/node-server";
import { app } from "./app";
import { loadApiConfig } from "./config";

const config = loadApiConfig(process.env);

serve(
  {
    fetch: app.fetch,
    port: config.port
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  }
);
