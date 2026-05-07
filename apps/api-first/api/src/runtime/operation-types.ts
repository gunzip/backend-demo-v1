import type { Context, Env, TypedResponse } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import type { InvalidJSONValue, JSONParsed, JSONValue } from "hono/utils/types";
import type { ZodTypeAny } from "zod";
import type * as z from "zod";

export type GeneratedHttpResponse<TRouteResponse> = TRouteResponse extends {
  data: infer TData;
  status: infer TStatus extends string;
}
  ? Response &
      TypedResponse<JSONParsed<TData>, StatusCodeFromString<TStatus>, "json">
  : TRouteResponse extends { status: string }
    ? Response
    : never;

export type GeneratedOperationHandler<
  TRoute extends GeneratedServerRoute,
  TEnv extends Env = Env,
> = (
  input: GeneratedOperationInput<TRoute>,
  context: Context<TEnv>,
) => GeneratedOperationResult;

export type GeneratedOperationInput<TRoute extends GeneratedServerRoute> =
  Simplify<
    MaybeProperty<"body", InferRequestBody<TRoute["requestMap"]>> &
      MaybeProperty<
        "headers",
        ExtractInputPart<InferRouteParams<TRoute["params"]>, "headers">
      > &
      MaybeProperty<
        "params",
        ExtractInputPart<InferRouteParams<TRoute["params"]>, "path">
      > &
      MaybeProperty<
        "query",
        ExtractInputPart<InferRouteParams<TRoute["params"]>, "query">
      >
  >;

export interface GeneratedServerRoute {
  isHeadersOptional?: boolean;
  isQueryOptional?: boolean;
  method: string;
  operationId: string;
  params?: ZodTypeAny;
  path: string;
  requestMap: Record<string, ZodTypeAny>;
  responseMap: Record<string, Record<string, ZodTypeAny>>;
}

type ContentfulStatusCodeMap = {
  [TStatus in ContentfulStatusCodeString]: StatusCodeFromString<TStatus>;
};

type ContentfulStatusCodeString = `${ContentfulStatusCode}`;

type ContentTypeKey<TRequestMap extends Record<string, ZodTypeAny>> = Extract<
  keyof TRequestMap,
  string
>;

type ExtractInputPart<TValue, TKey extends string> = TValue extends object
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

type GeneratedJsonData = InvalidJSONValue | JSONValue | object;

type GeneratedOperationResult =
  | Promise<Response | TypedResponse<unknown> | undefined>
  | Response
  | TypedResponse<unknown>
  | undefined;

type InferRequestBody<TRequestMap extends Record<string, ZodTypeAny>> = [
  ContentTypeKey<TRequestMap>,
] extends [never]
  ? never
  : IsUnion<ContentTypeKey<TRequestMap>> extends true
    ? {
        [TContentType in ContentTypeKey<TRequestMap>]: {
          contentType: TContentType;
          value: z.infer<TRequestMap[TContentType]>;
        };
      }[ContentTypeKey<TRequestMap>]
    : z.infer<TRequestMap[ContentTypeKey<TRequestMap>]>;

type InferRouteParams<TParams> = TParams extends ZodTypeAny
  ? z.infer<TParams>
  : never;

type IsUnion<TValue, TAll = TValue> = TValue extends TValue
  ? [TAll] extends [TValue]
    ? false
    : true
  : never;

type JsonRouteHttpResponse<
  TData extends GeneratedJsonData,
  TStatus extends ContentfulStatusCodeString,
> = Response &
  TypedResponse<JSONParsed<TData>, StatusCodeFromString<TStatus>, "json">;

type JsonRouteResponseContext = Pick<Context, "json">;

type JsonRouteResponseInput<
  TData extends GeneratedJsonData,
  TStatus extends ContentfulStatusCodeString,
> = PayloadStatusConstraint<TData, TStatus> & {
  contentType: string;
  data: TData;
  status: TStatus;
};

type MaybeProperty<TKey extends string, TValue> = [TValue] extends [never]
  ? Record<never, never>
  : undefined extends TValue
    ? Partial<Record<TKey, Exclude<TValue, undefined>>>
    : Record<TKey, TValue>;

type PayloadStatusConstraint<
  TData extends GeneratedJsonData,
  TStatus extends ContentfulStatusCodeString,
> = TData extends { status: number }
  ? {
      data: Omit<TData, "status"> & {
        status: StatusCodeFromString<TStatus>;
      };
    }
  : unknown;

