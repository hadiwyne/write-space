import axios from 'axios'

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

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('writespace_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

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
