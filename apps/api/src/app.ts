import { OpenAPIHono } from "@hono/zod-openapi";
import { ZodError } from "zod";

import { registerCheckUserIsAdultRoute } from "./adapters/http/routes/check-user-is-adult";

export function createApp() {
  const app = registerCheckUserIsAdultRoute(
    new OpenAPIHono({
      defaultHook: (result, c) => {
        if (!result.success) {
          return c.json(toProblemDetails(result), 422, {
            "content-type": "application/problem+json",
          });
        }
      },
    }),
  );

  app.doc("/openapi.json", {
    info: {
      title: "Adult check API",
      version: "1.0.0",
    },
    openapi: "3.0.0",
  });

  return app;
}

function toProblemDetails(result: { error: ZodError; target?: string }) {
  return {
    detail: "The request payload did not satisfy the schema constraints.",
    errors: result.error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: [result.target, ...issue.path].filter(
        (segment): segment is number | string => segment !== undefined,
      ),
    })),
    status: 422,
    title: "Request validation failed",
    type: "https://example.com/problems/validation-error",
  };
}

export const app = createApp();

export type AppType = typeof app;
