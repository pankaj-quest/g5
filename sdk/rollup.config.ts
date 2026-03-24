import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
      { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'G5',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [resolve({ browser: true }), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  },
])
