import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules"] },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { prettier },
    languageOptions: {
      // Node.js globals: process, console, __dirname, etc.
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
