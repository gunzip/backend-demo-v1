import type { ZodTypeAny } from "zod";

import type {
  GeneratedHttpRequest,
  GeneratedHttpResponseInit,
  GeneratedOperationInput,
  GeneratedServerRoute,
} from "./operation-types.js";

import { problemJson, validationProblemJson } from "./http-problem-details.js";

type RequestParsingResult<T> =
  | { ok: false; response: GeneratedHttpResponseInit }
  | { ok: true; value: T };

export async function parseHttpRequest<TRoute extends GeneratedServerRoute>(
  request: GeneratedHttpRequest,
  route: TRoute,
): Promise<RequestParsingResult<GeneratedOperationInput<TRoute>>> {
  const input: Record<string, unknown> = {};

  const bodyResult = await parseRequestBody(request, route.requestMap);
  if (!bodyResult.ok) {
    return bodyResult;
  }
  if (bodyResult.value !== undefined) {
    input.body = bodyResult.value;
  }

  const headerSchema = route.params?.shape?.headers;
  const headersResult = parseRequestPart(
    "header",
    headerSchema,
    headersToObject(request.headers),
  );
  if (!headersResult.ok) {
    return headersResult;
  }
  if (headersResult.value !== undefined) {
    input.headers = headersResult.value;
  }

  const pathSchema = route.params?.shape?.path;
  const pathResult = parseRequestPart("path", pathSchema, request.params);
  if (!pathResult.ok) {
    return pathResult;
  }
  if (pathResult.value !== undefined) {
    input.params = pathResult.value;
  }

  const querySchema = route.params?.shape?.query;
  const queryResult = parseRequestPart(
    "query",
    querySchema,
    searchParamsToObject(request.query),
  );
  if (!queryResult.ok) {
    return queryResult;
  }
  if (queryResult.value !== undefined) {
    input.query = queryResult.value;
  }

  return {
    ok: true,
    value: input as GeneratedOperationInput<TRoute>,
  };
}

function formDataToObject(formData: FormData) {
  const result: Record<string, (File | string)[] | File | string> = {};

  for (const [key, value] of formData.entries()) {
    const existingValue = result[key];

    if (existingValue === undefined) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(existingValue)) {
      existingValue.push(value);
      continue;
    }

    result[key] = [existingValue, value];
  }

  return result;
}

function headersToObject(headers: Headers) {
  return Object.fromEntries(headers.entries());
}

function normalizeContentType(contentType: string) {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? contentType;
}

async function parseRequestBody(
  request: GeneratedHttpRequest,
  requestMap: Record<string, ZodTypeAny>,
): Promise<RequestParsingResult<undefined | unknown>> {
  const supportedContentTypes = Object.keys(requestMap);

  if (supportedContentTypes.length === 0) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const matchedContentType = resolveRequestContentType(
    request.headers.get("content-type"),
    supportedContentTypes,
  );

  if (matchedContentType === undefined) {
    return {
      ok: false,
      response: problemJson({
        detail: `Unsupported or missing Content-Type header. Expected one of: ${supportedContentTypes.join(", ")}.`,
        status: 400,
        title: "Request validation failed",
        type: "https://example.com/problems/validation-error",
      }),
    };
  }

  const schema = requestMap[matchedContentType];

  if (schema === undefined) {
    throw new Error(
      `Missing body schema for content type ${matchedContentType}`,
    );
  }

  const rawBodyResult = await readRequestBody(request, matchedContentType);
  if (!rawBodyResult.ok) {
    return rawBodyResult;
  }

  const parsedBody = schema.safeParse(rawBodyResult.value);
  if (!parsedBody.success) {
    return {
      ok: false,
      response: validationProblemJson(
        rawBodyResult.target ?? "body",
        parsedBody.error.issues,
      ),
    };
  }

  if (supportedContentTypes.length === 1) {
    return {
      ok: true,
      value: parsedBody.data,
    };
  }

  return {
    ok: true,
    value: {
      contentType: matchedContentType,
      value: parsedBody.data,
    },
  };
}

function parseRequestPart(
  target: "header" | "path" | "query",
  schema: undefined | ZodTypeAny,
  rawValue: Record<string, unknown>,
): RequestParsingResult<undefined | unknown> {
  if (schema === undefined) {
    return {
      ok: true,
      value: undefined,
    };
  }

  const value = Object.keys(rawValue).length === 0 ? undefined : rawValue;
  const parsedValue = schema.safeParse(value);

  if (!parsedValue.success) {
    return {
      ok: false,
      response: validationProblemJson(target, parsedValue.error.issues),
    };
  }

  return {
    ok: true,
    value: parsedValue.data,
  };
}

async function readRequestBody(
  request: GeneratedHttpRequest,
  contentType: string,
): Promise<RequestParsingResult<unknown> & { target?: "form" | "json" }> {
  const normalizedContentType = normalizeContentType(contentType);

  if (
    normalizedContentType === "application/json" ||
    normalizedContentType.endsWith("+json")
  ) {
    try {
      return {
        ok: true,
        target: "json",
        value: await request.json(),
      };
    } catch {
      return {
        ok: false,
        response: problemJson({
          detail: "The request body is not valid JSON.",
          status: 400,
          title: "Request validation failed",
          type: "https://example.com/problems/validation-error",
        }),
      };
    }
  }

  if (
    normalizedContentType === "application/x-www-form-urlencoded" ||
    normalizedContentType === "multipart/form-data"
  ) {
    try {
      return {
        ok: true,
        target: "form",
        value: formDataToObject(await request.formData()),
      };
    } catch {
      return {
        ok: false,
        response: problemJson({
          detail: "The request body is not valid form data.",
          status: 400,
          title: "Request validation failed",
          type: "https://example.com/problems/validation-error",
        }),
      };
    }
  }

  return {
    ok: false,
    response: problemJson({
      detail: `Unsupported request body content type ${contentType}.`,
      status: 400,
      title: "Request validation failed",
      type: "https://example.com/problems/validation-error",
    }),
  };
}

function resolveRequestContentType(
  requestContentType: null | string,
  supportedContentTypes: string[],
) {
  if (requestContentType === null) {
    return supportedContentTypes[0];
  }

  const normalizedRequestContentType = normalizeContentType(requestContentType);

  return supportedContentTypes.find(
    (supportedContentType) =>
      normalizeContentType(supportedContentType) ===
      normalizedRequestContentType,
  );
}

function searchParamsToObject(searchParams: URLSearchParams) {
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    const existingValue = result[key];

    if (existingValue === undefined) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(existingValue)) {
      existingValue.push(value);
      continue;
    }

    result[key] = [existingValue, value];
  }

  return result;
}
