import { createAdaptorServer } from "@hono/node-server";

import { createApp } from "./app";

export function createServer() {
  return createAdaptorServer({
    fetch: createApp().fetch,
  });
}
