/**
 * This configuration[1] is used when `mocha` is invoked directly
 * from the command line.
 *
 * Note that this configuration does not affect tests
 * when they are executed through `runTests`.
 *
 * [1] https://mochajs.org/#configuring-mocha-nodejs
 */
module.exports = {
    /**
     * It's used to specify `ts` tests instead of `js`.
     *
     * > By default, `mocha` looks for the glob `"./test/*.{js,cjs,mjs}"`,
     * > so you may want to put your tests in `test/` folder.
     * > https://mochajs.org/#the-test-directory
     *
     * https://mochajs.org/#configuration-format
     * https://github.com/mochajs/mocha/blob/9f24d0d03fd3dc1d15681d9b1548f77ddbeb9ef3/example/config/.mocharc.js#L41
     */
    spec: 'test/**/*.test.ts',

    /**
     * From `mocha -h`
     *
     * ```txt
     * --require, -r                    Require module      [array] [default: (none)]
     * ```
     */
    require: [
        // We use `ts-node/register`[1] to run our tests without compiling them.
        //
        // [1] https://typestrong.org/ts-node/docs/recipes/mocha/#mocha-7-and-newer.
        'ts-node/register',
    ],
};
