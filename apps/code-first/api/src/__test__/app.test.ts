import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createServer } from "../server";

interface OpenApiDocument {
  components: {
    schemas: Record<string, unknown>;
  };
  info: Record<string, unknown>;
  openapi: string;
  paths: Record<string, unknown>;
}

const REFERENCE_DATE = new Date("2026-01-01T00:00:00.000Z");

function freezeReferenceDate() {
  vi.useFakeTimers();
  vi.setSystemTime(REFERENCE_DATE);
}

function isOpenApiDocument(value: unknown): value is OpenApiDocument {
  return (
    isRecord(value) &&
    isRecord(value.info) &&
    typeof value.openapi === "string" &&
    isRecord(value.paths) &&
    isRecord(value.components) &&
    isRecord(value.components.schemas)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requestAdultCheck(body: { birth_date: string; fiscal_code: string }) {
  return request(createServer())
    .post("/users/is-adult")
    .set("content-type", "application/json")
    .send(body);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("adult check OpenAPI contract", () => {
  it("publishes the OpenAPI contract for the adult check route", async () => {
    const response = await request(createServer()).get("/openapi.json");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");

    const document: unknown = response.body;

    expect(isOpenApiDocument(document)).toBe(true);

    if (!isOpenApiDocument(document)) {
      throw new Error("Expected /openapi.json to return an OpenAPI document");
    }

    expect(document).toMatchObject({
      info: {
        title: "Adult check API",
        version: "1.0.0",
      },
      openapi: "3.0.0",
      paths: {
        "/users/is-adult": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/AdultCheckRequest",
                  },
                },
              },
              required: true,
            },
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      example: true,
                      type: "boolean",
                    },
                  },
                },
                description: "Whether the user is an adult",
              },
              "400": {
                content: {
                  "application/problem+json": {
                    schema: {
                      $ref: "#/components/schemas/ValidationError",
                    },
                  },
                },
                description: "Request body validation failed",
              },
              "422": {
                content: {
                  "application/problem+json": {
                    schema: {
                      $ref: "#/components/schemas/ProblemDetails",
                    },
                  },
                },
                description: "Domain validation error",
              },
            },
          },
        },
      },
    });

    expect(document.components.schemas.AdultCheckRequest).toMatchObject({
      properties: {
        birth_date: {
          example: "1980-01-01",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          type: "string",
        },
        fiscal_code: {
          example: "RSSMRA80A01H501U",
          pattern: "^[A-Z]{6}\\d{2}[ABCDEHLMPRST]\\d{2}[A-Z]\\d{3}[A-Z]$",
          type: "string",
        },
      },
      required: ["birth_date", "fiscal_code"],
      type: "object",
    });

    expect(document.components.schemas.ProblemDetails).toMatchObject({
      properties: {
        detail: {
          type: "string",
        },
        status: {
          type: "number",
        },
        title: {
          type: "string",
        },
        type: {
          type: "string",
        },
      },
      required: ["detail", "status", "title", "type"],
      type: "object",
    });

    expect(document.components.schemas.ValidationError).toMatchObject({
      allOf: [
        {
          $ref: "#/components/schemas/ProblemDetails",
        },
        {
          properties: {
            errors: {
              items: {
                properties: {
                  code: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                  path: {
                    type: "array",
                  },
                },
                required: ["code", "message", "path"],
                type: "object",
              },
              type: "array",
            },
          },
          required: ["errors"],
          type: "object",
        },
      ],
    });
  });
});

describe("adult check route responses", () => {
  it("returns true once the user has reached age 18 on the frozen reference date", async () => {
    freezeReferenceDate();

    const response = await requestAdultCheck({
      birth_date: "2008-01-01",
      fiscal_code: "RSSMRA08A01H501U",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toBe(true);
  });

  it("returns false while the user is still underage on the frozen reference date", async () => {
    freezeReferenceDate();

    const response = await requestAdultCheck({
      birth_date: "2008-01-02",
      fiscal_code: "RSSMRA08A02H501U",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toBe(false);
  });

  it("returns 422 when the fiscal code year does not match", async () => {
    freezeReferenceDate();

    const response = await requestAdultCheck({
      birth_date: "1980-01-01",
      fiscal_code: "RSSMRA81A01H501U",
    });

    expect(response.status).toBe(422);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    expect(response.body).toEqual({
      detail: "birth_date year does not match the fiscal_code year",
      status: 422,
      title: "Domain validation error",
      type: "https://example.com/problems/domain-error",
    });
  });

  it("returns RFC 7807 problem details when the request body is invalid", async () => {
    freezeReferenceDate();

    const response = await requestAdultCheck({
      birth_date: "1980/01/01",
      fiscal_code: "invalid",
    });

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    expect(response.body).toEqual({
      detail: "The request payload did not satisfy the schema constraints.",
      errors: [
        {
          code: "invalid_string",
          message: "birth_date must use YYYY-MM-DD format",
          path: ["json", "birth_date"],
        },
        {
          code: "invalid_string",
          message: "Invalid",
          path: ["json", "fiscal_code"],
        },
      ],
      status: 400,
      title: "Request validation failed",
      type: "https://example.com/problems/validation-error",
    });
  });
});
