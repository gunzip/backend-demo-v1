import {
  access,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface GenerateHonoServerOptions {
  projectRoot: string;
}

interface BodyValidatorDefinition {
  contentType: string;
  target: Extract<ValidatorTarget, "form" | "json">;
}

interface OperationDefinition {
  bodyValidator?: BodyValidatorDefinition;
  handlerExportName: string;
  honoPath: string;
  inputAssignments: string[];
  method: string;
  moduleBasename: string;
  operationId: string;
  operationTypeName: string;
  routeImportPath: string;
  validators: string[];
}

interface RouteDefinition {
  method: string;
  operationId?: string;
  params?: {
    shape?: Record<string, unknown>;
  };
  path: string;
  requestMap: Record<string, unknown>;
  responseMap: Record<string, Record<string, unknown>>;
}

type ValidatorTarget = "form" | "header" | "json" | "param" | "query";

export async function generateHonoServer({
  projectRoot,
}: GenerateHonoServerOptions) {
  const generatedRoutesDirPath = path.join(projectRoot, "generated", "routes");
  const generatedOperationsDirPath = path.join(
    projectRoot,
    "src",
    "generated",
    "operations",
  );
  const generatedRegisterRoutesFilePath = path.join(
    projectRoot,
    "src",
    "generated",
    "register-routes.ts",
  );
  const httpAdaptersDirPath = path.join(projectRoot, "src", "adapters", "http");

  const operations = await loadOperations(generatedRoutesDirPath);

  await rm(generatedOperationsDirPath, { force: true, recursive: true });
  await mkdir(generatedOperationsDirPath, { recursive: true });
  await mkdir(path.dirname(generatedRegisterRoutesFilePath), {
    recursive: true,
  });
  await mkdir(httpAdaptersDirPath, { recursive: true });

  for (const operation of operations) {
    const generatedOperationFilePath = path.join(
      generatedOperationsDirPath,
      `${operation.moduleBasename}.ts`,
    );
    const handlerFilePath = path.join(
      httpAdaptersDirPath,
      `${operation.moduleBasename}.ts`,
    );

    await writeFileIfChanged(
      generatedOperationFilePath,
      buildGeneratedOperationFile(operation),
    );
    await writeFileIfMissing(handlerFilePath, buildHandlerStub(operation));
  }

  await writeFileIfChanged(
    generatedRegisterRoutesFilePath,
    buildRegisterRoutesFile(operations),
  );
}

function buildGeneratedOperationFile(operation: OperationDefinition) {
  const routeIdentifier = `${toCamelCase(operation.moduleBasename)}ServerRoute`;
  const registerFunctionName = `register${toPascalCase(operation.moduleBasename)}Route`;
  const handlerInputTypeName = `${toPascalCase(operation.moduleBasename)}HandlerInput`;
  const handlerTypeName = `${toPascalCase(operation.moduleBasename)}Handler`;
  const registerExpression = buildRegistrationExpression(
    operation.method,
    operation.honoPath,
    operation.validators,
  );
  const inputObject = buildInputObject(operation.inputAssignments);

  return [
    'import { zValidator } from "@hono/zod-validator";',
    'import type { Hono } from "hono";',
    "",
    `import { ${operation.handlerExportName} } from "../../adapters/http/${operation.moduleBasename}.js";`,
    'import type { GeneratedOperationHandler, GeneratedOperationInput } from "../../runtime/operation-types.js";',
    'import { validationHook } from "../../runtime/http-problem-details.js";',
    `import { serverRoute as ${routeIdentifier} } from "${operation.routeImportPath}";`,
    "",
    `export type ${operation.operationTypeName} = typeof ${routeIdentifier};`,
    `export type ${handlerInputTypeName} = GeneratedOperationInput<${operation.operationTypeName}>;`,
    `export type ${handlerTypeName} = GeneratedOperationHandler<${operation.operationTypeName}>;`,
    "",
    `export function ${registerFunctionName}<TApp extends Hono>(app: TApp) {`,
    "  return " + registerExpression,
    "    async (context) => {",
    `      const input = ${inputObject} satisfies ${handlerInputTypeName};`,
    "",
    `      return ${operation.handlerExportName}(input, context);`,
    "    },",
    "  );",
    "}",
    "",
  ].join("\n");
}

function buildHandlerStub(operation: OperationDefinition) {
  const handlerTypeName = `${toPascalCase(operation.moduleBasename)}Handler`;
  const handlerInputTypeName = `${toPascalCase(operation.moduleBasename)}HandlerInput`;
  const mapperPrefix = toPascalCase(operation.moduleBasename);

  return [
    'import { notImplemented } from "../../runtime/http-problem-details.js";',
    `import type { ${handlerInputTypeName}, ${handlerTypeName} } from "../../generated/operations/${operation.moduleBasename}.js";`,
    "",
    "// Colocate inbound/outbound mapping helpers in this module so the use-case stays protocol-agnostic.",
    `export const ${operation.handlerExportName}: ${handlerTypeName} = async (input) => {`,
    `  const useCaseInput = map${mapperPrefix}Input(input);`,
    `  const mappedResponse = map${mapperPrefix}Result(useCaseInput);`,
    "",
    `  return to${mapperPrefix}Response(mappedResponse);`,
    "};",
    "",
    `function map${mapperPrefix}Input(`,
    `  _input: ${handlerInputTypeName},`,
    ") {",
    `  return ${toLiteral(operation.operationId)};`,
    "}",
    "",
    `function map${mapperPrefix}Result(`,
    `  _result: ReturnType<typeof map${mapperPrefix}Input>,`,
    ") {",
    "  return undefined;",
    "}",
    "",
    `function to${mapperPrefix}Response(`,
    `  _response: ReturnType<typeof map${mapperPrefix}Result>,`,
    ") {",
    `  return notImplemented(${toLiteral(operation.operationId)});`,
    "}",
    "",
  ].join("\n");
}

function buildInputObject(assignments: string[]) {
  if (assignments.length === 0) {
    return "{}";
  }

  const indentedAssignments = assignments.map(
    (assignment) => `\n        ${assignment},`,
  );

  return `{${indentedAssignments.join("")}\n      }`;
}

function buildParameterValidator(
  moduleBasename: string,
  parameterName: "headers" | "path" | "query",
  parameterShape: Record<string, unknown>,
) {
  if (!(parameterName in parameterShape)) {
    return;
  }

  const routeIdentifier = `${toCamelCase(moduleBasename)}ServerRoute`;
  const validatorTarget = getValidatorTargetForParameter(parameterName);
  const inputProperty = parameterName === "path" ? "params" : parameterName;

  return {
    inputAssignment: `${inputProperty}: context.req.valid(${toLiteral(
      validatorTarget,
    )})`,
    validator: `zValidator(${toLiteral(
      validatorTarget,
    )}, ${routeIdentifier}.params.shape.${parameterName}, validationHook)`,
  };
}

function buildRegisterRoutesFile(operations: OperationDefinition[]) {
  const importLines = operations.map((operation) => {
    const registerFunctionName = `register${toPascalCase(operation.moduleBasename)}Route`;

    return `import { ${registerFunctionName} } from "./operations/${operation.moduleBasename}.js";`;
  });

  const registerLines = operations.map((operation) => {
    const registerFunctionName = `register${toPascalCase(operation.moduleBasename)}Route`;

    return `  ${registerFunctionName}(app);`;
  });

  return [
    'import type { Hono } from "hono";',
    ...importLines,
    "",
    "export function registerGeneratedRoutes<TApp extends Hono>(app: TApp) {",
    ...registerLines,
    "",
    "  return app;",
    "}",
    "",
  ].join("\n");
}

function buildRegistrationExpression(
  method: string,
  honoPath: string,
  validators: string[],
) {
  const normalizedMethod = method.toLowerCase();
  const supportedMethods = new Set([
    "delete",
    "get",
    "head",
    "options",
    "patch",
    "post",
    "put",
  ]);
  const methodInvocation = supportedMethods.has(normalizedMethod)
    ? `app.${normalizedMethod}`
    : `app.on(${toLiteral(method.toUpperCase())}`;
  const prefix = supportedMethods.has(normalizedMethod)
    ? `${methodInvocation}(\n      ${toLiteral(honoPath)}`
    : `${methodInvocation},\n      ${toLiteral(honoPath)}`;
  const validatorLines = validators.map((validator) => `,\n      ${validator}`);

  return `${prefix}${validatorLines.join("")},`;
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function createFallbackOperationId(method: string, routePath: string) {
  return toCamelCase(
    `${method} ${routePath
      .replaceAll("{", " ")
      .replaceAll("}", " ")
      .replaceAll("/", " ")}`,
  );
}

function getBodyValidator(
  operationId: string,
  requestMap: Record<string, unknown>,
): BodyValidatorDefinition | undefined {
  const bodyEntries = Object.entries(requestMap).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  if (bodyEntries.length === 0) {
    return;
  }

  if (bodyEntries.length > 1) {
    throw new Error(
      `Operation ${operationId} has multiple request body content types. This generator currently supports exactly zero or one request body schema per operation.`,
    );
  }

  const firstBodyEntry = bodyEntries[0];

  if (firstBodyEntry === undefined) {
    return;
  }

  const [contentType] = firstBodyEntry;
  const validatorTarget = getValidatorTargetForContentType(contentType);

  if (validatorTarget === undefined) {
    throw new Error(
      `Operation ${operationId} uses unsupported request body content type ${contentType}. Supported content types are application/json, application/*+json, application/x-www-form-urlencoded, and multipart/form-data.`,
    );
  }

  return {
    contentType,
    target: validatorTarget,
  };
}

function getValidatorTargetForContentType(contentType: string) {
  const normalizedContentType = normalizeContentType(contentType);

  if (
    normalizedContentType === "application/json" ||
    normalizedContentType.endsWith("+json")
  ) {
    return "json" as const;
  }

  if (
    normalizedContentType === "application/x-www-form-urlencoded" ||
    normalizedContentType === "multipart/form-data"
  ) {
    return "form" as const;
  }
}

function getValidatorTargetForParameter(
  parameterName: "headers" | "path" | "query",
) {
  switch (parameterName) {
    case "headers":
      return "header";
    case "path":
      return "param";
    case "query":
      return "query";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRouteDefinition(value: unknown): value is RouteDefinition {
  return (
    isRecord(value) &&
    typeof value.method === "string" &&
    typeof value.path === "string" &&
    isRecord(value.requestMap) &&
    isRecord(value.responseMap)
  );
}

async function loadOperations(generatedRoutesDirPath: string) {
  const routeFileNames = (await readdir(generatedRoutesDirPath))
    .filter((fileName) => fileName.endsWith(".ts") && fileName !== "index.ts")
    .sort();

  const operations: OperationDefinition[] = [];
  const seenOperationIds = new Set<string>();

  for (const routeFileName of routeFileNames) {
    const moduleBasename = routeFileName.slice(0, -3);
    const routeModuleFilePath = path.join(
      generatedRoutesDirPath,
      routeFileName,
    );
    const routeModuleUrl = new URL(
      `?generatedAt=${Date.now()}`,
      pathToFileURL(routeModuleFilePath),
    );
    const routeModule = await import(routeModuleUrl.href);
    const route = routeModule.serverRoute;

    if (!isRouteDefinition(route)) {
      throw new Error(
        `Route module ${routeFileName} does not export a supported serverRoute definition.`,
      );
    }

    const operationId =
      route.operationId ?? createFallbackOperationId(route.method, route.path);

    if (seenOperationIds.has(operationId)) {
      throw new Error(`Duplicate operationId detected: ${operationId}`);
    }

    seenOperationIds.add(operationId);

    const routeImportPath = `../../../generated/routes/${moduleBasename}.js`;
    const operationTypeName = `${toPascalCase(moduleBasename)}Route`;
    const handlerExportName = `${toCamelCase(moduleBasename)}Handler`;
    const validators: string[] = [];
    const inputAssignments: string[] = [];
    const parameterShape = route.params?.shape ?? {};

    const bodyValidator = getBodyValidator(operationId, route.requestMap);
    if (bodyValidator !== undefined) {
      validators.push(
        `zValidator(${toLiteral(bodyValidator.target)}, ${toCamelCase(
          moduleBasename,
        )}ServerRoute.requestMap[${toLiteral(bodyValidator.contentType)}], validationHook)`,
      );
      inputAssignments.push(
        `body: context.req.valid(${toLiteral(bodyValidator.target)})`,
      );
    }

    for (const parameterName of ["path", "query", "headers"] as const) {
      const validator = buildParameterValidator(
        moduleBasename,
        parameterName,
        parameterShape,
      );

      if (validator !== undefined) {
        validators.push(validator.validator);
        inputAssignments.push(validator.inputAssignment);
      }
    }

    operations.push({
      bodyValidator,
      handlerExportName,
      honoPath: toHonoPath(route.path),
      inputAssignments,
      method: route.method,
      moduleBasename,
      operationId,
      operationTypeName,
      routeImportPath,
      validators,
    });
  }

  return operations;
}

function normalizeContentType(contentType: string) {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? contentType;
}

async function readTextFile(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function splitIntoWords(value: string) {
  const normalizedValue = value
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  return normalizedValue === ""
    ? []
    : normalizedValue.split(/\s+/).filter((segment) => segment.length > 0);
}

function toCamelCase(value: string) {
  const [firstSegment = "operation", ...remainingSegments] =
    splitIntoWords(value);

  return [
    firstSegment.toLowerCase(),
    ...remainingSegments.map((segment) => capitalize(segment)),
  ].join("");
}

function toHonoPath(routePath: string) {
  return routePath.replaceAll(/\{([^}]+)\}/g, ":$1");
}

function toLiteral(value: string) {
  return JSON.stringify(value);
}

function toPascalCase(value: string) {
  const segments = splitIntoWords(value);

  if (segments.length === 0) {
    return "Operation";
  }

  return segments.map((segment) => capitalize(segment)).join("");
}

async function writeFileIfChanged(filePath: string, content: string) {
  const existingContent = await readTextFile(filePath);

  if (existingContent === content) {
    return;
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

async function writeFileIfMissing(filePath: string, content: string) {
  try {
    await access(filePath);
    return;
  } catch {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }
}
