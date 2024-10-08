import type { Options } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
  entry: {
    index: "src/index.ts",
    client: "src/client.ts",
    selector: "src/selector.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  minify: !options.watch,
  minifyWhitespace: true,
  clean: true,
  ...options,
}));
