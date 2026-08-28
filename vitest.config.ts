import { defineConfig, configDefaults } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // e2e/ holds Playwright specs (run via `pnpm e2e`), not Vitest ones —
    // exclude them so Vitest doesn't try to execute them itself.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
