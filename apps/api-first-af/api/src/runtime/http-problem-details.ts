import type { ZodIssue } from "zod";

import type { GeneratedHttpResponseInit } from "./operation-types.js";

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

export function notImplemented(operationId: string): GeneratedHttpResponseInit {
  return problemJson({
    detail: `Operation ${operationId} has not been implemented yet.`,
    status: 501,
    title: "Not implemented",
    type: "https://example.com/problems/not-implemented",
  });
}

export function problemJson(
  problem: ProblemDetails | ValidationProblemDetails,
): GeneratedHttpResponseInit {
  return {
    headers: {
      "content-type": "application/problem+json",
    },
    jsonBody: problem,
    status: problem.status,
  };
}

export function validationProblemJson(
  target: string,
  issues: readonly ZodIssue[],
  detail = "The request payload did not satisfy the schema constraints.",
): GeneratedHttpResponseInit {
  return problemJson({
    detail,
    errors: issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: [target, ...issue.path].filter(isPathSegment),
    })),
    status: 400,
    title: "Request validation failed",
    type: "https://example.com/problems/validation-error",
  });
}

function isPathSegment(value: number | string | symbol | undefined) {
  return typeof value === "number" || typeof value === "string";
}
