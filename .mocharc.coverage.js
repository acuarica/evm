const mocharc = require('./.mocharc');

module.exports = {
    /**
     * Inherits configuration from `.mocharc`.
     */
    ...mocharc,

    /**
     * We add `coverage` tests in addition to the `spec` exported by `.mocharc.
     *
     * `coverage` tests are used to stress the exported API under heavy load.
     * In particular, it may uncover some corner cases.
     *
     * `coverage` tests may not perform any assertion, _i.e._, `expect`, on actual values.
     */
    spec: [...mocharc.spec, 'test/**/*.coverage.ts'],
};
