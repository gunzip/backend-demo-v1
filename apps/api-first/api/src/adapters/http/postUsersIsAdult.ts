import type { postUsersIsAdultRouteResponse as PostUsersIsAdultRouteResponse } from "../../../generated/routes/postUsersIsAdult.js";
import type { PostUsersIsAdultHandler } from "../../generated/operations/postUsersIsAdult.js";
import type { GeneratedHttpResponse } from "../../runtime/operation-types.js";
import type { CheckUserIsAdultInput } from "../../use-cases/check-user-is-adult.js";

import { checkUserIsAdult } from "../../use-cases/check-user-is-adult.js";

type PostUsersIsAdultContext = Parameters<PostUsersIsAdultHandler>[1];

type PostUsersIsAdultHttpResponse = GeneratedHttpResponse<
  Extract<PostUsersIsAdultRouteResponse, { status: "200" | "422" }>
>;

export const postUsersIsAdultHandler: PostUsersIsAdultHandler = async (
  input,
  context,
) => {
  const result = await checkUserIsAdult(mapPostUsersIsAdultInput(input));
  return toPostUsersIsAdultResponse(context, result);
};

function mapPostUsersIsAdultInput(
  input: Parameters<PostUsersIsAdultHandler>[0],
): CheckUserIsAdultInput {
  return {
    birthDate: input.body.birth_date,
    fiscalCode: input.body.fiscal_code,
  };
}

function toPostUsersIsAdultResponse(
  context: PostUsersIsAdultContext,
  result: Awaited<ReturnType<typeof checkUserIsAdult>>,
): PostUsersIsAdultHttpResponse {
  return result.match(
    (isAdult) => {
      const response: Extract<
        PostUsersIsAdultRouteResponse,
        { status: "200" }
      > = {
        contentType: "application/json",
        data: isAdult,
        status: "200",
      };
      return context.json(response.data, 200, {
        "content-type": response.contentType,
      });
    },
    (error) => {
      const response: Extract<
        PostUsersIsAdultRouteResponse,
        { status: "422" }
      > = {
        contentType: "application/problem+json",
        data: {
          detail: error.message,
          status: 422,
          title: "Domain validation error",
          type: "https://example.com/problems/domain-error",
        },
        status: "422",
      };
      return context.json(response.data, 422, {
        "content-type": response.contentType,
      });
    },
  );
}
