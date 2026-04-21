import { describe, expect, it } from "vitest";

import { createApp } from "../app";

describe("adult check route", () => {
  it("returns the boolean result for a valid request", async () => {
    const app = createApp();

    const response = await app.request("/users/is-adult", {
      body: JSON.stringify({
        birth_date: "1980-01-01",
        fiscal_code: "RSSMRA80A01H501U",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBe(true);
  });

  it("returns 400 when the fiscal code year does not match", async () => {
    const app = createApp();

    const response = await app.request("/users/is-adult", {
      body: JSON.stringify({
        birth_date: "1980-01-01",
        fiscal_code: "RSSMRA81A01H501U",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "birth_date year does not match the fiscal_code year",
    });
  });

  it("returns RFC 7807 problem details when the request body is invalid", async () => {
    const app = createApp();

    const response = await app.request("/users/is-adult", {
      body: JSON.stringify({
        birth_date: "1980/01/01",
        fiscal_code: "invalid",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json",
    );
    await expect(response.json()).resolves.toEqual({
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
      status: 422,
      title: "Request validation failed",
      type: "https://example.com/problems/validation-error",
    });
  });
});
