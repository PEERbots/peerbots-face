import { defineConfig } from "tsup";

const sharedExternal = [
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
];

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      pixi: "src/components/PixiFaceView.tsx",
      vizij: "src/components/VizijFaceView.tsx",
    },
    format: ["esm"],
    dts: {
      compilerOptions: {
        ignoreDeprecations: "6.0",
      },
    },
    minify: false,
    clean: false,
    sourcemap: true,
    splitting: true,
    external: sharedExternal,
  },
  {
    entry: {
      index: "src/index.ts",
      pixi: "src/components/PixiFaceView.tsx",
      vizij: "src/components/VizijFaceView.tsx",
    },
    format: ["cjs"],
    dts: false,
    minify: false,
    clean: false,
    sourcemap: true,
    splitting: false,
    external: sharedExternal,
  },
]);
