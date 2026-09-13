import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Test-only config (kept separate from vite.config.ts so tests don't run the
// tailwind / react-compiler build plugins). esbuild handles JSX with the
// automatic runtime, so test files don't need to import React.
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx', // thin shell, exercised by e2e
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
})
