import { describe, expect, it } from "vitest";
import { BirthDate } from "./birth-date";
import { InvalidUserInputError } from "./errors";
import { FiscalCode } from "./fiscal-code";

describe("FiscalCode", () => {
  it("returns the fiscal code in canonical format", () => {
    expect(new FiscalCode(" rssmra80a01h501u ").value).toBe("RSSMRA80A01H501U");
  });

  it("rejects invalid fiscal codes", () => {
    expect(() => new FiscalCode("invalid")).toThrow(InvalidUserInputError);
  });
});

describe("FiscalCode.assertBirthYearMatches", () => {
  it("throws when the birth year does not match the encoded year", () => {
    expect(() =>
      new FiscalCode("RSSMRA81A01H501U").assertBirthYearMatches(
        new BirthDate("1980-01-01")
      )
    ).toThrow(InvalidUserInputError);
  });
});
