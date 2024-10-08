import type { Options } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
  entry: {
    assertion: "src/assertion/index.ts",
    date: "src/date/index.ts",
    jwt: "src/jwt/index.ts",
    request: "src/request/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  minify: !options.watch,
  minifyWhitespace: true,
  clean: true,
  ...options,
}));
