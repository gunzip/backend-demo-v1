import { z } from "zod";

const clientConfigSchema = z.object({
  API_URL: z.string().url().default("http://localhost:3000")
});

export type ClientConfig = {
  apiUrl: string;
};

export function loadClientConfig(env: NodeJS.ProcessEnv): ClientConfig {
  const parsedEnv = clientConfigSchema.parse(env);

  return {
    apiUrl: parsedEnv.API_URL
  };
}
