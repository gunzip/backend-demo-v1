import { Context } from "hono";

import { jsonErrorResponse } from "./operation-types";

const EXAMPLE_SESSION_AUTHORIZATION = "Bearer demo-session";

export function validateSession(context: Context) {
  return (
    context.req.raw.headers.get("authorization") ===
    EXAMPLE_SESSION_AUTHORIZATION
  );
}

export const jsonSessionErrorResponse = (context: Context) =>
  jsonErrorResponse(context, "401", {
    detail: "Missing or invalid Authorization header.",
  });
