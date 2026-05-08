import type { PostUsersIsAdultHandler } from "../../generated/operations/postUsersIsAdult.js";

import {
  jsonErrorResponse,
  jsonSuccessResponse,
} from "../../runtime/operation-types.js";
import {
  jsonSessionErrorResponse,
  validateSession,
} from "../../runtime/session.js";
import { checkUserIsAdult } from "../../use-cases/check-user-is-adult.js";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  throw error;
}

export const postUsersIsAdultHandler: PostUsersIsAdultHandler = async (
  input,
) => {
  if (!validateSession(input.headers.authorization)) {
    return jsonSessionErrorResponse();
  }

  const result = await checkUserIsAdult({
    birthDate: input.body.birth_date,
    fiscalCode: input.body.fiscal_code,
  });

  return result.match(
    (isAdult) => jsonSuccessResponse("200", isAdult),
    (error) =>
      jsonErrorResponse("422", {
        detail: toErrorMessage(error),
      }),
  );
};
