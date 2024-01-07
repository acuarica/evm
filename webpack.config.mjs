/** @type {import('webpack').Configuration} */
export default {
    target: 'web',
    entry: ['./4byte-get/index.js'],
    output: {
        library: 'sevm',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: 'sevm.js',
    },
};
