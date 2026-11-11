import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  minify: false,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@peerbots/core",
    "@base-ui/react",
    "pixi.js",
    "@pixi/react",
    "@vizij/runtime-react",
    "zustand",
    "zustand/middleware",
  ],
});
