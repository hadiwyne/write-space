import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { api } from '@/api/client'
import { useAuthStore } from './auth'

export type NotificationItem = {
  id: string
  type: string
  readAt: string | null
  createdAt: string
  actor?: { id: string; username: string; displayName: string | null; avatarUrl: string | null; avatarShape?: string | null }
  post?: { id: string; title: string }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const list = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  let socket: ReturnType<typeof io> | null = null

  async function fetchNotifications(limit = 15) {
    try {
      const { data } = await api.get(`/notifications?limit=${limit}`)
      list.value = Array.isArray(data) ? data : []
    } catch {
      list.value = []
    }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count')
      unreadCount.value = data?.count ?? 0
    } catch {
      unreadCount.value = 0
    }
  }

  function connectSocket(token: string) {
    if (socket?.connected) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    // In dev, Vite may not proxy /socket.io; avoid connection attempts that can cause reloads
    const isDev = import.meta.env.DEV && !import.meta.env.VITE_API_URL
    if (isDev) return
    socket = io(`${origin}/notifications`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socket.on('notification', (payload: NotificationItem) => {
      list.value = [payload, ...list.value].slice(0, 50)
      unreadCount.value += 1
    })
    socket.on('connect', () => {
      fetchUnreadCount()
    })
  }

  function disconnectSocket() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  async function markOneRead(id: string) {
    const wasUnread = list.value.some((n) => n.id === id && !n.readAt)
    const now = new Date().toISOString()
    // Optimistic update so the UI updates immediately when user clicks (before navigation)
    list.value = list.value.map((n) => (n.id === id ? { ...n, readAt: now } : n))
    if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)
    try {
      await api.post(`/notifications/${id}/read`)
    } catch {
      // Revert on failure
      list.value = list.value.map((n) => (n.id === id ? { ...n, readAt: null } : n))
      if (wasUnread) unreadCount.value += 1
    }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all')
      unreadCount.value = 0
      list.value = list.value.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    } catch {
      // ignore
    }
  }

  async function init() {
    const auth = useAuthStore()
    if (!auth.token) {
      disconnectSocket()
      list.value = []
      unreadCount.value = 0
      return
    }
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
    connectSocket(auth.token)
  }

  return {
    list,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markOneRead,
    markAllRead,
    init,
    disconnectSocket,
  }
})
