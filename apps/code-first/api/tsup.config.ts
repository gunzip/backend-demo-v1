import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    api: "apps/api/src/api.ts",
    index: "apps/api/src/index.ts",
  },
  format: ["esm"],
  outDir: "dist/apps/api",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
