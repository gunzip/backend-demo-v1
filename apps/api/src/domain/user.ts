import type { FiscalCode } from "./fiscal-code";

const ADULT_AGE = 18;

export class User {
  constructor(
    readonly fiscalCode: FiscalCode,
    readonly birthDate: Date
  ) {}

  isAdult(referenceDate: Date = new Date()): boolean {
    const birthYear = this.birthDate.getUTCFullYear();
    let age = referenceDate.getUTCFullYear() - birthYear;

    const hasReachedBirthday =
      referenceDate.getUTCMonth() > this.birthDate.getUTCMonth() ||
      (referenceDate.getUTCMonth() === this.birthDate.getUTCMonth() &&
        referenceDate.getUTCDate() >= this.birthDate.getUTCDate());

    if (!hasReachedBirthday) {
      age -= 1;
    }

    return age >= ADULT_AGE;
  }
}
