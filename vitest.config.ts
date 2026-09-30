import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      clearMocks: true,
      exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
      server: {
        deps: {
          inline: ["vuetify"],
        },
      },
    },
  }),
);
