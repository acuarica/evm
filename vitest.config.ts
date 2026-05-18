// https://vitest.dev/config/
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Setups `solc` compilers to be used in tests.
        //
        // https://vitest.dev/config/globalsetup
        globalSetup: 'test/scripts/setup-solc.ts',

        // Extend `expect` with `matchSnapshotmd` matcher.
        //
        // https://vitest.dev/guide/learn/setup-teardown.html#setup-files
        setupFiles: 'test/scripts/setup-snapshot.ts',

        // > This is the only terminal reporter that reports
        // > annotations when the test doesn't fail.
        //
        // https://vitest.dev/guide/reporters.html#verbose-reporter
        reporters: ['verbose'],

        // https://vitest.dev/config/coverage.html
        coverage: {
            reporter: ['text', 'html', 'lcov'],
        },

        // This allows tests from a single file to be displayed together,
        // which makes it easier to visualize all test cases coming from the same file.
        //
        // https://vitest.dev/config/fileparallelism.html
        fileParallelism: false,
    },
});