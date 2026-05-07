import { AdultCheckRequest } from "../schemas/AdultCheckRequest.js";
import { PostUsersIsAdult200Response } from "../schemas/PostUsersIsAdult200Response.js";
import { ValidationError } from "../schemas/ValidationError.js";
import { ProblemDetails } from "../schemas/ProblemDetails.js";

import {
  postUsersIsAdultParsedParams,
  postUsersIsAdultServerParsedParams,
} from "../schemas/postUsersIsAdultParameters.js";

export const postUsersIsAdultRequestMap = {
  "application/json": AdultCheckRequest,
} as const;
export type postUsersIsAdultRequestMap = typeof postUsersIsAdultRequestMap;

export const postUsersIsAdultResponseMap = {
  "200": {
    "application/json": PostUsersIsAdult200Response,
  },
  "400": {
    "application/problem+json": ValidationError,
  },
  "401": {
    "application/problem+json": ProblemDetails,
  },
  "422": {
    "application/problem+json": ProblemDetails,
  },
} as const;
export type postUsersIsAdultResponseMap = typeof postUsersIsAdultResponseMap;

export type postUsersIsAdultRouteResponse =
  | { status: "200"; contentType: "application/json"; data: PostUsersIsAdult200Response; }
  | { status: "400"; contentType: "application/problem+json"; data: ValidationError; }
  | { status: "401"; contentType: "application/problem+json"; data: ProblemDetails; }
  | { status: "422"; contentType: "application/problem+json"; data: ProblemDetails; };

const baseRoute = {
  path: "/users/is-adult",
  method: "post",
  operationId: "postUsersIsAdult",
  requestMap: postUsersIsAdultRequestMap,
  responseMap: postUsersIsAdultResponseMap,
} as const;

export const clientRoute = {
  ...baseRoute,
  params: postUsersIsAdultParsedParams,
  isQueryOptional: true,
  isHeadersOptional: true,
} as const;

export const serverRoute = {
  ...baseRoute,
  params: postUsersIsAdultServerParsedParams,
  isQueryOptional: true,
  isHeadersOptional: false,
} as const;