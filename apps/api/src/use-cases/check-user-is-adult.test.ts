import { describe, expect, it } from "vitest";
import { InvalidUserInputError } from "../domain/errors";
import {
  checkUserIsAdult,
  parseBirthDate
} from "./check-user-is-adult";

describe("parseBirthDate", () => {
  it("rejects impossible calendar dates", () => {
    expect(() => parseBirthDate("2024-02-30")).toThrow(
      InvalidUserInputError
    );
  });
});

describe("checkUserIsAdult", () => {
  it("returns true when the user is adult and the fiscal code year matches", () => {
    const result = checkUserIsAdult({
      birthDate: "1980-01-01",
      fiscalCode: "RSSMRA80A01H501U",
      referenceDate: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result).toBe(true);
  });

  it("throws when the fiscal code year is inconsistent with birth_date", () => {
    expect(() =>
      checkUserIsAdult({
        birthDate: "1980-01-01",
        fiscalCode: "RSSMRA81A01H501U",
        referenceDate: new Date("2026-01-01T00:00:00.000Z")
      })
    ).toThrow(InvalidUserInputError);
  });
});
