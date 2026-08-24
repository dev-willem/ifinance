import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// Vitest faz merge automático com vite.config.ts (plugins, alias, etc.)
// Este arquivo só adiciona as configurações específicas de test
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/types/auto-imports.d.ts',
        'src/types/components.d.ts',
        '**/*.config.*',
      ],
    },
  },
})
