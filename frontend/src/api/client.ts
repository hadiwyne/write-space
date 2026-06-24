import axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'

const baseURL = import.meta.env.VITE_API_URL || '/api'

/** Base URL for API */
export const apiBaseUrl = baseURL

export function avatarSrc(url: string | null | undefined, cacheBust?: string | number): string {
  if (!url) return ''
  let out: string
  if (url.startsWith('http')) out = url
  else if (url.startsWith('/')) out = baseURL.replace(/\/$/, '') + url
  else out = 'https://' + url
  if (cacheBust !== undefined && cacheBust !== '') out += (out.includes('?') ? '&' : '?') + 'v=' + String(cacheBust)
  return out
}

export function resolveContentImageUrls(html: string | null | undefined): string {
  if (!html) return ''
  const base = baseURL.replace(/\/$/, '')
  const basePath = base.replace(/^\//, '')
  return html.replace(/src=(["'])(\/[^"']*)\1/g, (m, q, path) => {
    const pathNorm = path.replace(/^\//, '')
    if (basePath && (pathNorm === basePath || pathNorm.startsWith(basePath + '/'))) return m
    return `src=${q}${base}${path}${q}`
  })
}

const REAL_TIME_ENDPOINTS = [
  '/presence/online-count',
  '/notifications/unread-count',
  '/users/search',
]

const axiosInstance = axios.create({
  baseURL,
})

// Cache interceptor
export const api = setupCache(axiosInstance, {
  ttl: 5 * 60 * 1000, // 5 minutes default cache
  methods: ['get'],
  cachePredicate: {
    statusCheck: (status) => (status as number) >= 200 && (status as number) < 400,
  },
})

declare module 'axios' {
  interface AxiosRequestConfig {
    cache?: boolean | import('axios-cache-interceptor').CacheRequestConfig;
  }
}

api.interceptors.request.use((config) => {
  const url = config.url || ''
  if (REAL_TIME_ENDPOINTS.some(path => url.includes(path))) {
    // @ts-ignore
    config.cache = false
  }

  const token = localStorage.getItem('writespace_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

/** Clears all cached API responses on logout. */
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

const PUBLIC_PATH_PATTERNS = [
  /^\/posts\/[^/]+$/,
  /^\/u\/[^/]+$/,
  /^\/series\/[^/]+$/,
  /^\/collections\/[^/]+$/,
]

function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PATTERNS.some(p => p.test(path))
}

let handling401 = false
const AUTH_PERSIST_KEY = 'auth'

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''

    if (err.response?.status === 401 && !handling401 && !isPublicPath(path)) {
      handling401 = true
      localStorage.removeItem('writespace_token')
      localStorage.removeItem(AUTH_PERSIST_KEY)
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.assign('/login')
      }
      setTimeout(() => { handling401 = false }, 500)
    }

    return Promise.reject(err)
  }
)
