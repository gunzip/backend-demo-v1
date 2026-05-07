import type { postUsersIsAdultRouteResponse } from "../../../generated/routes/postUsersIsAdult.js";
import type { PostUsersIsAdultHandler } from "../../generated/operations/postUsersIsAdult.js";
import type { GeneratedHttpResponse } from "../../runtime/operation-types.js";

import {
  jsonErrorResponse,
  jsonSuccessResponse,
} from "../../runtime/operation-types.js";
import { checkUserIsAdult } from "../../use-cases/check-user-is-adult.js";

type PostUsersIsAdultHttpResponse =
  GeneratedHttpResponse<postUsersIsAdultRouteResponse>;

export const postUsersIsAdultHandler: PostUsersIsAdultHandler = async (
  input,
  context,
): Promise<PostUsersIsAdultHttpResponse> => {
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
