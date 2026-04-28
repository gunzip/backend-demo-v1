import { okAsync, Result } from "neverthrow";

import { BirthDate } from "../domain/birth-date";
import { InvalidUserInputError } from "../domain/errors";
import { FiscalCode } from "../domain/fiscal-code";
import { User } from "../domain/user";

export interface CheckUserIsAdultInput {
  birthDate: string;
  fiscalCode: string;
  referenceDate?: Date;
}

function mapInvalidUserInputError(error: unknown) {
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
}: CheckUserIsAdultInput) {
  return createBirthDateResult(birthDate)
    .andThen((parsedBirthDate) =>
      createFiscalCodeResult(fiscalCode).map((normalizedFiscalCode) => ({
        normalizedFiscalCode,
        parsedBirthDate,
      })),
    )
    .andThen(({ normalizedFiscalCode, parsedBirthDate }) =>
      createUserResult({
        birthDate: parsedBirthDate,
        fiscalCode: normalizedFiscalCode,
      }),
    )
    .asyncAndThen((user) => okAsync(user.isAdult(referenceDate)));
}
