import type { OpenAPIHono } from "@hono/zod-openapi";

import { createRoute, z } from "@hono/zod-openapi";

import { FISCAL_CODE_REGEX } from "../../../domain/fiscal-code";
import { checkUserIsAdult } from "../../../use-cases/check-user-is-adult";

/////// OpenAPI route definition and registration ///////

const BirthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "birth_date must use YYYY-MM-DD format")
  .openapi({
    example: "1980-01-01",
  });

const FiscalCodeSchema = z.string().regex(FISCAL_CODE_REGEX).openapi({
  example: "RSSMRA80A01H501U",
});

const AdultCheckRequestSchema = z
  .object({
    birth_date: BirthDateSchema,
    fiscal_code: FiscalCodeSchema,
  })
  .openapi("AdultCheckRequest");

const ProblemDetailsSchema = z
  .object({
    detail: z.string().openapi({
      example: "birth_date year does not match the fiscal_code year",
    }),
    status: z.number().openapi({ example: 400 }),
    title: z.string().openapi({ example: "Domain validation error" }),
    type: z.string().openapi({
      example: "https://example.com/problems/domain-error",
    }),
  })
  .openapi("ProblemDetails");

export const checkUserIsAdultRoute = createRoute({
  method: "post",
  path: "/users/is-adult",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdultCheckRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.boolean().openapi({
            example: true,
          }),
        },
      },
      description: "Whether the user is an adult",
    },
    422: {
      content: {
        "application/problem+json": {
          schema: ProblemDetailsSchema,
        },
      },
      description: "Domain validation error",
    },
  },
});

//////// Route handler implementation and registration ///////

export function registerCheckUserIsAdultRoute<TApp extends OpenAPIHono>(
  app: TApp,
) {
  return app.openapi(checkUserIsAdultRoute, async (context) => {
    const body = context.req.valid("json");

    return checkUserIsAdult({
      birthDate: body.birth_date,
      fiscalCode: body.fiscal_code,
    }).match(
      (isUserAdult) => context.json(isUserAdult, 200),
      (error) =>
        context.json(
          {
            detail: error.message,
            status: 422,
            title: "Domain validation error",
            type: "https://example.com/problems/domain-error",
          },
          422,
          { "content-type": "application/problem+json" },
        ),
    );
  });
}
