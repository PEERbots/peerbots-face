import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(viteConfig) {
    if (!viteConfig.plugins) {
      viteConfig.plugins = [];
    }
    viteConfig.plugins.push(tailwindcss());
    viteConfig.resolve = viteConfig.resolve ?? {};
    viteConfig.resolve.dedupe = [
      ...(viteConfig.resolve.dedupe ?? []),
      "react",
      "react-dom",
    ];
    viteConfig.resolve.alias = {
      ...(typeof viteConfig.resolve.alias === "object" &&
      !Array.isArray(viteConfig.resolve.alias)
        ? viteConfig.resolve.alias
        : {}),
      react: path.resolve(dirname, "../node_modules/react"),
      "react-dom": path.resolve(dirname, "../node_modules/react-dom"),
      "react-reconciler/constants": "react-reconciler/constants.js",
    };
    return viteConfig;
  },
};

export default config;
