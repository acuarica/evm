import { defineConfig } from "eslint/config";
import tseslint from 'typescript-eslint';

export default defineConfig(
    tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: "^_" }],
            'prefer-const': ['error', { 'destructuring': 'all' }],

            // TODO
            '@typescript-eslint/no-unused-expressions': ['off'],
        }
    }
);