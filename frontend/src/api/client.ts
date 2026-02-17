import axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'

const baseURL = import.meta.env.VITE_API_URL || '/api'

/** Base URL for API (use for avatar/image URLs that are relative, e.g. /uploads/avatars/...) */
export const apiBaseUrl = baseURL

/** Resolve avatar or upload URL: relative path -> baseURL + path; full URL -> as-is. Optional cacheBust (e.g. after upload) appends ?v= so the browser refetches. */
export function avatarSrc(url: string | null | undefined, cacheBust?: string | number): string {
  if (!url) return ''
  let out: string
  if (url.startsWith('http')) out = url
  else if (url.startsWith('/')) out = baseURL.replace(/\/$/, '') + url
  else out = 'https://' + url
  if (cacheBust !== undefined && cacheBust !== '') out += (out.includes('?') ? '&' : '?') + 'v=' + String(cacheBust)
  return out
}

const REAL_TIME_ENDPOINTS = [
  '/presence/online-count',
  '/notifications/unread-count',
]

const axiosInstance = axios.create({
  baseURL,
})

// Wrap with cache interceptor
export const api = setupCache(axiosInstance, {
  ttl: 5 * 60 * 1000, // 5 minutes default cache
  methods: ['get'], // Only cache GET requests
  cachePredicate: {
    statusCheck: (status) => (status as number) >= 200 && (status as number) < 400, // Cache successful responses
  },
})

// Extend AxiosRequestConfig type to include 'cache' property
declare module 'axios' {
  interface AxiosRequestConfig {
    cache?: boolean | import('axios-cache-interceptor').CacheRequestConfig;
  }
}

// Add manual bypass in interceptor or check if we can use 'cache: false' in requests
// Actually, axios-cache-interceptor allows passing cache: false in the request config.
// But we want to do it globally for these endpoints.

api.interceptors.request.use((config) => {
  const url = config.url || ''
  if (REAL_TIME_ENDPOINTS.some(path => url.includes(path))) {
    // @ts-ignore - axios-cache-interceptor adds this property
    config.cache = false
  }

  const token = localStorage.getItem('writespace_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

/** Clears all cached API responses. Use on logout. */
export async function clearApiCache() {
  await api.storage.remove('all')
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('writespace_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Handle 401 unauthorized
let handling401 = false
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !handling401) {
      handling401 = true
      localStorage.removeItem('writespace_token')
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.assign('/login')
      }
      setTimeout(() => { handling401 = false }, 500)
    }
    return Promise.reject(err)
  }
)
