import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon-32.png', 'favicon-16.png', 'icon-180.png', 'icon-167.png', 'icon-152.png', 'icon-120.png', 'icon-76.png'],
      manifest: {
        name: 'VerdeGuida',
        short_name: 'VerdeGuida',
        description: 'Il tuo quaderno di campagna digitale',
        theme_color: '#556126',
        background_color: '#f5ede0',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'it',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geocoding-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
