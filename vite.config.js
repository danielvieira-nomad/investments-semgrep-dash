import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/investments-semgrep-dash/',
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    setupFiles: ['./vitest.setup.js'],
    environment: 'node',
    environmentMatchGlobs: [
      ['src/**/*.test.jsx', 'jsdom'],
    ],
    include: ['shared/**/*.test.mjs', 'scripts/**/*.test.mjs', 'src/**/*.test.js', 'src/**/*.test.jsx'],
  },
})
