import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdultCheckRequest } from "../../generated/schemas/AdultCheckRequest";
import { FiscalCode } from "../domain/fiscal-code";
import { createServer } from "../server";

const VALID_AUTHORIZATION = "Bearer demo-session";

interface AdapterAcceptedCase {
  readonly body: {
    readonly birth_date: string;
    readonly fiscal_code: string;
  };
  readonly description: string;
  readonly expectedResponse: {
    readonly body: boolean | DomainErrorBody;
    readonly status: 200 | 422;
  };
}

interface DomainErrorBody {
  readonly detail: string;
  readonly status: number;
  readonly title: string;
  readonly type: string;
}

const adapterAcceptedCases = [
  {
    body: {
      birth_date: "1980-01-01",
      fiscal_code: "RSSMRA80A01H501U",
    },
    description: "canonical uppercase input",
    expectedResponse: {
      body: true,
      status: 200,
    },
  },
  {
    body: {
      birth_date: "1980-12-31",
      fiscal_code: "RSSMRA80T31H501U",
    },
    description: "upper boundary month letter and day",
    expectedResponse: {
      body: true,
      status: 200,
    },
  },
  {
    body: {
      birth_date: "2010-10-01",
      fiscal_code: "RSSMRA10R41H501U",
    },
    description: "female day offset accepted by the adapter",
    expectedResponse: {
      body: false,
      status: 200,
    },
  },
  {
    body: {
      birth_date: "1980-01-01",
      fiscal_code: "RSSMRA81A01H501U",
    },
    description: "domain-semantic mismatch on birth year",
    expectedResponse: {
      body: {
        detail: "birth_date year does not match the fiscal_code year",
        status: 422,
        title: "Domain validation error",
        type: "https://example.com/problems/domain-error",
      },
      status: 422,
    },
  },
] as const satisfies readonly AdapterAcceptedCase[];

const REFERENCE_DATE = new Date("2026-01-01T00:00:00.000Z");

function freezeReferenceDate() {
  vi.useFakeTimers();
  vi.setSystemTime(REFERENCE_DATE);
}

function requestAdultCheck(body: AdapterAcceptedCase["body"]) {
  return request(createServer())
    .post("/users/is-adult")
    .set("authorization", VALID_AUTHORIZATION)
    .set("content-type", "application/json")
    .send(body);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("fiscal_code adapter/domain contract", () => {
  it.each(adapterAcceptedCases)(
    "constructs a FiscalCode for every adapter-accepted case: $description",
    ({ body }) => {
      const parsedRequest = AdultCheckRequest.safeParse(body);

      expect(parsedRequest.success).toBe(true);

      if (!parsedRequest.success) {
        throw parsedRequest.error;
      }

      expect(
        () => new FiscalCode(parsedRequest.data.fiscal_code),
      ).not.toThrow();
    },
  );

  it.each(adapterAcceptedCases)(
    "crosses the HTTP boundary without format drift: $description",
    async ({ body, expectedResponse }) => {
      freezeReferenceDate();

      const response = await requestAdultCheck(body);

      expect(response.status).toBe(expectedResponse.status);
      expect(response.body).toEqual(expectedResponse.body);
    },
  );
});
