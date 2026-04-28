import type { BirthDate } from "./birth-date";

import { InvalidUserInputError } from "./errors";

export const FISCAL_CODE_REGEX =
  /^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;

export class FiscalCode {
  readonly value: string;

  get encodedBirthYear(): string {
    return this.value.slice(6, 8);
  }

  constructor(fiscalCode: string) {
    const normalizedFiscalCode = fiscalCode.trim().toUpperCase();

    if (!FISCAL_CODE_REGEX.test(normalizedFiscalCode)) {
      throw new InvalidUserInputError(
        "fiscal_code must be a valid Italian fiscal code in canonical format",
      );
    }

    this.value = normalizedFiscalCode;
  }

  assertBirthYearMatches(birthDate: BirthDate): void {
    if (this.encodedBirthYear !== birthDate.yearTwoDigits) {
      throw new InvalidUserInputError(
        "birth_date year does not match the fiscal_code year",
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
