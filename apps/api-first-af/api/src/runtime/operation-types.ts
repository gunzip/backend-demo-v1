import type { ZodTypeAny } from "zod";
import type * as z from "zod";

export interface GeneratedHttpRequest {
  formData(): Promise<FormData>;
  readonly headers: Headers;
  json(): Promise<unknown>;
  readonly method: string;
  readonly params: Record<string, string>;
  readonly query: URLSearchParams;
  text(): Promise<string>;
  readonly url: string;
}

export interface GeneratedHttpResponseInit {
  body?: string;
  headers?: Record<string, string>;
  jsonBody?: unknown;
  status?: number;
}

export interface GeneratedInvocationContext {
  log(...args: unknown[]): void;
}

export type GeneratedOperationHandler<TRoute extends GeneratedServerRoute> = (
  input: GeneratedOperationInput<TRoute>,
  context: GeneratedInvocationContext,
  request: GeneratedHttpRequest,
) => GeneratedOperationResult<GeneratedOperationResponse<TRoute>>;

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

export type GeneratedOperationResponse<TRoute extends GeneratedServerRoute> =
  TRoute extends GeneratedServerRoute ? GeneratedHttpResponseInit : never;

export interface GeneratedServerRoute {
  isHeadersOptional?: boolean;
  isQueryOptional?: boolean;
  method: string;
  operationId: string;
  params?: ZodTypeAny & {
    shape?: Record<string, ZodTypeAny>;
  };
  path: string;
  requestMap: Record<string, ZodTypeAny>;
  responseMap: Record<string, Record<string, ZodTypeAny>>;
}

type ContentTypeKey<TRequestMap extends Record<string, ZodTypeAny>> = Extract<
  keyof TRequestMap,
  string
>;

type ExtractInputPart<TValue, TKey extends string> = TValue extends object
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

type GeneratedOperationResult<
  TResponse extends GeneratedHttpResponseInit = GeneratedHttpResponseInit,
> = Promise<TResponse> | TResponse;

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

type MaybeProperty<TKey extends string, TValue> = [TValue] extends [never]
  ? Record<never, never>
  : undefined extends TValue
    ? Partial<Record<TKey, Exclude<TValue, undefined>>>
    : Record<TKey, TValue>;

type Simplify<TValue> = Record<never, never> & {
  [TKey in keyof TValue]: TValue[TKey];
};

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
} as const;

type ErrorResponseStatus = keyof typeof errorResponseMetadata;

export function jsonErrorResponse<
  TStatus extends ErrorResponseStatus,
  TData extends { detail: string },
>(status: TStatus, data: Omit<TData, "status" | "title" | "type">) {
  return jsonRouteResponse({
    contentType: "application/problem+json",
    data: {
      ...data,
      status: Number.parseInt(status, 10),
      title: errorResponseMetadata[status].title,
      type: errorResponseMetadata[status].type,
    },
    status,
  });
}

export function jsonRouteResponse<TData>(response: {
  contentType: string;
  data: TData;
  status: string;
}): GeneratedHttpResponseInit {
  return {
    headers: {
      "content-type": response.contentType,
    },
    jsonBody: response.data,
    status: Number.parseInt(response.status, 10),
  };
}

export function jsonSuccessResponse<TData>(status: string, data: TData) {
  return jsonRouteResponse({
    contentType: "application/json",
    data,
    status,
  });
}
