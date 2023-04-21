// eslint-disable-next-line no-undef
/**@type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    rules: {
        semi: ['error', 'always'],

        /**
         * https://eslint.org/docs/latest/rules/new-parens
         *
         * Enforce or disallow parentheses when invoking a constructor with no arguments
         *
         * JavaScript allows the omission of parentheses when invoking a function via the `new` keyword and the constructor has no arguments.
         * However, some coders believe that omitting the parentheses is inconsistent with the rest of the language and thus makes code less clear.
         */
        'new-parens': 'error',

        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/restrict-template-expressions': ['off'],
        '@typescript-eslint/no-non-null-assertion': 'off',

        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',

        /**
         * Permits to use arrow functions as no-op.
         *
         * https://typescript-eslint.io/rules/no-empty-function/
         * https://eslint.org/docs/latest/rules/no-empty-function#allow-arrowfunctions
         */
        '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],

        '@typescript-eslint/switch-exhaustiveness-check': 'warn',

        /**
         * Enforce consistent usage of type imports.
         *
         * https://typescript-eslint.io/rules/consistent-type-imports
         */
        '@typescript-eslint/consistent-type-imports': 'warn',

        'import/order': 'warn',
        'import/no-useless-path-segments': 'warn',
    },
    overrides: [
        {
            files: ['src/**/*.ts'],
            rules: {
                'no-restricted-globals': ['error', 'Buffer'],
                'no-console': 'error',
                'import/no-nodejs-modules': 'error',
            },
        },
    ],
};
