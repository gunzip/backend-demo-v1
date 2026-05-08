import { postUsersIsAdultHandler } from "../../adapters/http/postUsersIsAdult.js";
import { parseHttpRequest } from "../../runtime/http-request.js";
import type { GeneratedHttpRequest, GeneratedInvocationContext, GeneratedOperationHandler, GeneratedOperationInput, GeneratedOperationResponse } from "../../runtime/operation-types.js";
import { serverRoute as postUsersIsAdultServerRoute } from "../../../generated/routes/postUsersIsAdult.js";

export type PostUsersIsAdultRoute = typeof postUsersIsAdultServerRoute;
export type PostUsersIsAdultHandlerInput = GeneratedOperationInput<PostUsersIsAdultRoute>;
export type PostUsersIsAdultHandlerResponse = GeneratedOperationResponse<PostUsersIsAdultRoute>;
export type PostUsersIsAdultHandler = GeneratedOperationHandler<PostUsersIsAdultRoute>;

export const postUsersIsAdultFunctionHandler = async (
  request: GeneratedHttpRequest,
  context: GeneratedInvocationContext,
) => {
  const parsedRequest = await parseHttpRequest(request, postUsersIsAdultServerRoute);

  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  return postUsersIsAdultHandler(parsedRequest.value, context, request);
};

export function registerPostUsersIsAdultFunction(
  app: typeof import("@azure/functions").app,
) {
  app.http("postUsersIsAdult", {
    authLevel: "function",
    methods: ["POST"],
    route: "users/is-adult",
    handler: postUsersIsAdultFunctionHandler,
  });
}
