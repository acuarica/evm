import * as path from 'path';
import { Configuration, ProvidePlugin } from 'webpack';
import { merge } from 'webpack-merge';

const isDevelopment = process.env.NODE_ENV !== 'production';

const config: Configuration = {
    mode: isDevelopment ? 'development' : 'production',
    entry: {
        EVM: './src/index.ts',
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
        ]
    },
    devtool: 'source-map'
};

const browser: Configuration = merge(config, {
    target: 'web',
    output: {
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: '[name].js'
    },
    resolve: {

        fallback: {
            buffer: require.resolve('buffer/'),
        },
    },
    plugins: [
        new ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
});

const node: Configuration = merge(config, {
    target: 'node',
    output: {
        libraryTarget: 'commonjs2',
        filename: '[name].node.js'
    }
});

export default [browser, node];
