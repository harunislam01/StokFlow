import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'logo.png'],
      manifest: {
        name: 'StockFlow',
        short_name: 'StockFlow',
        description: 'StockFlow Uygulaması',
        theme_color: '#B45309',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Stok Listesi',
            short_name: 'Stok',
            description: 'Hızlıca stok listesini görüntüle',
            url: '/',
            icons: [{ src: 'logo.png', sizes: '192x192' }]
          },
          {
            name: 'Yeni Ürün Ekle',
            short_name: 'Yeni',
            description: 'Yeni bir ürün ekle',
            url: '/product/new',
            icons: [{ src: 'logo.png', sizes: '192x192' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
      },
      workbox: {
        importScripts: ['/sw-custom.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
