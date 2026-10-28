import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Vitest ignora vite.config.ts quando este arquivo existe; só o plugin vue é necessário
// (AutoImport/Components regenerariam os .d.ts compartilhados)
export default defineConfig({
  plugins: [vue()],
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
