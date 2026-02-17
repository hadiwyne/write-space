// vite.config.ts
import { defineConfig } from "file:///D:/website/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/website/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import viteCompression from "file:///D:/website/frontend/node_modules/vite-plugin-compression/dist/index.mjs";
import { VitePWA } from "file:///D:/website/frontend/node_modules/vite-plugin-pwa/dist/index.js";
import { ViteImageOptimizer } from "file:///D:/website/frontend/node_modules/vite-plugin-image-optimizer/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///D:/website/frontend/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    // Image Optimization
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: void 0,
      include: void 0,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false
                // keep viewBox
              }
            }
          },
          "sortAttrs",
          {
            name: "addAttributesToSVGElement",
            params: {
              attributes: [{ xmlns: "http://www.w3.org/2000/svg" }]
            }
          }
        ]
      },
      png: {
        quality: 80
      },
      jpeg: {
        quality: 80
      },
      jpg: {
        quality: 80
      },
      webp: {
        lossless: true
      },
      avif: {
        lossless: true
      }
    }),
    // Service Worker with Workbox
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // API FEed
          {
            urlPattern: /\/api\/feed.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-feed-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60
              }
            }
          },
          // API Posts
          {
            urlPattern: /\/api\/posts\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-posts-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 15 * 60
              }
            }
          },
          // API Users/Profiles
          {
            urlPattern: /\/api\/users\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-users-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 15 * 60
              }
            }
          },
          // Uploads (avatars, images)
          {
            urlPattern: /\/uploads\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "uploads-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: "WriteSpace",
        short_name: "WriteSpace",
        description: "Creative writing platform",
        theme_color: "#8B4513",
        background_color: "#F5F1E8",
        display: "standalone",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
        // Better dev experience
      }
    }),
    // Brotli compression
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginFile: false
    }),
    // Gzip compression
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-vendor": ["vue", "vue-router", "pinia"],
          // Rich text editor 
          "editor": [
            "@tiptap/core",
            "@tiptap/vue-3",
            "@tiptap/starter-kit",
            "@tiptap/extension-blockquote",
            "@tiptap/extension-bold",
            "@tiptap/extension-bullet-list",
            "@tiptap/extension-code",
            "@tiptap/extension-code-block",
            "@tiptap/extension-heading",
            "@tiptap/extension-highlight",
            "@tiptap/extension-image",
            "@tiptap/extension-italic",
            "@tiptap/extension-link",
            "@tiptap/extension-ordered-list",
            "@tiptap/extension-strike",
            "@tiptap/extension-underline"
          ],
          // PrimeVue UI library
          "primevue": ["primevue/tooltip"],
          // Utility libraries
          "utils": ["axios", "dompurify", "marked", "socket.io-client"]
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.log in production
        drop_debugger: true,
        // Remove debugger statements
        pure_funcs: ["console.log", "console.info"]
        // Remove specific console methods
      },
      format: {
        comments: false
        // Remove comments
      }
    },
    // Enable source maps for debugging (optional, remove for smaller builds)
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
      // Uncomment to proxy Socket.IO (real-time notifications). Can cause noisy ws errors when backend restarts.
      // '/socket.io': { target: 'http://localhost:3000', ws: true },
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3ZWJzaXRlXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx3ZWJzaXRlXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi93ZWJzaXRlL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xyXG5pbXBvcnQgdml0ZUNvbXByZXNzaW9uIGZyb20gJ3ZpdGUtcGx1Z2luLWNvbXByZXNzaW9uJ1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJ1xyXG5pbXBvcnQgeyBWaXRlSW1hZ2VPcHRpbWl6ZXIgfSBmcm9tICd2aXRlLXBsdWdpbi1pbWFnZS1vcHRpbWl6ZXInXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHZ1ZSgpLFxyXG4gICAgLy8gSW1hZ2UgT3B0aW1pemF0aW9uXHJcbiAgICBWaXRlSW1hZ2VPcHRpbWl6ZXIoe1xyXG4gICAgICB0ZXN0OiAvXFwuKGpwZT9nfHBuZ3xnaWZ8dGlmZnx3ZWJwfHN2Z3xhdmlmKSQvaSxcclxuICAgICAgZXhjbHVkZTogdW5kZWZpbmVkLFxyXG4gICAgICBpbmNsdWRlOiB1bmRlZmluZWQsXHJcbiAgICAgIGluY2x1ZGVQdWJsaWM6IHRydWUsXHJcbiAgICAgIGxvZ1N0YXRzOiB0cnVlLFxyXG4gICAgICBhbnNpQ29sb3JzOiB0cnVlLFxyXG4gICAgICBzdmc6IHtcclxuICAgICAgICBtdWx0aXBhc3M6IHRydWUsXHJcbiAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAncHJlc2V0LWRlZmF1bHQnLFxyXG4gICAgICAgICAgICBwYXJhbXM6IHtcclxuICAgICAgICAgICAgICBvdmVycmlkZXM6IHtcclxuICAgICAgICAgICAgICAgIGNsZWFudXBOdW1lcmljVmFsdWVzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJlbW92ZVZpZXdCb3g6IGZhbHNlLCAvLyBrZWVwIHZpZXdCb3hcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICdzb3J0QXR0cnMnLFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnYWRkQXR0cmlidXRlc1RvU1ZHRWxlbWVudCcsXHJcbiAgICAgICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IFt7IHhtbG5zOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIH1dLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9LFxyXG4gICAgICBwbmc6IHtcclxuICAgICAgICBxdWFsaXR5OiA4MCxcclxuICAgICAgfSxcclxuICAgICAganBlZzoge1xyXG4gICAgICAgIHF1YWxpdHk6IDgwLFxyXG4gICAgICB9LFxyXG4gICAgICBqcGc6IHtcclxuICAgICAgICBxdWFsaXR5OiA4MCxcclxuICAgICAgfSxcclxuICAgICAgd2VicDoge1xyXG4gICAgICAgIGxvc3NsZXNzOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICBhdmlmOiB7XHJcbiAgICAgICAgbG9zc2xlc3M6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIC8vIFNlcnZpY2UgV29ya2VyIHdpdGggV29ya2JveFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24ucG5nJ10sXHJcbiAgICAgIHdvcmtib3g6IHtcclxuICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd29mZjJ9J10sXHJcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgIC8vIEdvb2dsZSBGb250c1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ29vZ2xlYXBpc1xcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2dvb2dsZS1mb250cy1jYWNoZScsXHJcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ3N0YXRpY1xcLmNvbVxcLy4qL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2dzdGF0aWMtZm9udHMtY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcclxuICAgICAgICAgICAgICAgIHN0YXR1c2VzOiBbMCwgMjAwXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIC8vIEFQSSBGRWVkXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC9hcGlcXC9mZWVkLiovaSxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ1N0YWxlV2hpbGVSZXZhbGlkYXRlJyxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2FwaS1mZWVkLWNhY2hlJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDUgKiA2MCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIC8vIEFQSSBQb3N0c1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwvYXBpXFwvcG9zdHNcXC8uKi9pLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiAnU3RhbGVXaGlsZVJldmFsaWRhdGUnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnYXBpLXBvc3RzLWNhY2hlJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMDAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiAxNSAqIDYwLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgLy8gQVBJIFVzZXJzL1Byb2ZpbGVzXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC9hcGlcXC91c2Vyc1xcLy4qL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdTdGFsZVdoaWxlUmV2YWxpZGF0ZScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdhcGktdXNlcnMtY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogMTUgKiA2MCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIC8vIFVwbG9hZHMgKGF2YXRhcnMsIGltYWdlcylcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcL3VwbG9hZHNcXC8uKi9pLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICd1cGxvYWRzLWNhY2hlJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAyMDAsXHJcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnV3JpdGVTcGFjZScsXHJcbiAgICAgICAgc2hvcnRfbmFtZTogJ1dyaXRlU3BhY2UnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRpdmUgd3JpdGluZyBwbGF0Zm9ybScsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjOEI0NTEzJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI0Y1RjFFOCcsXHJcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9mYXZpY29uLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL2Zhdmljb24ucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHR5cGU6ICdtb2R1bGUnLCAvLyBCZXR0ZXIgZGV2IGV4cGVyaWVuY2VcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgLy8gQnJvdGxpIGNvbXByZXNzaW9uXHJcbiAgICB2aXRlQ29tcHJlc3Npb24oe1xyXG4gICAgICBhbGdvcml0aG06ICdicm90bGlDb21wcmVzcycsXHJcbiAgICAgIGV4dDogJy5icicsXHJcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcclxuICAgICAgZGVsZXRlT3JpZ2luRmlsZTogZmFsc2UsXHJcbiAgICB9KSxcclxuICAgIC8vIEd6aXAgY29tcHJlc3Npb25cclxuICAgIHZpdGVDb21wcmVzc2lvbih7XHJcbiAgICAgIGFsZ29yaXRobTogJ2d6aXAnLFxyXG4gICAgICBleHQ6ICcuZ3onLFxyXG4gICAgICB0aHJlc2hvbGQ6IDEwMjQsXHJcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxyXG4gICAgfSksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICd2dWUtdmVuZG9yJzogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYSddLFxyXG4gICAgICAgICAgLy8gUmljaCB0ZXh0IGVkaXRvciBcclxuICAgICAgICAgICdlZGl0b3InOiBbXHJcbiAgICAgICAgICAgICdAdGlwdGFwL2NvcmUnLFxyXG4gICAgICAgICAgICAnQHRpcHRhcC92dWUtMycsXHJcbiAgICAgICAgICAgICdAdGlwdGFwL3N0YXJ0ZXIta2l0JyxcclxuICAgICAgICAgICAgJ0B0aXB0YXAvZXh0ZW5zaW9uLWJsb2NrcXVvdGUnLFxyXG4gICAgICAgICAgICAnQHRpcHRhcC9leHRlbnNpb24tYm9sZCcsXHJcbiAgICAgICAgICAgICdAdGlwdGFwL2V4dGVuc2lvbi1idWxsZXQtbGlzdCcsXHJcbiAgICAgICAgICAgICdAdGlwdGFwL2V4dGVuc2lvbi1jb2RlJyxcclxuICAgICAgICAgICAgJ0B0aXB0YXAvZXh0ZW5zaW9uLWNvZGUtYmxvY2snLFxyXG4gICAgICAgICAgICAnQHRpcHRhcC9leHRlbnNpb24taGVhZGluZycsXHJcbiAgICAgICAgICAgICdAdGlwdGFwL2V4dGVuc2lvbi1oaWdobGlnaHQnLFxyXG4gICAgICAgICAgICAnQHRpcHRhcC9leHRlbnNpb24taW1hZ2UnLFxyXG4gICAgICAgICAgICAnQHRpcHRhcC9leHRlbnNpb24taXRhbGljJyxcclxuICAgICAgICAgICAgJ0B0aXB0YXAvZXh0ZW5zaW9uLWxpbmsnLFxyXG4gICAgICAgICAgICAnQHRpcHRhcC9leHRlbnNpb24tb3JkZXJlZC1saXN0JyxcclxuICAgICAgICAgICAgJ0B0aXB0YXAvZXh0ZW5zaW9uLXN0cmlrZScsXHJcbiAgICAgICAgICAgICdAdGlwdGFwL2V4dGVuc2lvbi11bmRlcmxpbmUnLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIFByaW1lVnVlIFVJIGxpYnJhcnlcclxuICAgICAgICAgICdwcmltZXZ1ZSc6IFsncHJpbWV2dWUvdG9vbHRpcCddLFxyXG4gICAgICAgICAgLy8gVXRpbGl0eSBsaWJyYXJpZXNcclxuICAgICAgICAgICd1dGlscyc6IFsnYXhpb3MnLCAnZG9tcHVyaWZ5JywgJ21hcmtlZCcsICdzb2NrZXQuaW8tY2xpZW50J10sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcclxuICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICB0ZXJzZXJPcHRpb25zOiB7XHJcbiAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLCAvLyBSZW1vdmUgY29uc29sZS5sb2cgaW4gcHJvZHVjdGlvblxyXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsIC8vIFJlbW92ZSBkZWJ1Z2dlciBzdGF0ZW1lbnRzXHJcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nXSwgLy8gUmVtb3ZlIHNwZWNpZmljIGNvbnNvbGUgbWV0aG9kc1xyXG4gICAgICB9LFxyXG4gICAgICBmb3JtYXQ6IHtcclxuICAgICAgICBjb21tZW50czogZmFsc2UsIC8vIFJlbW92ZSBjb21tZW50c1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIEVuYWJsZSBzb3VyY2UgbWFwcyBmb3IgZGVidWdnaW5nIChvcHRpb25hbCwgcmVtb3ZlIGZvciBzbWFsbGVyIGJ1aWxkcylcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpLFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBVbmNvbW1lbnQgdG8gcHJveHkgU29ja2V0LklPIChyZWFsLXRpbWUgbm90aWZpY2F0aW9ucykuIENhbiBjYXVzZSBub2lzeSB3cyBlcnJvcnMgd2hlbiBiYWNrZW5kIHJlc3RhcnRzLlxyXG4gICAgICAvLyAnL3NvY2tldC5pbyc6IHsgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJywgd3M6IHRydWUgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpUCxTQUFTLG9CQUFvQjtBQUM5USxPQUFPLFNBQVM7QUFDaEIsU0FBUyxlQUFlLFdBQVc7QUFDbkMsT0FBTyxxQkFBcUI7QUFDNUIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsMEJBQTBCO0FBTGdILElBQU0sMkNBQTJDO0FBT3BNLElBQU8sc0JBQVEs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
