import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";

import { postUsersIsAdultHandler } from "../../adapters/http/postUsersIsAdult.js";
import type { GeneratedOperationHandler, GeneratedOperationInput, GeneratedOperationResponse } from "../../runtime/operation-types.js";
import { validationHook } from "../../runtime/http-problem-details.js";
import { serverRoute as postUsersIsAdultServerRoute } from "../../../generated/routes/postUsersIsAdult.js";

export type PostUsersIsAdultRoute = typeof postUsersIsAdultServerRoute;
export type PostUsersIsAdultHandlerInput = GeneratedOperationInput<PostUsersIsAdultRoute>;
export type PostUsersIsAdultHandlerResponse = GeneratedOperationResponse<PostUsersIsAdultRoute>;
export type PostUsersIsAdultHandler = GeneratedOperationHandler<PostUsersIsAdultRoute>;

export function registerPostUsersIsAdultRoute<TApp extends Hono>(app: TApp) {
  return app.post(
      "/users/is-adult",
      zValidator("json", postUsersIsAdultServerRoute.requestMap["application/json"], validationHook),
    async (context) => {
      const input = {
        body: context.req.valid("json"),
      } satisfies PostUsersIsAdultHandlerInput;

      return postUsersIsAdultHandler(input, context);
    },
  );
}
