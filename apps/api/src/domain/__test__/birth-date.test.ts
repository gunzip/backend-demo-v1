import { describe, expect, it } from "vitest";
import { InvalidUserInputError } from "../errors";
import { BirthDate } from "../birth-date";

describe("BirthDate", () => {
  it("returns the birth date in canonical format", () => {
    expect(new BirthDate(" 1980-01-01 ").toString()).toBe("1980-01-01");
  });

  it("rejects impossible calendar dates", () => {
    expect(() => new BirthDate("2024-02-30")).toThrow(InvalidUserInputError);
  });
});
