import { InvalidUserInputError } from "./errors";

export const FISCAL_CODE_REGEX =
  /^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;

export class FiscalCode {
  readonly value: string;

  constructor(fiscalCode: string) {
    const normalizedFiscalCode = fiscalCode.trim().toUpperCase();

    if (!FISCAL_CODE_REGEX.test(normalizedFiscalCode)) {
      throw new InvalidUserInputError(
        "fiscal_code must be a valid Italian fiscal code in canonical format"
      );
    }

    this.value = normalizedFiscalCode;
  }

  get encodedBirthYear(): string {
    return this.value.slice(6, 8);
  }

  assertBirthYearMatches(birthDate: Date): void {
    const birthYear = birthDate
      .getUTCFullYear()
      .toString()
      .slice(-2)
      .padStart(2, "0");

    if (this.encodedBirthYear !== birthYear) {
      throw new InvalidUserInputError(
        "birth_date year does not match the fiscal_code year"
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
