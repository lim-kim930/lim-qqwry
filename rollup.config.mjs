import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        input: 'src/index.ts',
        output: {
            // dir: 'lib',
            file: 'lib/index.js',
            format: 'esm',
            sourcemap: false
        },
        plugins: [
            typescript({
                outDir: 'lib',
                compilerOptions: {
                    declaration: false,
                    removeComments: true,
                    module: 'es6'
                }
            })
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.cjs',
            format: 'cjs',
            sourcemap: false
        },
        plugins: [
            typescript({
                outDir: 'dist',
                compilerOptions: {
                    declaration: false,
                    removeComments: true,
                    module: 'es6'
                }
            })
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'index.d.ts'
        },
        plugins: [dts()]
    }
];
