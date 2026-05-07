import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateHonoServer } from "../generator/generate-hono-server";

const apiProjectRoot = path.resolve("apps/api-first/api");

describe("generateHonoServer", () => {
  it("does not overwrite a handwritten wrapper once it exists", async () => {
    await withTempProject(async (projectRoot) => {
      const handlerFilePath = await writeProjectFile(
        projectRoot,
        "src/adapters/http/postUsersIsAdult.ts",
        `export const sentinel = "keep-me";\n`,
      );

      await writeProjectFile(
        projectRoot,
        "generated/routes/postUsersIsAdult.ts",
        [
          'import * as z from "zod";',
          "",
          "export const serverRoute = {",
          '  method: "post",',
          '  operationId: "postUsersIsAdult",',
          '  path: "/users/is-adult",',
          "  requestMap: {",
          '    "application/json": z.object({',
          "      birth_date: z.string(),",
          "      fiscal_code: z.string(),",
          "    }),",
          "  },",
          "  responseMap: {",
          '    "200": {',
          '      "application/json": z.object({ isAdult: z.boolean() }),',
          "    },",
          "  },",
          "} as const;",
          "",
        ].join("\n"),
      );

      await generateHonoServer({ projectRoot });

      await expect(readFile(handlerFilePath, "utf8")).resolves.toBe(
        `export const sentinel = "keep-me";\n`,
      );
    });
  });

  it("generates validators, typed payload plumbing, and response aliases", async () => {
    await withTempProject(async (projectRoot) => {
      const generatedOperationFilePath = path.join(
        projectRoot,
        "src",
        "generated",
        "operations",
        "getUserPets.ts",
      );

      await writeProjectFile(
        projectRoot,
        "generated/routes/getUserPets.ts",
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

      await generateHonoServer({ projectRoot });

      const generatedOperationSource = await readFile(
        generatedOperationFilePath,
        "utf8",
      );

      expect(generatedOperationSource).toContain(
        'import { getUserPetsHandler } from "../../adapters/http/getUserPets.js";',
      );
      expect(generatedOperationSource).toContain(
        'import type { GeneratedOperationHandler, GeneratedOperationInput, GeneratedOperationResponse } from "../../runtime/operation-types.js";',
      );
      expect(generatedOperationSource).toContain(
        "export type GetUserPetsHandlerResponse = GeneratedOperationResponse<GetUserPetsRoute>;",
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
    });
  });
});

async function withTempProject(run: (projectRoot: string) => Promise<void>) {
  const projectRoot = await mkdtemp(
    path.join(apiProjectRoot, ".tmp-generate-hono-server-"),
  );

  try {
    await run(projectRoot);
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
}

async function writeProjectFile(
  projectRoot: string,
  relativeFilePath: string,
  source: string,
) {
  const filePath = path.join(projectRoot, relativeFilePath);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, source);

  return filePath;
}
