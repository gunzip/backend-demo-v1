import { z } from "zod";

const apiConfigSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export interface ApiConfig {
  port: number;
}

export function loadApiConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const parsedEnv = apiConfigSchema.parse(env);

  return {
    port: parsedEnv.PORT,
  };
}
