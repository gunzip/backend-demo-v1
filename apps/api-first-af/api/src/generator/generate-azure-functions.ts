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

export interface GenerateAzureFunctionsOptions {
  projectRoot: string;
}

interface OperationDefinition {
  azureRoute: string;
  functionHandlerName: string;
  handlerExportName: string;
  method: string;
  moduleBasename: string;
  operationId: string;
  operationTypeName: string;
  routeImportPath: string;
}

interface RouteDefinition {
  method: string;
  operationId?: string;
  path: string;
  requestMap: Record<string, unknown>;
  responseMap: Record<string, Record<string, unknown>>;
}

export async function generateAzureFunctions({
  projectRoot,
}: GenerateAzureFunctionsOptions) {
  const generatedRoutesDirPath = path.join(projectRoot, "generated", "routes");
  const generatedOperationsDirPath = path.join(
    projectRoot,
    "src",
    "generated",
    "operations",
  );
  const generatedRegisterFunctionsFilePath = path.join(
    projectRoot,
    "src",
    "generated",
    "register-functions.ts",
  );
  const httpAdaptersDirPath = path.join(projectRoot, "src", "adapters", "http");

  const operations = await loadOperations(generatedRoutesDirPath);

  await rm(generatedOperationsDirPath, { force: true, recursive: true });
  await mkdir(generatedOperationsDirPath, { recursive: true });
  await mkdir(path.dirname(generatedRegisterFunctionsFilePath), {
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
    generatedRegisterFunctionsFilePath,
    buildRegisterFunctionsFile(operations),
  );
}

function buildGeneratedOperationFile(operation: OperationDefinition) {
  const registerFunctionName = `register${toPascalCase(operation.moduleBasename)}Function`;
  const handlerInputTypeName = `${toPascalCase(operation.moduleBasename)}HandlerInput`;
  const handlerResponseTypeName = `${toPascalCase(operation.moduleBasename)}HandlerResponse`;
  const handlerTypeName = `${toPascalCase(operation.moduleBasename)}Handler`;

  return [
    `import { ${operation.handlerExportName} } from "../../adapters/http/${operation.moduleBasename}.js";`,
    'import { parseHttpRequest } from "../../runtime/http-request.js";',
    'import type { GeneratedHttpRequest, GeneratedInvocationContext, GeneratedOperationHandler, GeneratedOperationInput, GeneratedOperationResponse } from "../../runtime/operation-types.js";',
    `import { serverRoute as ${toCamelCase(operation.moduleBasename)}ServerRoute } from "${operation.routeImportPath}";`,
    "",
    `export type ${operation.operationTypeName} = typeof ${toCamelCase(operation.moduleBasename)}ServerRoute;`,
    `export type ${handlerInputTypeName} = GeneratedOperationInput<${operation.operationTypeName}>;`,
    `export type ${handlerResponseTypeName} = GeneratedOperationResponse<${operation.operationTypeName}>;`,
    `export type ${handlerTypeName} = GeneratedOperationHandler<${operation.operationTypeName}>;`,
    "",
    `export const ${operation.functionHandlerName} = async (`,
    "  request: GeneratedHttpRequest,",
    "  context: GeneratedInvocationContext,",
    ") => {",
    `  const parsedRequest = await parseHttpRequest(request, ${toCamelCase(operation.moduleBasename)}ServerRoute);`,
    "",
    "  if (!parsedRequest.ok) {",
    "    return parsedRequest.response;",
    "  }",
    "",
    `  return ${operation.handlerExportName}(parsedRequest.value, context, request);`,
    "};",
    "",
    `export function ${registerFunctionName}(`,
    '  app: typeof import("@azure/functions").app,',
    ") {",
    `  app.http(${toLiteral(operation.operationId)}, {`,
    '    authLevel: "function",',
    `    methods: [${toLiteral(operation.method.toUpperCase())}],`,
    `    route: ${toLiteral(operation.azureRoute)},`,
    `    handler: ${operation.functionHandlerName},`,
    "  });",
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

function buildRegisterFunctionsFile(operations: OperationDefinition[]) {
  const importLines = operations.map((operation) => {
    const registerFunctionName = `register${toPascalCase(operation.moduleBasename)}Function`;

    return `import { ${registerFunctionName} } from "./operations/${operation.moduleBasename}.js";`;
  });

  const registerLines = operations.map((operation) => {
    const registerFunctionName = `register${toPascalCase(operation.moduleBasename)}Function`;

    return `  ${registerFunctionName}(app);`;
  });

  return [
    'import { app } from "@azure/functions";',
    ...importLines,
    "",
    "let registered = false;",
    "",
    "export function registerGeneratedFunctions() {",
    "  if (registered) {",
    "    return app;",
    "  }",
    "",
    "  registered = true;",
    ...registerLines,
    "",
    "  return app;",
    "}",
    "",
  ].join("\n");
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

    operations.push({
      azureRoute: toAzureRoute(route.path),
      functionHandlerName: `${toCamelCase(moduleBasename)}FunctionHandler`,
      handlerExportName: `${toCamelCase(moduleBasename)}Handler`,
      method: route.method,
      moduleBasename,
      operationId,
      operationTypeName: `${toPascalCase(moduleBasename)}Route`,
      routeImportPath: `../../../generated/routes/${moduleBasename}.js`,
    });
  }

  return operations;
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

function toAzureRoute(routePath: string) {
  const normalizedRoute = routePath.replace(/^\/+/, "");

  return normalizedRoute === "" ? "/" : normalizedRoute;
}

function toCamelCase(value: string) {
  const [firstSegment = "operation", ...remainingSegments] =
    splitIntoWords(value);

  return [
    firstSegment.toLowerCase(),
    ...remainingSegments.map((segment) => capitalize(segment)),
  ].join("");
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
