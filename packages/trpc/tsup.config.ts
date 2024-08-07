import type { Options } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
  entry: {
    nextjs: "src/nextjs/index.ts",
    remix: "src/remix/index.ts",
    sveltekit: "src/sveltekit/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  minify: !options.watch,
  minifyWhitespace: true,
  clean: true,
  ...options,
}));
