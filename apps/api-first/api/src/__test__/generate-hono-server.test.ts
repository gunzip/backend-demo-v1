import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateHonoServer } from "../generator/generate-hono-server";

const apiProjectRoot = path.resolve("apps/api-first/api");

describe("generateHonoServer", () => {
  it("does not overwrite a handwritten wrapper once it exists", async () => {
    const handlerFilePath = path.join(
      apiProjectRoot,
      "src",
      "adapters",
      "http",
      "postUsersIsAdult.ts",
    );
    const originalHandlerSource = await readFile(handlerFilePath, "utf8");
    const customHandlerSource = `export const sentinel = "keep-me";\n`;

    try {
      await writeFile(handlerFilePath, customHandlerSource);
      await generateHonoServer({ projectRoot: apiProjectRoot });

      await expect(readFile(handlerFilePath, "utf8")).resolves.toBe(
        customHandlerSource,
      );
    } finally {
      await writeFile(handlerFilePath, originalHandlerSource);
    }
  });

  it("generates validators and typed payload plumbing for params, query, and headers", async () => {
    const generatedRouteFilePath = path.join(
      apiProjectRoot,
      "generated",
      "routes",
      "getUserPets.ts",
    );
    const generatedHandlerFilePath = path.join(
      apiProjectRoot,
      "src",
      "adapters",
      "http",
      "getUserPets.ts",
    );
    const generatedOperationFilePath = path.join(
      apiProjectRoot,
      "src",
      "generated",
      "operations",
      "getUserPets.ts",
    );
    const generatedRoutesDirPath = path.dirname(generatedRouteFilePath);

    await mkdir(generatedRoutesDirPath, { recursive: true });
    try {
      await writeFile(
        generatedRouteFilePath,
        [
          'import * as z from "zod";',
          "",
          "const getUserPetsServerParams = z.object({",
          "  headers: z.object({",
          '    "x-request-id": z.string(),',
          "  }),",
          "  path: z.object({",
          "    userId: z.string(),",
          "  }),",
          "  query: z.object({",
          "    limit: z.number().optional(),",
          "  }).optional(),",
          "});",
          "",
          "export const serverRoute = {",
          '  method: "get",',
          '  operationId: "getUserPets",',
          "  params: getUserPetsServerParams,",
          '  path: "/users/{userId}/pets",',
          "  requestMap: {},",
          "  responseMap: {},",
          "} as const;",
          "",
        ].join("\n"),
      );

      await generateHonoServer({ projectRoot: apiProjectRoot });

      const generatedOperationSource = await readFile(
        generatedOperationFilePath,
        "utf8",
      );

      expect(generatedOperationSource).toContain(
        'import { getUserPetsHandler } from "../../adapters/http/getUserPets.js";',
      );
      expect(generatedOperationSource).toContain(
        'zValidator("param", getUserPetsServerRoute.params.shape.path, validationHook)',
      );
      expect(generatedOperationSource).toContain(
        'zValidator("query", getUserPetsServerRoute.params.shape.query, validationHook)',
      );
      expect(generatedOperationSource).toContain(
        'zValidator("header", getUserPetsServerRoute.params.shape.headers, validationHook)',
      );
      expect(generatedOperationSource).toContain(
        'params: context.req.valid("param")',
      );
      expect(generatedOperationSource).toContain(
        'query: context.req.valid("query")',
      );
      expect(generatedOperationSource).toContain(
        'headers: context.req.valid("header")',
      );
    } finally {
      await rm(generatedRouteFilePath, { force: true });
      await rm(generatedHandlerFilePath, { force: true });
      await rm(generatedOperationFilePath, { force: true });
      await generateHonoServer({ projectRoot: apiProjectRoot });
    }
  });
});
