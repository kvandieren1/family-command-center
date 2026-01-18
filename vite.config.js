import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Generate build timestamp for cache busting
const BUILD_VERSION = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Changed to prompt for better cache control
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Family Command Center',
        short_name: 'Command Center',
        description: 'Household Command Center PWA',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Force cache invalidation on each build
        cacheId: `family-command-center-${BUILD_VERSION}`,
        // Use network-first strategy for HTML to ensure updates
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:html)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: `html-cache-${BUILD_VERSION}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: `assets-cache-${BUILD_VERSION}`,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    // Ensure unique filenames on every build
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${BUILD_VERSION}-[hash].js`,
        chunkFileNames: `assets/[name]-${BUILD_VERSION}-[hash].js`,
        assetFileNames: `assets/[name]-${BUILD_VERSION}-[hash].[ext]`
      }
    },
    // Add cache-busting query params
    assetsInlineLimit: 0
  }
})
