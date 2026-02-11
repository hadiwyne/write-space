import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

/** Base URL for API (use for avatar/image URLs that are relative, e.g. /uploads/avatars/...) */
export const apiBaseUrl = baseURL

/** Resolve avatar or upload URL: relative path -> baseURL + path; full URL -> as-is; host/path without protocol -> https:// + url */
export function avatarSrc(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return baseURL.replace(/\/$/, '') + url
  return 'https://' + url
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('writespace_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
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
