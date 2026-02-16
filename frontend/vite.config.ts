import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    vue(),
    // Image Optimization
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false, // keep viewBox
              },
            },
          },
          'sortAttrs',
          {
            name: 'addAttributesToSVGElement',
            params: {
              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
          },
        ],
      },
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: true,
      },
      avif: {
        lossless: true,
      },
    }),
    // Service Worker with Workbox
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // API FEed
          {
            urlPattern: /\/api\/feed.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-feed-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60,
              },
              networkTimeoutSeconds: 3,
            },
          },
          // API Posts
          {
            urlPattern: /\/api\/posts\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-posts-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 10 * 60,
              },
              networkTimeoutSeconds: 3,
            },
          },
          // API Users/Profiles
          {
            urlPattern: /\/api\/users\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-users-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 15 * 60,
              },
              networkTimeoutSeconds: 3,
            },
          },
          // Uploads (avatars, images)
          {
            urlPattern: /\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'WriteSpace',
        short_name: 'WriteSpace',
        description: 'Creative writing platform',
        theme_color: '#8B4513',
        background_color: '#F5F1E8',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module', // Better dev experience
      },
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Rich text editor 
          'editor': [
            '@tiptap/core',
            '@tiptap/vue-3',
            '@tiptap/starter-kit',
            '@tiptap/extension-blockquote',
            '@tiptap/extension-bold',
            '@tiptap/extension-bullet-list',
            '@tiptap/extension-code',
            '@tiptap/extension-code-block',
            '@tiptap/extension-heading',
            '@tiptap/extension-highlight',
            '@tiptap/extension-image',
            '@tiptap/extension-italic',
            '@tiptap/extension-link',
            '@tiptap/extension-ordered-list',
            '@tiptap/extension-strike',
            '@tiptap/extension-underline',
          ],
          // PrimeVue UI library
          'primevue': ['primevue/tooltip'],
          // Utility libraries
          'utils': ['axios', 'dompurify', 'marked', 'socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Enable source maps for debugging (optional, remove for smaller builds)
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Uncomment to proxy Socket.IO (real-time notifications). Can cause noisy ws errors when backend restarts.
      // '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
})
