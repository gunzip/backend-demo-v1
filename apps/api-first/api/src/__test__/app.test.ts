import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createServer } from "../server";

function requestAdultCheck(body: Record<string, unknown>) {
  return request(createServer())
    .post("/users/is-adult")
    .set("content-type", "application/json")
    .send(body);
}

const REFERENCE_DATE = new Date("2026-01-01T00:00:00.000Z");

function freezeReferenceDate() {
  vi.useFakeTimers();
  vi.setSystemTime(REFERENCE_DATE);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("generated api-first server", () => {
  it("returns problem details when zod validation fails", async () => {
    const response = await requestAdultCheck({
      birth_date: "1980/01/01",
      fiscal_code: "invalid",
    });

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    expect(response.body).toMatchObject({
      detail: "The request payload did not satisfy the schema constraints.",
      status: 400,
      title: "Request validation failed",
      type: "https://example.com/problems/validation-error",
    });
    expect(response.body.errors).toEqual([
      {
        code: "invalid_format",
        message: "Invalid string: must match pattern /^\\d{4}-\\d{2}-\\d{2}$/",
        path: ["json", "birth_date"],
      },
      {
        code: "invalid_format",
        message:
          "Invalid string: must match pattern /^[A-Z]{6}\\d{2}[ABCDEHLMPRST]\\d{2}[A-Z]\\d{3}[A-Z]$/",
        path: ["json", "fiscal_code"],
      },
    ]);
  });

  it("returns true once the user has reached age 18 on the frozen reference date", async () => {
    freezeReferenceDate();

    const response = await requestAdultCheck({
      birth_date: "1980-01-01",
      fiscal_code: "RSSMRA80A01H501U",
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
});
