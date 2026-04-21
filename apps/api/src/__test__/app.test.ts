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
});
