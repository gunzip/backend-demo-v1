import type { postUsersIsAdultRouteResponse } from "../../../generated/routes/postUsersIsAdult.js";
import type { PostUsersIsAdultHandler } from "../../generated/operations/postUsersIsAdult.js";
import type { GeneratedHttpResponse } from "../../runtime/operation-types.js";

import { jsonRouteResponse } from "../../runtime/operation-types.js";
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
    (isAdult) =>
      jsonRouteResponse(context, {
        contentType: "application/json",
        data: isAdult,
        status: "200",
      }),
    (error) =>
      jsonRouteResponse(context, {
        contentType: "application/problem+json",
        data: {
          detail: error.message,
          status: 422,
          title: "Domain validation error",
          type: "https://example.com/problems/domain-error",
        },
        status: "422",
      }),
  );
};
