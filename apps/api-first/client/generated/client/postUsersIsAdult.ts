import type { GlobalConfig, ApiResponse, ApiResponseError, ApiResponseWithParse, ApiResponseWithForcedParse, RequestBody } from "./config.js";
import { globalConfig, parseResponseBody, parseApiResponseUnknownData, createForcedParseResponse } from "./config.js";
import { postUsersIsAdultRequestMap as postUsersIsAdultRequestMap, postUsersIsAdultResponseMap as postUsersIsAdultResponseMap, clientRoute as postUsersIsAdultClientRoute } from "../routes/postUsersIsAdult.js";

type PostUsersIsAdultParams<TRequestContentType extends keyof PostUsersIsAdultRequestMap = "application/json", TResponseContentType = "application/json"> = {
  body: import('zod').infer<PostUsersIsAdultRequestMap[TRequestContentType]>;
  contentType?: { request?: TRequestContentType; response?: TResponseContentType };
};

export const PostUsersIsAdultRequestMap = postUsersIsAdultRequestMap;
type PostUsersIsAdultRequestMap = typeof postUsersIsAdultRequestMap;
export const PostUsersIsAdultResponseMap = postUsersIsAdultResponseMap;
type PostUsersIsAdultResponseMap = typeof postUsersIsAdultResponseMap;

export type PostUsersIsAdultResponseDeserializerMap = Partial<Record<{
  [Status in keyof PostUsersIsAdultResponseMap]: keyof PostUsersIsAdultResponseMap[Status]
}[keyof PostUsersIsAdultResponseMap], import('./config.js').Deserializer>>;

