import { jsonErrorResponse } from "./operation-types.js";

const EXAMPLE_SESSION_AUTHORIZATION = "Bearer demo-session";

export function validateSession(token: string) {
  return token === EXAMPLE_SESSION_AUTHORIZATION;
}

export const jsonSessionErrorResponse = () =>
  jsonErrorResponse("401", {
    detail: "Missing or invalid Authorization header.",
  });
