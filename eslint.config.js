import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettierConfig from "eslint-config-prettier";

export default defineConfig(
  {
    ignores: ["out/**", ".next/**", "node_modules/**", "coverage/**", "eslint.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals,
  {
    // Existing "lazy ref init" pattern (`if (!ref.current) ref.current = ...`
    // during render) is intentional and StrictMode-safe throughout this
    // codebase; not a behavior we want to refactor away.
    rules: {
      "react-hooks/refs": "off",
    },
  },
  prettierConfig,
);
