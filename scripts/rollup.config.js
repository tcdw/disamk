import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import progress from 'rollup-plugin-progress';
import autoprefixer from 'autoprefixer';
import postCSS from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import cssnano from 'cssnano';

const env = process.env.NODE_ENV;

const base = {
    input: 'src/web.ts',
    output: {
        file: 'dist-web/index.js',
        format: 'iife',
        name: 'disamk',
        sourcemap: (env !== 'production'),
        globals: {
            jszip: 'JSZip',
        },
    },
    external: ['jszip'],
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
            },
        }),
        postCSS({
            extract: true,
            plugins: [
                autoprefixer(),
                cssnano(),
            ],
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        terser(),
    ],
};

if (process.env.NODE_ENV === 'development') {
    base.watch = {
        chokidar: true,
        include: 'src/**/*',
    };
}

export default base;
