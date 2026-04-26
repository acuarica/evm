import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores([
        '.solc/',
        'coverage/',
    ]),
     tseslint.configs.recommended,
    // tseslint.configs.recommendedTypeChecked,
    // tseslint.configs.strict,
    // tseslint.configs.strictTypeChecked,
    // tseslint.configs.stylisticTypeChecked,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: "^_" }],
            'prefer-const': ['error', { 'destructuring': 'all' }],

            // TODO
            '@typescript-eslint/no-unused-expressions': ['off'],
        }
    }
);