import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/code-first/api/src/**/*.test.ts"],
  },
});
