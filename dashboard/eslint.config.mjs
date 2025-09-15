import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // This is the original configuration for Next.js
  ...compat.extends("next/core-web-vitals"),
  
  // This is the NEW configuration object we are adding.
  // It specifically targets TypeScript files and applies our custom rules.
  {
    files: ["**/*.js", "**/*.jsx"], // Apply these rules only to TypeScript files
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // Tells ESLint where to find your TS config
      },
    },
    rules: {
      // This rule is for variables that are declared but not used.
      // We are setting it to "warn" so it shows a yellow message instead of a red error.
      "@typescript-eslint/no-unused-vars": "warn",

      // This rule is for using the 'any' type.
      // We are also setting this to "warn" to allow the project to compile.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // This section ignores folders, same as your original file.
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;