export function postUsersIsAdult<TForceValidation extends boolean = true, TRequestContentType extends keyof PostUsersIsAdultRequestMap = "application/json", TResponseContentType extends { [K in keyof PostUsersIsAdultResponseMap]: keyof PostUsersIsAdultResponseMap[K]; }[keyof PostUsersIsAdultResponseMap] = "application/json">(
  params: PostUsersIsAdultParams<TRequestContentType, TResponseContentType>,
  config: GlobalConfig & { deserializers?: PostUsersIsAdultResponseDeserializerMap } & { forceValidation: true }
): Promise<(true extends true ? ApiResponseWithForcedParse<"200", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>) | (true extends true ? ApiResponseWithForcedParse<"400", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>) | (true extends true ? ApiResponseWithForcedParse<"422", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>) | ApiResponseError>;
export function postUsersIsAdult<TForceValidation extends boolean = true, TRequestContentType extends keyof PostUsersIsAdultRequestMap = "application/json", TResponseContentType extends { [K in keyof PostUsersIsAdultResponseMap]: keyof PostUsersIsAdultResponseMap[K]; }[keyof PostUsersIsAdultResponseMap] = "application/json">(
  params: PostUsersIsAdultParams<TRequestContentType, TResponseContentType>,
  config: GlobalConfig & { deserializers?: PostUsersIsAdultResponseDeserializerMap } & { forceValidation: false }
): Promise<(false extends true ? ApiResponseWithForcedParse<"200", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>) | (false extends true ? ApiResponseWithForcedParse<"400", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>) | (false extends true ? ApiResponseWithForcedParse<"422", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>) | ApiResponseError>;
export function postUsersIsAdult<TForceValidation extends boolean = true, TRequestContentType extends keyof PostUsersIsAdultRequestMap = "application/json", TResponseContentType extends { [K in keyof PostUsersIsAdultResponseMap]: keyof PostUsersIsAdultResponseMap[K]; }[keyof PostUsersIsAdultResponseMap] = "application/json">(
  params: PostUsersIsAdultParams<TRequestContentType, TResponseContentType>,
  config?: GlobalConfig & { deserializers?: PostUsersIsAdultResponseDeserializerMap }
): Promise<(TForceValidation extends true ? ApiResponseWithForcedParse<"200", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>) | (TForceValidation extends true ? ApiResponseWithForcedParse<"400", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>) | (TForceValidation extends true ? ApiResponseWithForcedParse<"422", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>) | ApiResponseError>;
export async function postUsersIsAdult<TForceValidation extends boolean = true, TRequestContentType extends keyof PostUsersIsAdultRequestMap = "application/json", TResponseContentType extends { [K in keyof PostUsersIsAdultResponseMap]: keyof PostUsersIsAdultResponseMap[K]; }[keyof PostUsersIsAdultResponseMap] = "application/json">(
  params: PostUsersIsAdultParams<TRequestContentType, TResponseContentType>,
  config: GlobalConfig & { deserializers?: PostUsersIsAdultResponseDeserializerMap } = globalConfig
): Promise<(TForceValidation extends true ? ApiResponseWithForcedParse<"200", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>) | (TForceValidation extends true ? ApiResponseWithForcedParse<"400", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>) | (TForceValidation extends true ? ApiResponseWithForcedParse<"422", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>) | ApiResponseError> {
    try {
  const finalRequestContentType = params.contentType?.request || "application/json";
  let bodyContent: RequestBody = "";
  let contentTypeHeader = {};

  switch (finalRequestContentType) {
    case "application/json":
      bodyContent = params.body ? JSON.stringify(params.body) : undefined;
      contentTypeHeader = { "Content-Type": "application/json" };
      break;
    default:
      bodyContent = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
      contentTypeHeader = { "Content-Type": finalRequestContentType };
  }

    const finalHeaders: Record<string, string> = {
    ...config.headers,
    "Accept": params.contentType?.response || "application/json",
    ...contentTypeHeader,
    };
    

    const url = new URL(`${config.baseURL.replace(/\/$/, '')}/users/is-adult`);
    

    /* Inner try/catch for fetch-specific errors */
    let response: Response;
    let data: unknown;
    let minimalResponse: { status: number; headers: Map<string, string> };

    try {
      response = await config.fetch(url.toString(), {
        method: "POST",
        headers: finalHeaders,
        body: bodyContent,
      });

      /*
       * The response body is consumed immediately to prevent holding onto the raw
       * response stream. A new, lightweight response object is created with only
       * the necessary properties, and headers are copied to a Map to break the
       * reference to the original response object.
       */
      data = await parseResponseBody(response);
      minimalResponse = {
        status: response.status,
        headers: new Map(response.headers.entries()),
      };
    } catch (error) {
      return {
        isValid: false,
        status: undefined,
        kind: "fetch-error",
        error,
      } as const;
    }

    /* Handle response status codes using if-else logic to support wildcard patterns */
    if (response.status === 200) {

      if (config.forceValidation) {
        /* Force validation: automatically parse and return result */
        const parseResult = parseApiResponseUnknownData(minimalResponse, data, postUsersIsAdultResponseMap["200"], config.deserializers ?? {});
        if ("parsed" in parseResult) {
          const forcedResult = createForcedParseResponse("200", data, response, parseResult);
          // Need a bridge assertion to the conditional return type because generic TForceValidation isn't narrowed by runtime branch
          return forcedResult as unknown as (TForceValidation extends true ? ApiResponseWithForcedParse<"200", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>);
        }
        if (parseResult.kind) {
          const errorResult = {
            ...parseResult,
            isValid: false as const,
            status: undefined,
            result: { data, status: "200", response },
          } satisfies ApiResponseError;
          return errorResult;
        }
        throw new Error("Invalid parse result");
      } else {
        /* Manual validation: provide parse method */
        const manualResult = {
          isValid: true as const,
          status: "200" as const,
          data,
          response,
          parse: () => parseApiResponseUnknownData(minimalResponse, data, postUsersIsAdultResponseMap["200"], config.deserializers ?? {})
        } satisfies ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>;
        return manualResult as unknown as (TForceValidation extends true ? ApiResponseWithForcedParse<"200", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"200", typeof postUsersIsAdultResponseMap>);
      }
    }
    if (response.status === 400) {

      if (config.forceValidation) {
        /* Force validation: automatically parse and return result */
        const parseResult = parseApiResponseUnknownData(minimalResponse, data, postUsersIsAdultResponseMap["400"], config.deserializers ?? {});
        if ("parsed" in parseResult) {
          const forcedResult = createForcedParseResponse("400", data, response, parseResult);
          // Need a bridge assertion to the conditional return type because generic TForceValidation isn't narrowed by runtime branch
          return forcedResult as unknown as (TForceValidation extends true ? ApiResponseWithForcedParse<"400", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>);
        }
        if (parseResult.kind) {
          const errorResult = {
            ...parseResult,
            isValid: false as const,
            status: undefined,
            result: { data, status: "400", response },
          } satisfies ApiResponseError;
          return errorResult;
        }
        throw new Error("Invalid parse result");
      } else {
        /* Manual validation: provide parse method */
        const manualResult = {
          isValid: true as const,
          status: "400" as const,
          data,
          response,
          parse: () => parseApiResponseUnknownData(minimalResponse, data, postUsersIsAdultResponseMap["400"], config.deserializers ?? {})
        } satisfies ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>;
        return manualResult as unknown as (TForceValidation extends true ? ApiResponseWithForcedParse<"400", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"400", typeof postUsersIsAdultResponseMap>);
      }
    }
    if (response.status === 422) {

      if (config.forceValidation) {
        /* Force validation: automatically parse and return result */
        const parseResult = parseApiResponseUnknownData(minimalResponse, data, postUsersIsAdultResponseMap["422"], config.deserializers ?? {});
        if ("parsed" in parseResult) {
          const forcedResult = createForcedParseResponse("422", data, response, parseResult);
          // Need a bridge assertion to the conditional return type because generic TForceValidation isn't narrowed by runtime branch
          return forcedResult as unknown as (TForceValidation extends true ? ApiResponseWithForcedParse<"422", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>);
        }
        if (parseResult.kind) {
          const errorResult = {
            ...parseResult,
            isValid: false as const,
            status: undefined,
            result: { data, status: "422", response },
          } satisfies ApiResponseError;
          return errorResult;
        }
        throw new Error("Invalid parse result");
      } else {
        /* Manual validation: provide parse method */
        const manualResult = {
          isValid: true as const,
          status: "422" as const,
          data,
          response,
          parse: () => parseApiResponseUnknownData(minimalResponse, data, postUsersIsAdultResponseMap["422"], config.deserializers ?? {})
        } satisfies ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>;
        return manualResult as unknown as (TForceValidation extends true ? ApiResponseWithForcedParse<"422", typeof postUsersIsAdultResponseMap> : ApiResponseWithParse<"422", typeof postUsersIsAdultResponseMap>);
      }
    }

    /* Handle default response or unexpected status codes */
    /* Return error for unexpected status codes instead of throwing */
    return {
      kind: "unexpected-response",
      isValid: false,
      status: undefined,
      result: {
        data,
        status: response.status.toString(),
        response,
      },
      error: `Unexpected response status: ${response.status}`,
    } as const;
  } catch (error) {
    return {
      isValid: false,
      status: undefined,
      kind: "unexpected-error",
      error,
    } as const;
  }
}