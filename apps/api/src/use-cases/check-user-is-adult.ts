import { okAsync, Result, type ResultAsync } from "neverthrow";
import { FiscalCode } from "../domain/fiscal-code";
import { InvalidUserInputError } from "../domain/errors";
import { User } from "../domain/user";

export type CheckUserIsAdultInput = {
  fiscalCode: string;
  birthDate: string;
  referenceDate?: Date;
};

const BIRTH_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function mapInvalidUserInputError(error: unknown): InvalidUserInputError {
  if (error instanceof InvalidUserInputError) {
    return error;
  }

  // Unrecognized error
  throw error;
}

const parseBirthDateResult = Result.fromThrowable(
  parseBirthDate,
  mapInvalidUserInputError,
);

const createFiscalCodeResult = Result.fromThrowable(
  (fiscalCode: string) => new FiscalCode(fiscalCode),
  mapInvalidUserInputError,
);

const createUserResult = Result.fromThrowable(
  ({ birthDate, fiscalCode }: { birthDate: Date; fiscalCode: FiscalCode }) => {
    fiscalCode.assertBirthYearMatches(birthDate);
    return new User(fiscalCode, birthDate);
  },
  mapInvalidUserInputError,
);

export function parseBirthDate(rawBirthDate: string): Date {
  const normalizedBirthDate = rawBirthDate.trim();

  if (!BIRTH_DATE_REGEX.test(normalizedBirthDate)) {
    throw new InvalidUserInputError(
      "birth_date must be a valid date in YYYY-MM-DD format",
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

  return parsedBirthDate;
}

export function checkUserIsAdult({
  birthDate,
  fiscalCode,
  referenceDate,
}: CheckUserIsAdultInput): ResultAsync<boolean, InvalidUserInputError> {
  return parseBirthDateResult(birthDate)
    .andThen((parsedBirthDate) =>
      createFiscalCodeResult(fiscalCode).map((normalizedFiscalCode) => ({
        parsedBirthDate,
        normalizedFiscalCode,
      })),
    )
    .andThen(({ parsedBirthDate, normalizedFiscalCode }) =>
      createUserResult({
        birthDate: parsedBirthDate,
        fiscalCode: normalizedFiscalCode,
      }),
    )
    .asyncAndThen((user) => okAsync(user.isAdult(referenceDate)));
}
