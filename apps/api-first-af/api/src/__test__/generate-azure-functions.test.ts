import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateAzureFunctions } from "../generator/generate-azure-functions.js";

const apiProjectRoot = path.resolve("apps/api-first-af/api");

describe("generateAzureFunctions", () => {
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
          '      "application/json": z.boolean(),',
          "    },",
          "  },",
          "} as const;",
          "",
        ].join("\n"),
      );

      await generateAzureFunctions({ projectRoot });

      await expect(readFile(handlerFilePath, "utf8")).resolves.toBe(
        `export const sentinel = "keep-me";\n`,
      );
    });
  });

  it("generates Azure Functions registrations and typed request parsing", async () => {
    await withTempProject(async (projectRoot) => {
      const generatedOperationFilePath = path.join(
        projectRoot,
        "src",
        "generated",
        "operations",
        "getUserPets.ts",
      );
      const generatedRegisterFunctionsFilePath = path.join(
        projectRoot,
        "src",
        "generated",
        "register-functions.ts",
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

      await generateAzureFunctions({ projectRoot });

      const generatedOperationSource = await readFile(
        generatedOperationFilePath,
        "utf8",
      );
      const generatedRegisterFunctionsSource = await readFile(
        generatedRegisterFunctionsFilePath,
        "utf8",
      );

      expect(generatedOperationSource).toContain(
        'import { getUserPetsHandler } from "../../adapters/http/getUserPets.js";',
      );
      expect(generatedOperationSource).toContain(
        'import { parseHttpRequest } from "../../runtime/http-request.js";',
      );
      expect(generatedOperationSource).toContain(
        "export type GetUserPetsHandlerInput = GeneratedOperationInput<GetUserPetsRoute>;",
      );
      expect(generatedOperationSource).toContain(
        "export const getUserPetsFunctionHandler = async (",
      );
      expect(generatedOperationSource).toContain(
        "const parsedRequest = await parseHttpRequest(request, getUserPetsServerRoute);",
      );
      expect(generatedOperationSource).toContain('  app.http("getUserPets", {');
      expect(generatedOperationSource).toContain('    authLevel: "function",');
      expect(generatedOperationSource).toContain('    methods: ["GET"],');
      expect(generatedOperationSource).toContain(
        '    route: "users/{userId}/pets",',
      );
      expect(generatedRegisterFunctionsSource).toContain(
        'import { app } from "@azure/functions";',
      );
      expect(generatedRegisterFunctionsSource).toContain(
        "let registered = false;",
      );
      expect(generatedRegisterFunctionsSource).toContain(
        "registerGetUserPetsFunction(app);",
      );
    });
  });
});

async function withTempProject(run: (projectRoot: string) => Promise<void>) {
  const projectRoot = await mkdtemp(
    path.join(apiProjectRoot, ".tmp-generate-azure-functions-"),
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
