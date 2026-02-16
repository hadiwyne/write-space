import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import Tooltip from 'primevue/tooltip'
import 'primeicons/primeicons.css'
import faviconUrl from './assets/favicon.png'
import { cleanupOldEntries } from './utils/indexedDBCache'

const link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]') ?? document.createElement('link')
link.rel = 'icon'
link.type = 'image/png'
link.href = faviconUrl
document.head.appendChild(link)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
// Apply saved theme before mounting so first paint uses it
import { useThemeStore } from './stores/theme'
const theme = useThemeStore()
theme.init()
app.use(router)
app.directive('tooltip', Tooltip)
app.mount('#app')

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('Service Worker registration failed:', err)
        })
    })
}

// Cleanup old IndexedDB entries on app mount
cleanupOldEntries().catch((err) => {
    console.warn('IndexedDB cleanup failed:', err)
})
