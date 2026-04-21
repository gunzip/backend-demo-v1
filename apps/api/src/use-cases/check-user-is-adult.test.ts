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
  it("returns true when the user is adult and the fiscal code year matches", async () => {
    const result = await checkUserIsAdult({
      birthDate: "1980-01-01",
      fiscalCode: "RSSMRA80A01H501U",
      referenceDate: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.isOk()).toBe(true);

    if (result.isErr()) {
      throw result.error;
    }

    expect(result.value).toBe(true);
  });

  it("returns an error when the fiscal code year is inconsistent with birth_date", async () => {
    const result = await checkUserIsAdult({
      birthDate: "1980-01-01",
      fiscalCode: "RSSMRA81A01H501U",
      referenceDate: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.isErr()).toBe(true);

    if (result.isOk()) {
      throw new Error("Expected checkUserIsAdult to fail");
    }

    expect(result.error).toBeInstanceOf(InvalidUserInputError);
    expect(result.error.message).toBe(
      "birth_date year does not match the fiscal_code year"
    );
  });
});
