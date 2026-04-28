import type { Hono } from "hono";
import { registerPostUsersIsAdultRoute } from "./operations/postUsersIsAdult.js";

export function registerGeneratedRoutes<TApp extends Hono>(app: TApp) {
  registerPostUsersIsAdultRoute(app);

  return app;
}
