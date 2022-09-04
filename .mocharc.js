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
