import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    api: "apps/api-first/api/src/api.ts",
    index: "apps/api-first/api/src/index.ts",
  },
  format: ["esm"],
  outDir: "dist/apps/api-first/api",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
