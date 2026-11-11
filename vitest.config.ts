import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.stories.{ts,tsx}",
        "src/components/PixiFaceView.tsx",
        "src/components/VizijFaceView.tsx",
        "src/components/FaceContainer.tsx",
        "src/components/FaceEyes.tsx",
        "src/components/FaceMouth.tsx",
        "src/components/FaceBackground.tsx",
        "src/components/FaceText.tsx",
        "src/components/FaceFullScreenButton.tsx",
        "src/components/FaceScrollToTopButton.tsx",
      ],
      thresholds: {
        lines: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
