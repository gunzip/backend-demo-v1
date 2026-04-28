import type { Context, Env, TypedResponse } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import type { JSONParsed } from "hono/utils/types";
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

type ContentTypeKey<TRequestMap extends Record<string, ZodTypeAny>> = Extract<
  keyof TRequestMap,
  string
>;

type ExtractInputPart<TValue, TKey extends string> = TValue extends object
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

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

type MaybeProperty<TKey extends string, TValue> = [TValue] extends [never]
  ? Record<never, never>
  : undefined extends TValue
    ? Partial<Record<TKey, Exclude<TValue, undefined>>>
    : Record<TKey, TValue>;

type Simplify<TValue> = Record<never, never> & {
  [TKey in keyof TValue]: TValue[TKey];
};

type StatusCodeFromString<TStatus extends string> =
  TStatus extends `${infer TCode extends StatusCode}` ? TCode : never;
