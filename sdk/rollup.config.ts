import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

export default defineConfig([
  // ESM build
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.mjs', format: 'esm', sourcemap: true },
    plugins: [resolve({ browser: true }), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  },
  // CJS build
  {
    input: 'src/cjs-entry.ts',
    output: { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, exports: 'default' },
    plugins: [resolve({ browser: true }), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  },
  // UMD build
  {
    input: 'src/cjs-entry.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'G5',
      sourcemap: true,
      exports: 'default',
      plugins: [terser()],
    },
    plugins: [resolve({ browser: true }), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
  },
])
