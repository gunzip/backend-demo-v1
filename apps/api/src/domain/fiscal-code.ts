import { InvalidUserInputError } from "./errors";

export const FISCAL_CODE_REGEX =
  /^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;

export function normalizeFiscalCode(fiscalCode: string): string {
  const normalizedFiscalCode = fiscalCode.trim().toUpperCase();

  if (!FISCAL_CODE_REGEX.test(normalizedFiscalCode)) {
    throw new InvalidUserInputError(
      "fiscal_code must be a valid Italian fiscal code in canonical format"
    );
  }

  return normalizedFiscalCode;
}

export function assertFiscalCodeBirthYearMatches(
  fiscalCode: string,
  birthDate: Date
): void {
  const encodedYear = fiscalCode.slice(6, 8);
  const birthYear = birthDate
    .getUTCFullYear()
    .toString()
    .slice(-2)
    .padStart(2, "0");

  if (encodedYear !== birthYear) {
    throw new InvalidUserInputError(
      "birth_date year does not match the fiscal_code year"
    );
  }
}
