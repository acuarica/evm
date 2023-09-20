/** @type {import('webpack').Configuration} */
export default {
    target: 'web',
    entry: {
        SEVM: './dist/src/index.js',
    },
    output: {
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: '[name].js',
    },
};
