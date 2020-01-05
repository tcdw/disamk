import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { uglify } from 'rollup-plugin-uglify';
import progress from 'rollup-plugin-progress';
import autoprefixer from 'autoprefixer';
import clean from 'postcss-clean';
import postCSS from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';

const env = process.env.NODE_ENV;

const base = {
    input: 'src/web.ts',
    output: {
        file: 'dist-web/index.js',
        format: 'iife',
        sourcemap: (env !== 'production'),
    },
    plugins: [
        progress({
            clearLine: false,
        }),
        typescript(),
        resolve({
            browser: true,
        }),
        commonjs({
            extensions: ['.js', '.ts'],
            namedExports: {
                'js-sha256': ['sha256'],
            }
        }),
        postCSS({
            extract: true,
            plugins: [
                autoprefixer(),
                clean(),
            ],
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        uglify(),
    ],
};

if (process.env.NODE_ENV === 'development') {
    base.watch = {
        chokidar: true,
        include: 'src/**/*',
    };
}

export default base;