type Simplify<TValue> = Record<never, never> & {
  [TKey in keyof TValue]: TValue[TKey];
};

type StatusCodeFromString<TStatus extends string> =
  TStatus extends `${infer TCode extends StatusCode}` ? TCode : never;

export function jsonRouteResponse<
  TData extends GeneratedJsonData,
  TStatus extends ContentfulStatusCodeString,
>(
  context: JsonRouteResponseContext,
  response: JsonRouteResponseInput<TData, TStatus>,
): JsonRouteHttpResponse<TData, TStatus> {
  return context.json(response.data, contentfulStatusCode(response.status), {
    "content-type": response.contentType,
  });
}

export function jsonSuccessResponse<
  TStatus extends ContentfulStatusCodeString,
  TData extends GeneratedJsonData,
>(
  context: JsonRouteResponseContext,
  status: TStatus,
  data: JsonRouteResponseInput<TData, TStatus>["data"],
) {
  return jsonRouteResponse(context, {
    contentType: "application/json",
    data,
    status,
  } as JsonRouteResponseInput<TData, TStatus>);
}

function contentfulStatusCode<TStatus extends ContentfulStatusCodeString>(
  status: TStatus,
): ContentfulStatusCodeMap[TStatus] {
  return contentfulStatusCodes[status];
}

const errorResponseMetadata = {
  "400": {
    title: "Request validation failed",
    type: "https://example.com/problems/validation-error",
  },
  "401": {
    title: "Authentication required",
    type: "https://example.com/problems/unauthorized",
  },
  "403": {
    title: "Forbidden",
    type: "https://example.com/problems/forbidden",
  },
  "404": {
    title: "Resource not found",
    type: "https://example.com/problems/not-found",
  },
  "409": {
    title: "Conflict",
    type: "https://example.com/problems/conflict",
  },
  "422": {
    title: "Domain validation error",
    type: "https://example.com/problems/domain-error",
  },
  "500": {
    title: "Internal server error",
    type: "https://example.com/problems/internal-server-error",
  },
} as const satisfies Partial<
  Record<
    ContentfulStatusCodeString,
    {
      title: string;
      type: string;
    }
  >
>;

type ErrorResponseStatus = ContentfulStatusCodeString &
  keyof typeof errorResponseMetadata;

export function jsonErrorResponse<
  TStatus extends ErrorResponseStatus,
  TData extends { detail: string },
>(
  context: JsonRouteResponseContext,
  status: TStatus,
  data: Omit<TData, "status" | "title" | "type">,
) {
  return jsonRouteResponse(context, {
    contentType: "application/problem+json",
    data: {
      ...data,
      status: contentfulStatusCode(status),
      title: errorResponseMetadata[status].title,
      type: errorResponseMetadata[status].type,
    },
    status,
  } as JsonRouteResponseInput<
    Omit<TData, "status" | "title" | "type"> & {
      status: StatusCodeFromString<TStatus>;
      title: (typeof errorResponseMetadata)[TStatus]["title"];
      type: (typeof errorResponseMetadata)[TStatus]["type"];
    },
    TStatus
  >);
}

const contentfulStatusCodes: ContentfulStatusCodeMap = {
  "-1": -1,
  "100": 100,
  "102": 102,
  "103": 103,
  "200": 200,
  "201": 201,
  "202": 202,
  "203": 203,
  "206": 206,
  "207": 207,
  "208": 208,
  "226": 226,
  "300": 300,
  "301": 301,
  "302": 302,
  "303": 303,
  "305": 305,
  "306": 306,
  "307": 307,
  "308": 308,
  "400": 400,
  "401": 401,
  "402": 402,
  "403": 403,
  "404": 404,
  "405": 405,
  "406": 406,
  "407": 407,
  "408": 408,
  "409": 409,
  "410": 410,
  "411": 411,
  "412": 412,
  "413": 413,
  "414": 414,
  "415": 415,
  "416": 416,
  "417": 417,
  "418": 418,
  "421": 421,
  "422": 422,
  "423": 423,
  "424": 424,
  "425": 425,
  "426": 426,
  "428": 428,
  "429": 429,
  "431": 431,
  "451": 451,
  "500": 500,
  "501": 501,
  "502": 502,
  "503": 503,
  "504": 504,
  "505": 505,
  "506": 506,
  "507": 507,
  "508": 508,
  "510": 510,
  "511": 511,
};
