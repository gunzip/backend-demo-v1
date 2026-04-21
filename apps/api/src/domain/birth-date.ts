import { InvalidUserInputError } from "./errors";

const BIRTH_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class BirthDate {
  readonly value: Date;

  constructor(rawBirthDate: string) {
    const normalizedBirthDate = rawBirthDate.trim();

    if (!BIRTH_DATE_REGEX.test(normalizedBirthDate)) {
      throw new InvalidUserInputError(
        "birth_date must be a valid date in YYYY-MM-DD format"
      );
    }

    const parsedBirthDate = new Date(`${normalizedBirthDate}T00:00:00.000Z`);

    if (Number.isNaN(parsedBirthDate.getTime())) {
      throw new InvalidUserInputError("birth_date must be a real calendar date");
    }

    const [yearPart, monthPart, dayPart] = normalizedBirthDate.split("-");
    const expectedYear = Number(yearPart);
    const expectedMonth = Number(monthPart);
    const expectedDay = Number(dayPart);

    if (
      parsedBirthDate.getUTCFullYear() !== expectedYear ||
      parsedBirthDate.getUTCMonth() + 1 !== expectedMonth ||
      parsedBirthDate.getUTCDate() !== expectedDay
    ) {
      throw new InvalidUserInputError("birth_date must be a real calendar date");
    }

    this.value = parsedBirthDate;
  }

  get year(): number {
    return this.value.getUTCFullYear();
  }

  get yearTwoDigits(): string {
    return this.year.toString().slice(-2).padStart(2, "0");
  }

  hasReachedBirthday(referenceDate: Date): boolean {
    return (
      referenceDate.getUTCMonth() > this.value.getUTCMonth() ||
      (referenceDate.getUTCMonth() === this.value.getUTCMonth() &&
        referenceDate.getUTCDate() >= this.value.getUTCDate())
    );
  }

  toString(): string {
    return this.value.toISOString().slice(0, 10);
  }
}
