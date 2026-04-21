import type { BirthDate } from "./birth-date";
import type { FiscalCode } from "./fiscal-code";

const ADULT_AGE = 18;

export class User {
  constructor(
    readonly fiscalCode: FiscalCode,
    readonly birthDate: BirthDate
  ) {}

  isAdult(referenceDate: Date = new Date()): boolean {
    const birthYear = this.birthDate.year;
    let age = referenceDate.getUTCFullYear() - birthYear;

    if (!this.birthDate.hasReachedBirthday(referenceDate)) {
      age -= 1;
    }

    return age >= ADULT_AGE;
  }
}
