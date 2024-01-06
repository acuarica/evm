/* eslint-env node */

// @ts-expect-error since this is a CommonJS module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

module.exports.version = version;
