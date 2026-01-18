import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Generate build timestamp for cache busting
const BUILD_VERSION = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
const BUILD_TIME = new Date().toISOString();

export default defineConfig({
  define: {
    // Inject build timestamp at build time
    'import.meta.env.BUILD_TIME': JSON.stringify(BUILD_TIME),
  },
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
    // Ensure unique filenames on every build using content-based hashing
    // contenthash changes when file content changes, ensuring proper cache invalidation
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[contenthash].js`,
        chunkFileNames: `assets/[name]-[contenthash].js`,
        assetFileNames: `assets/[name]-[contenthash].[ext]`
      }
    },
    // Add cache-busting query params
    assetsInlineLimit: 0
  }
})
