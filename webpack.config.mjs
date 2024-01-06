/** @type {import('webpack').Configuration} */
export default {
    target: 'web',
    entry: './dist/src/index.js',
    output: {
        library: 'sevm',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: 'sevm.js',
    },
};
