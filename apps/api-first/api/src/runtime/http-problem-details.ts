import type { Hook } from "@hono/zod-validator";
import type { Env } from "hono";

export interface ProblemDetails {
  detail: string;
  status: number;
  title: string;
  type: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  path: (number | string)[];
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors: ValidationIssue[];
}

export function notImplemented(operationId: string): Response {
  return problemJson({
    detail: `Operation ${operationId} has not been implemented yet.`,
    status: 501,
    title: "Not implemented",
    type: "https://example.com/problems/not-implemented",
  });
}

export function problemJson(
  problem: ProblemDetails | ValidationProblemDetails,
): Response {
  return new Response(JSON.stringify(problem), {
    headers: {
      "content-type": "application/problem+json",
    },
    status: problem.status,
  });
}

export const validationHook: Hook<unknown, Env, string> = (result) => {
  if (result.success) {
    return;
  }

  return problemJson({
    detail: "The request payload did not satisfy the schema constraints.",
    errors: result.error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: [result.target, ...issue.path].filter(isPathSegment),
    })),
    status: 400,
    title: "Request validation failed",
    type: "https://example.com/problems/validation-error",
  });
};

function isPathSegment(value: number | string | symbol | undefined) {
  return typeof value === "number" || typeof value === "string";
}
