import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["source/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "no-self-assign": "warn",
      "prefer-const": "warn",
    },
  },
  {
    ignores: ["lib/**", "Test/**", "Document/**", "node_modules/**"],
  },
];
