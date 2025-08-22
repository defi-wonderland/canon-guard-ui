import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "**/eslint.config.js"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    files: ["**/*.{ts,tsx,jsx,js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "import/order": [
        "error",
        {
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: false,
          },
          // Enforce a specific import order
          groups: [
            "external",
            "builtin",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
            "unknown",
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "next",
              group: "external",
              position: "before",
            },
            {
              pattern: "next/**",
              group: "external",
              position: "before",
            },
            {
              pattern: "~/assets/**",
              group: "unknown",
              position: "after",
            },
            {
              pattern: "~/**",
              group: "parent",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
        },
      ],
      // Prettier plugin to apply formatting rules
      "prettier/prettier": "error", // This tells ESLint to show Prettier errors as ESLint errors
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-empty-interface": "off",
    },
    settings: {
      // Spread Prettier config to disable conflicting ESLint rules
      ...prettierConfig,
      react: {
        version: "detect",
      },
      "import/resolver": {
        alias: {
          map: [["", "./public"]],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
  },
);
