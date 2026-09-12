import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/browser.ts"],
  format: ["esm", "cjs"],
  external: ["officetopdf-wasm"],
  clean: true,
  treeshake: true,
});
