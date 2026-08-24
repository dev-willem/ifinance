import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: 'src/types/auto-imports.d.ts',
      vueTemplate: true,
    }),
    Components({
      dts: 'src/types/components.d.ts',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'iFinance',
        short_name: 'iFinance',
        description: 'Plataforma profissional de simulação financeira',
        theme_color: '#0F1117',
        background_color: '#0F1117',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      },
      '/logout': {
        target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) return 'vendor'
          if (id.includes('/@tanstack/')) return 'query'
          if (id.includes('/reka-ui/') || id.includes('/lucide-vue-next/')) return 'ui'
          if (id.includes('/axios/') || id.includes('/zod/') || id.includes('/clsx/') || id.includes('/tailwind-merge/')) return 'utils'
        },
      },
    },
  },
})
