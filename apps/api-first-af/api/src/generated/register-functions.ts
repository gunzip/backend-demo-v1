import { app } from "@azure/functions";
import { registerPostUsersIsAdultFunction } from "./operations/postUsersIsAdult.js";

let registered = false;

export function registerGeneratedFunctions() {
  if (registered) {
    return app;
  }

  registered = true;
  registerPostUsersIsAdultFunction(app);

  return app;
}
