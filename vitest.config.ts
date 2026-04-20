// https://vitest.dev/config/
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // https://vitest.dev/config/globalsetup
        globalSetup: 'test/scripts/setup-solc.ts',

        // > This is the only terminal reporter that reports
        // > annotations when the test doesn't fail.
        //
        // https://vitest.dev/guide/reporters.html#verbose-reporter
        reporters: ['verbose'],

        // https://vitest.dev/config/coverage.html
        coverage: {
            reporter: ['text', 'html', 'lcov'],
        },
    },
})