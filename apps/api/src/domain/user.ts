import type { FiscalCode } from "./fiscal-code";

export type User = {
  fiscalCode: FiscalCode;
  birthDate: Date;
};

const ADULT_AGE = 18;

export function isAdult(user: User, referenceDate: Date = new Date()): boolean {
  const birthYear = user.birthDate.getUTCFullYear();
  let age = referenceDate.getUTCFullYear() - birthYear;

  const hasReachedBirthday =
    referenceDate.getUTCMonth() > user.birthDate.getUTCMonth() ||
    (referenceDate.getUTCMonth() === user.birthDate.getUTCMonth() &&
      referenceDate.getUTCDate() >= user.birthDate.getUTCDate());

  if (!hasReachedBirthday) {
    age -= 1;
  }

  return age >= ADULT_AGE;
}
