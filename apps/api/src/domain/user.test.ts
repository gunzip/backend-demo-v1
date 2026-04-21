import { describe, expect, it } from "vitest";
import { FiscalCode } from "./fiscal-code";
import { User } from "./user";

describe("User.isAdult", () => {
  it("returns true when the user is already 18", () => {
    const result = new User(
      new FiscalCode("RSSMRA00A01H501U"),
      new Date("2000-01-01T00:00:00.000Z")
    ).isAdult(
      new Date("2026-01-02T00:00:00.000Z")
    );

    expect(result).toBe(true);
  });

  it("returns false when the user is still underage", () => {
    const result = new User(
      new FiscalCode("RSSMRA10R01H501U"),
      new Date("2010-10-01T00:00:00.000Z")
    ).isAdult(
      new Date("2026-01-01T00:00:00.000Z")
    );

    expect(result).toBe(false);
  });
});
