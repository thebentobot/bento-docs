import eslintJs from "@eslint/js";
import prettier from "eslint-config-prettier";
import typescriptEslintParser from "@typescript-eslint/parser";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    {
        // Keep generated documentation and build output out of lint results.
        ignores: [
            "dist/**",
            "node_modules/**",
            ".astro/**",
            ".wrangler/**",
            "src/generated/**",
            "src/content/docs/reference/**",
            "**/*.jsonc",
        ],
    },
    eslintJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: typescriptEslintParser,
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module",
            },
        },
    },
    ...astroPlugin.configs.recommended,
    prettier,
];
