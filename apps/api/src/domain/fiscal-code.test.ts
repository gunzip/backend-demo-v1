import { describe, expect, it } from "vitest";
import { InvalidUserInputError } from "./errors";
import { assertFiscalCodeBirthYearMatches, FiscalCode } from "./fiscal-code";

describe("FiscalCode", () => {
  it("returns the fiscal code in canonical format", () => {
    expect(new FiscalCode(" rssmra80a01h501u ").value).toBe("RSSMRA80A01H501U");
  });

  it("rejects invalid fiscal codes", () => {
    expect(() => new FiscalCode("invalid")).toThrow(InvalidUserInputError);
  });
});

describe("assertFiscalCodeBirthYearMatches", () => {
  it("throws when the birth year does not match the encoded year", () => {
    expect(() =>
      assertFiscalCodeBirthYearMatches(
        new FiscalCode("RSSMRA81A01H501U"),
        new Date("1980-01-01T00:00:00.000Z")
      )
    ).toThrow(InvalidUserInputError);
  });
});
