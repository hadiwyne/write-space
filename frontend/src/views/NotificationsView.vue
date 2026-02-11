<template>
  <div class="notifications-page">
    <h1>Notifications</h1>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="notifications.length === 0" class="empty">No notifications yet.</div>
    <ul v-else class="notification-list">
      <li v-for="n in notifications" :key="notifId(n)" class="notification-item" :class="{ unread: !n.readAt }">
        <router-link :to="notificationLink(n)" class="notification-link" @click="markRead(notifId(n))">
          <img v-if="n.actor?.avatarUrl" :src="avatarSrc(n.actor.avatarUrl)" alt="" class="notif-avatar" />
          <span v-else class="notif-avatar-placeholder">{{ (n.actor?.displayName || n.actor?.username || '?')[0] }}</span>
          <div class="notif-body">
            <span class="notif-text">{{ notificationText(n) }}</span>
            <span class="notif-date">{{ formatDate(n.createdAt) }}</span>
          </div>
        </router-link>
      </li>
    </ul>
    <button v-if="notifications.length > 0" type="button" class="btn btn-sm mark-all" @click="markAllRead">Mark all as read</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, avatarSrc } from '@/api/client'
import { useNotificationsStore } from '@/stores/notifications'

type NotifRecord = Record<string, unknown> & {
  id?: string
  type?: string
  readAt?: string | null
  createdAt?: string
  actor?: { displayName?: string; username?: string; avatarUrl?: string | null }
  postId?: string
}

const notifications = ref<NotifRecord[]>([])
const loading = ref(true)
const notificationsStore = useNotificationsStore()

onMounted(async () => {
  try {
    const { data } = await api.get('/notifications')
    notifications.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
})

function notifId(n: NotifRecord) {
  return String(n.id ?? '')
}

function notificationText(n: NotifRecord) {
  const actor = (n.actor as { displayName?: string; username?: string })?.displayName || (n.actor as { username?: string })?.username || 'Someone'
  switch (n.type) {
    case 'LIKE':
      return `${actor} liked your post`
    case 'COMMENT':
      return `${actor} commented on your post`
    case 'COMMENT_REPLY':
      return `${actor} replied to your comment`
    case 'FOLLOW':
      return `${actor} started following you`
    default:
      return `${actor} notified you`
  }
}

function notificationLink(n: NotifRecord) {
  const postId = n.postId as string | undefined
  if (postId) return `/posts/${postId}`
  const username = n.actor?.username
  if (username) return `/u/${username}`
  return '/feed'
}

function formatDate(s: string | undefined) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return d.toLocaleDateString()
}

async function markRead(id: string) {
  try {
    await api.post(`/notifications/${id}/read`)
    const idx = notifications.value.findIndex((n) => notifId(n) === id)
    if (idx >= 0) (notifications.value[idx] as NotifRecord).readAt = new Date().toISOString()
    await notificationsStore.fetchUnreadCount()
  } catch {
    // ignore
  }
}

async function markAllRead() {
  await notificationsStore.markAllRead()
  notifications.value = notifications.value.map((n) => ({ ...n, readAt: new Date().toISOString() }))
}
</script>

<style scoped>
.notifications-page { padding: 0; }
.loading, .empty { color: var(--gray-700); padding: 1rem 0; }
.notification-list { list-style: none; margin: 0; padding: 0; }
.notification-item { border-bottom: 1px solid var(--gray-100); }
.notification-item.unread { background: var(--gray-50); }
.notification-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; color: inherit; text-decoration: none; }
.notification-link:hover { background: var(--gray-50); }
.notif-avatar, .notif-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: var(--gray-200); flex-shrink: 0; display: block; line-height: 40px; text-align: center; font-size: 1rem; }
.notif-body { display: flex; flex-direction: column; min-width: 0; }
.notif-text { font-size: 0.9375rem; }
.notif-date { font-size: 0.8125rem; color: var(--gray-600); margin-top: 0.25rem; }
.mark-all { margin-top: 1rem; padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: var(--radius); border: 1px solid var(--gray-300); background: #fff; cursor: pointer; }
.mark-all:hover { background: var(--gray-100); }
</style>
