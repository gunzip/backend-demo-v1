import { Hono } from "hono";

import { registerGeneratedRoutes } from "./generated/register-routes.js";

export function createApp() {
  return registerGeneratedRoutes(new Hono());
}

export const app = createApp();

export type AppType = typeof app;
