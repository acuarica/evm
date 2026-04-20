// eslint-disable-next-line no-undef
/**@type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    plugins: ['@typescript-eslint', 'mocha', 'chai-expect'],
    extends: [
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:mocha/recommended',
        'plugin:chai-expect/recommended',
    ],
    rules: {
        semi: ['warn', 'always'],

        /**
         * https://eslint.org/docs/latest/rules/new-parens
         *
         * Enforce or disallow parentheses when invoking a constructor with no arguments
         *
         * JavaScript allows the omission of parentheses when invoking a function via the `new` keyword and the constructor has no arguments.
         * However, some coders believe that omitting the parentheses is inconsistent with the rest of the language and thus makes code less clear.
         */
        'new-parens': 'warn',

        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-non-null-assertion': 'off',

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

        'mocha/no-setup-in-describe': 'off',
    },
    overrides: [
        {
            files: ['src/**/*.ts'],
            rules: {
                'no-restricted-globals': ['error', 'Buffer'],
                'no-console': 'error',
            },
        },
    ],
};
