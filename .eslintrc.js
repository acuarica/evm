/**@type {import('eslint').Linter.Config} */
// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    rules: {
        semi: [2, 'always'],
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true }],
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-non-null-assertion': 0,

        /**
         * Permits to use arrow functions as no-op.
         *
         * https://typescript-eslint.io/rules/no-empty-function/
         * https://eslint.org/docs/latest/rules/no-empty-function#allow-arrowfunctions
         */
        '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],

        '@typescript-eslint/switch-exhaustiveness-check': 'warn',

        /**
         * Require explicit return and argument types on exported functions' and classes' public class methods.
         *
         * https://typescript-eslint.io/rules/explicit-module-boundary-types/
         */
        '@typescript-eslint/explicit-module-boundary-types': 'warn',

        /**
         * Enforce consistent usage of type imports.
         *
         * https://typescript-eslint.io/rules/consistent-type-imports
         */
        '@typescript-eslint/consistent-type-imports': 'warn',
    },
};
