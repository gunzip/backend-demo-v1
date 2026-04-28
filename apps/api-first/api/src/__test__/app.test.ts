import request from "supertest";
import { describe, expect, it } from "vitest";

import { createServer } from "../server";

function requestAdultCheck(body: Record<string, unknown>) {
  return request(createServer())
    .post("/users/is-adult")
    .set("content-type", "application/json")
    .send(body);
}

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

  it("routes valid requests to the handwritten handler wrapper", async () => {
    const response = await requestAdultCheck({
      birth_date: "1980-01-01",
      fiscal_code: "RSSMRA80A01H501U",
    });

    expect(response.status).toBe(501);
    expect(response.headers["content-type"]).toContain(
      "application/problem+json",
    );
    expect(response.body).toEqual({
      detail: "Operation postUsersIsAdult has not been implemented yet.",
      status: 501,
      title: "Not implemented",
      type: "https://example.com/problems/not-implemented",
    });
  });
});
