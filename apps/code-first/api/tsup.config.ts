import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    api: "apps/code-first/api/src/api.ts",
    index: "apps/code-first/api/src/index.ts",
  },
  format: ["esm"],
  outDir: "dist/apps/code-first/api",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
