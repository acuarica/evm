const mocharc = require('./.mocharc');

module.exports = {
    /**
     * Inherits configuration from `.mocharc`.
     */
    ...mocharc,

    /**
     * `check` tests should not test any functionality in the package's modules.
     * Instead, they _check_ the behavior or data of some external dependency.
     * This provides a checkpoint to understand external APIs and data.
     * This is in turn facilitates `test` creation.
     */
    spec: ['test/**/*.check.ts'],
};
