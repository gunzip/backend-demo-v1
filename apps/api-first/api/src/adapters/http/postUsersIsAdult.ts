import type { postUsersIsAdultRouteResponse as PostUsersIsAdultRouteResponse } from "../../../generated/routes/postUsersIsAdult.js";
import type { PostUsersIsAdultHandler } from "../../generated/operations/postUsersIsAdult.js";
import type { GeneratedHttpResponse } from "../../runtime/operation-types.js";
import type { CheckUserIsAdultInput } from "../../use-cases/check-user-is-adult.js";

import { checkUserIsAdult } from "../../use-cases/check-user-is-adult.js";

type CheckUserIsAdultResult = Awaited<ReturnType<typeof checkUserIsAdult>>;

type PostUsersIsAdultContext = Parameters<PostUsersIsAdultHandler>[1];

type PostUsersIsAdultDomainErrorResponse = Extract<
  PostUsersIsAdultRouteResponse,
  { status: "422" }
>;

type PostUsersIsAdultHttpResponse =
  GeneratedHttpResponse<PostUsersIsAdultMappedResponse>;

type PostUsersIsAdultMappedResponse =
  | PostUsersIsAdultDomainErrorResponse
  | PostUsersIsAdultSuccessResponse;

type PostUsersIsAdultSuccessResponse = Extract<
  PostUsersIsAdultRouteResponse,
  { status: "200" }
>;

export const postUsersIsAdultHandler: PostUsersIsAdultHandler = async (
  input,
  context,
) => {
  const result = await checkUserIsAdult(mapPostUsersIsAdultInput(input));
  const mappedResponse = mapCheckUserIsAdultResult(result);

  return toPostUsersIsAdultResponse(context, mappedResponse);
};

function assertNever(value: never): never {
  throw new Error(`Unsupported response mapping: ${String(value)}`);
}

function mapCheckUserIsAdultResult(
  result: CheckUserIsAdultResult,
): PostUsersIsAdultMappedResponse {
  return result.match(
    (isAdult) =>
      ({
        contentType: "application/json",
        data: isAdult,
        status: "200",
      }) satisfies PostUsersIsAdultSuccessResponse,
    (error) =>
      ({
        contentType: "application/problem+json",
        data: {
          detail: error.message,
          status: 422,
          title: "Domain validation error",
          type: "https://example.com/problems/domain-error",
        },
        status: "422",
      }) satisfies PostUsersIsAdultDomainErrorResponse,
  );
}

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
  response: PostUsersIsAdultMappedResponse,
): PostUsersIsAdultHttpResponse {
  switch (response.status) {
    case "200":
      return context.json(response.data, 200, {
        "content-type": response.contentType,
      });
    case "422":
      return context.json(response.data, 422, {
        "content-type": response.contentType,
      });
    default:
      return assertNever(response);
  }
}
