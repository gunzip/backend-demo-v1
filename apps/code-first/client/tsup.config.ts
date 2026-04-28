import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: {
    main: "apps/code-first/client/src/main.ts",
  },
  format: ["esm"],
  outDir: "dist/apps/code-first/client",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
