/* eslint-disable import/no-extraneous-dependencies */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        main: './src/web.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[fullhash].js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
            {
                test: /(.css|.scss|.sass)$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].[fullhash].css',
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src/index.ejs'),
            minify: true,
            title: 'AddmusicK 1.0.X SPC Disassembler',
        }),
    ],
    externals: {
        jszip: 'JSZip',
    },
};
