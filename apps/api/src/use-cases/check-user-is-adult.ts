import { okAsync, Result, type ResultAsync } from "neverthrow";
import { BirthDate } from "../domain/birth-date";
import { FiscalCode } from "../domain/fiscal-code";
import { InvalidUserInputError } from "../domain/errors";
import { User } from "../domain/user";

export type CheckUserIsAdultInput = {
  fiscalCode: string;
  birthDate: string;
  referenceDate?: Date;
};

function mapInvalidUserInputError(error: unknown): InvalidUserInputError {
  if (error instanceof InvalidUserInputError) {
    return error;
  }

  // Unrecognized error
  throw error;
}

const createBirthDateResult = Result.fromThrowable(
  (birthDate: string) => new BirthDate(birthDate),
  mapInvalidUserInputError,
);

const createFiscalCodeResult = Result.fromThrowable(
  (fiscalCode: string) => new FiscalCode(fiscalCode),
  mapInvalidUserInputError,
);

const createUserResult = Result.fromThrowable(
  ({
    birthDate,
    fiscalCode,
  }: {
    birthDate: BirthDate;
    fiscalCode: FiscalCode;
  }) => {
    fiscalCode.assertBirthYearMatches(birthDate);
    return new User(fiscalCode, birthDate);
  },
  mapInvalidUserInputError,
);

export function checkUserIsAdult({
  birthDate,
  fiscalCode,
  referenceDate,
}: CheckUserIsAdultInput): ResultAsync<boolean, InvalidUserInputError> {
  return createBirthDateResult(birthDate)
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
