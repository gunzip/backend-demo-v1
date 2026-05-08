import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  GeneratedHttpRequest,
  GeneratedInvocationContext,
} from "../runtime/operation-types.js";

import { postUsersIsAdultFunctionHandler } from "../generated/operations/postUsersIsAdult.js";

const VALID_AUTHORIZATION = "Bearer demo-session";

function createAdultCheckRequest(
  body: Record<string, unknown>,
  options?: { authorization?: null | string },
): GeneratedHttpRequest {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (options?.authorization !== null) {
    headers.set("authorization", options?.authorization ?? VALID_AUTHORIZATION);
  }

  return {
    async formData() {
      throw new Error("Unexpected formData() call");
    },
    headers,
    async json() {
      return body;
    },
    method: "POST",
    params: {},
    query: new URLSearchParams(),
    async text() {
      return JSON.stringify(body);
    },
    url: "http://localhost:7072/api/users/is-adult",
  };
}

function createInvocationContext(): GeneratedInvocationContext {
  return {
    log: vi.fn(),
  };
}

const REFERENCE_DATE = new Date("2026-01-01T00:00:00.000Z");

function freezeReferenceDate() {
  vi.useFakeTimers();
  vi.setSystemTime(REFERENCE_DATE);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("generated api-first Azure Functions handlers", () => {
  it("returns 401 when the authorization header is missing or invalid", async () => {
    const response = await postUsersIsAdultFunctionHandler(
      createAdultCheckRequest(
        {
          birth_date: "1980-01-01",
          fiscal_code: "RSSMRA80A01H501U",
        },
        { authorization: "foo" },
      ),
      createInvocationContext(),
    );

    expect(response).toEqual({
      headers: {
        "content-type": "application/problem+json",
      },
      jsonBody: {
        detail: "Missing or invalid Authorization header.",
        status: 401,
        title: "Authentication required",
        type: "https://example.com/problems/unauthorized",
      },
      status: 401,
    });
  });

  it("returns problem details when zod validation fails", async () => {
    const response = await postUsersIsAdultFunctionHandler(
      createAdultCheckRequest({
        birth_date: "1980/01/01",
        fiscal_code: "invalid",
      }),
      createInvocationContext(),
    );

    expect(response).toEqual({
      headers: {
        "content-type": "application/problem+json",
      },
      jsonBody: {
        detail: "The request payload did not satisfy the schema constraints.",
        errors: [
          {
            code: "invalid_format",
            message:
              "Invalid string: must match pattern /^\\d{4}-\\d{2}-\\d{2}$/",
            path: ["json", "birth_date"],
          },
          {
            code: "invalid_format",
            message:
              "Invalid string: must match pattern /^[A-Z]{6}\\d{2}[ABCDEHLMPRST]\\d{2}[A-Z]\\d{3}[A-Z]$/",
            path: ["json", "fiscal_code"],
          },
        ],
        status: 400,
        title: "Request validation failed",
        type: "https://example.com/problems/validation-error",
      },
      status: 400,
    });
  });

  it("returns true once the user has reached age 18 on the frozen reference date", async () => {
    freezeReferenceDate();

    const response = await postUsersIsAdultFunctionHandler(
      createAdultCheckRequest({
        birth_date: "1980-01-01",
        fiscal_code: "RSSMRA80A01H501U",
      }),
      createInvocationContext(),
    );

    expect(response).toEqual({
      headers: {
        "content-type": "application/json",
      },
      jsonBody: true,
      status: 200,
    });
  });

  it("returns false while the user is still underage on the frozen reference date", async () => {
    freezeReferenceDate();

    const response = await postUsersIsAdultFunctionHandler(
      createAdultCheckRequest({
        birth_date: "2008-01-02",
        fiscal_code: "RSSMRA08A02H501U",
      }),
      createInvocationContext(),
    );

    expect(response).toEqual({
      headers: {
        "content-type": "application/json",
      },
      jsonBody: false,
      status: 200,
    });
  });

  it("returns 422 when the fiscal code year does not match", async () => {
    freezeReferenceDate();

    const response = await postUsersIsAdultFunctionHandler(
      createAdultCheckRequest({
        birth_date: "1980-01-01",
        fiscal_code: "RSSMRA81A01H501U",
      }),
      createInvocationContext(),
    );

    expect(response).toEqual({
      headers: {
        "content-type": "application/problem+json",
      },
      jsonBody: {
        detail: "birth_date year does not match the fiscal_code year",
        status: 422,
        title: "Domain validation error",
        type: "https://example.com/problems/domain-error",
      },
      status: 422,
    });
  });
});
