import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";
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

const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: "birth_date year does not match the fiscal_code year",
    }),
  })
  .openapi("AdultCheckError");

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
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
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
            error: error.message,
          },
          400,
        ),
    );
  });
}
