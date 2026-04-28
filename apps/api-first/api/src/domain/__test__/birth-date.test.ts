import { describe, expect, it } from "vitest";

import { BirthDate } from "../birth-date";
import { InvalidUserInputError } from "../errors";

describe("BirthDate", () => {
  it("returns the birth date in canonical format", () => {
    expect(new BirthDate(" 1980-01-01 ").toString()).toBe("1980-01-01");
  });

  it("rejects impossible calendar dates", () => {
    expect(() => new BirthDate("2024-02-30")).toThrow(InvalidUserInputError);
  });
});
