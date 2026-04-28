import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  entry: {
    main: "apps/client/src/main.ts",
  },
  format: ["esm"],
  outDir: "dist/apps/client",
  platform: "node",
  sourcemap: true,
  target: "node22",
});
