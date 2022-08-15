import * as path from 'path';
import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';

const config: Configuration = {
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
        ],
    },
    devtool: 'source-map',
};

const browser: Configuration = merge(config, {
    target: 'web',
    output: {
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: '[name].js',
    },
});

const node: Configuration = merge(config, {
    target: 'node',
    output: {
        libraryTarget: 'commonjs2',
        filename: '[name].node.js',
    },
});

export default [browser, node];
