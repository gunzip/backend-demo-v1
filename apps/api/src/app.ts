import { OpenAPIHono } from "@hono/zod-openapi";

import { registerCheckUserIsAdultRoute } from "./adapters/http/routes/check-user-is-adult";

export function createApp() {
  const app = registerCheckUserIsAdultRoute(new OpenAPIHono());

  app.doc("/openapi.json", {
    info: {
      title: "Adult check API",
      version: "1.0.0",
    },
    openapi: "3.0.0",
  });

  return app;
}

export const app = createApp();

export type AppType = typeof app;
