import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { AvatarFrame } from '@/types/avatarFrame'
import { useLikedPostsStore } from './likedPosts'

export interface AuthUser {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  avatarShape?: string | null
  avatarFrame?: AvatarFrame
  badgeUrl?: string | null
  isSuperadmin?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('writespace_token'))
  const user = ref<AuthUser | null>(null)
  /** Bump after avatar upload so avatar URLs get ?v= and browser refetches instead of using cache */
  const avatarVersion = ref(0)
  const isLoggedIn = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('writespace_token', t)
  }
  function clear() {
    token.value = null
    user.value = null
    localStorage.removeItem('writespace_token')
  }
  async function fetchUser() {
    if (!token.value) return
    const { data } = await api.get('/users/me')
    user.value = data
    return data
  }
  async function login(email: string, password: string) {
    const { data } = await api.post<{ accessToken: string }>('/auth/login', { email, password })
    setToken(data.accessToken)
    await fetchUser()
  }
  async function register(email: string, username: string, password: string) {
    const { data } = await api.post<{ accessToken: string }>('/auth/register', { email, username, password })
    setToken(data.accessToken)
    await fetchUser()
  }
  function logout() {
    useLikedPostsStore().clear()
    clear()
  }
  function bumpAvatarVersion() {
    avatarVersion.value = Date.now()
  }

  return { token, user, avatarVersion, isLoggedIn, login, register, logout, fetchUser, setToken, clear, bumpAvatarVersion }
}, { persist: { paths: ['token'] } })
