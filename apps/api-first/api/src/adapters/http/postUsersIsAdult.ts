import type { PostUsersIsAdultHandler } from "../../generated/operations/postUsersIsAdult.js";

import {
  jsonErrorResponse,
  jsonSuccessResponse,
} from "../../runtime/operation-types.js";
import { checkUserIsAdult } from "../../use-cases/check-user-is-adult.js";

export const postUsersIsAdultHandler: PostUsersIsAdultHandler = async (
  input,
  context,
) => {
  const result = await checkUserIsAdult({
    birthDate: input.body.birth_date,
    fiscalCode: input.body.fiscal_code,
  });
  return result.match(
    (isAdult) => jsonSuccessResponse(context, "200", isAdult),
    (error) =>
      jsonErrorResponse(context, "422", {
        detail: error.message,
      }),
  );
};
