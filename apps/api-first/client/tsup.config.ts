import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "apps/api-first/client/src/index.ts",
  },
  format: ["esm"],
  outDir: "dist/apps/api-first/client",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
