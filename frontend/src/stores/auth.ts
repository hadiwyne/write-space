import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import { useLikedPostsStore } from './likedPosts'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('writespace_token'))
  const user = ref<{ id: string; username: string; displayName?: string; avatarUrl?: string } | null>(null)
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
  return { token, user, isLoggedIn, login, register, logout, fetchUser, setToken, clear }
}, { persist: { paths: ['token'] } })
