<template>
  <header class="header">
    <router-link to="/" class="logo">WriteSpace</router-link>
    <nav class="nav">
      <template v-if="auth.isLoggedIn">
        <router-link to="/feed" class="nav-link" v-tooltip.bottom="'Feed'" aria-label="Feed">
          <i class="pi pi-home"></i>
        </router-link>
        <router-link to="/write" class="nav-link" v-tooltip.bottom="'Write a post'" aria-label="Write a post">
          <i class="pi pi-pencil"></i>
        </router-link>
        <div class="notif-wrap" ref="notifWrapRef">
          <button type="button" class="nav-link notif-btn" aria-label="Notifications" :aria-expanded="notifOpen" @click="notifOpen = !notifOpen">
            <i class="pi pi-bell"></i>
            <span v-if="notifications.unreadCount > 0" class="notif-bubble">{{ notifications.unreadCount > 99 ? '99+' : notifications.unreadCount }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="notifOpen" class="dropdown notif-dropdown" role="menu">
              <div class="notif-dropdown-header">
                <span class="notif-dropdown-title">Notifications</span>
                <button v-if="notifications.unreadCount > 0" type="button" class="notif-mark-all" @click="notifications.markAllRead()">Mark all read</button>
              </div>
              <div class="notif-list">
                <template v-if="notifications.list.length === 0">
                  <div class="notif-empty">No notifications yet.</div>
                </template>
                <router-link
                  v-for="n in notifications.list"
                  :key="n.id"
                  :to="notifLink(n)"
                  class="notif-item"
                  :class="{ unread: !n.readAt }"
                  @click="notifOpen = false"
                >
                  <img v-if="n.actor?.avatarUrl" :src="avatarSrc(n.actor.avatarUrl)" alt="" class="notif-avatar" />
                  <span v-else class="notif-avatar-placeholder">{{ (n.actor?.displayName || n.actor?.username || '?')[0] }}</span>
                  <div class="notif-body">
                    <span class="notif-text">{{ notifText(n) }}</span>
                    <span class="notif-time">{{ notifTime(n.createdAt) }}</span>
                  </div>
                </router-link>
              </div>
              <router-link to="/notifications" class="notif-see-all" @click="notifOpen = false">See all</router-link>
            </div>
          </Transition>
        </div>
        <div class="avatar-wrap" ref="avatarWrapRef">
          <button type="button" class="avatar-btn" aria-label="Account menu" aria-haspopup="true" :aria-expanded="dropdownOpen" @click="dropdownOpen = !dropdownOpen">
            <img v-if="auth.user?.avatarUrl" :src="avatarSrc(auth.user.avatarUrl)" alt="" class="avatar-img" />
            <span v-else class="avatar-initial">{{ (auth.user?.displayName || auth.user?.username || '?')[0] }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="dropdown" role="menu">
              <router-link :to="`/u/${auth.user?.username}`" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-user"></i> Profile
              </router-link>
              <router-link to="/settings" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-cog"></i> Settings
              </router-link>
              <router-link to="/archived" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-folder"></i> Archived
              </router-link>
              <router-link to="/bookmarks" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-bookmark"></i> Bookmarks
              </router-link>
              <router-link to="/collections" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-folder-open"></i> Collections
              </router-link>
              <div class="dropdown-divider"></div>
              <button type="button" class="dropdown-item dropdown-item-danger" role="menuitem" @click="logout">
                <i class="pi pi-sign-out"></i> Log out
              </button>
            </div>
          </Transition>
        </div>
      </template>
      <template v-else>
        <router-link to="/feed" class="nav-link" v-tooltip.bottom="'Feed'" aria-label="Feed">
          <i class="pi pi-home"></i>
        </router-link>
        <router-link to="/login" class="nav-link" v-tooltip.bottom="'Log in'" aria-label="Log in">
          <i class="pi pi-sign-in"></i>
        </router-link>
        <router-link to="/register" class="btn btn-primary nav-link" v-tooltip.bottom="'Sign up'" aria-label="Sign up">
          <i class="pi pi-user-plus"></i>
        </router-link>
      </template>
    </nav>
  </header>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { apiBaseUrl } from '@/api/client'
import type { NotificationItem } from '@/stores/notifications'

const auth = useAuthStore()
const router = useRouter()
const notifications = useNotificationsStore()
const dropdownOpen = ref(false)
const notifOpen = ref(false)
const avatarWrapRef = ref<HTMLElement | null>(null)
const notifWrapRef = ref<HTMLElement | null>(null)

function avatarSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBaseUrl + url
}

function closeDropdown() {
  dropdownOpen.value = false
}

function logout() {
  dropdownOpen.value = false
  notifOpen.value = false
  notifications.disconnectSocket()
  auth.logout()
  router.push('/')
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(target)) dropdownOpen.value = false
  if (notifWrapRef.value && !notifWrapRef.value.contains(target)) notifOpen.value = false
}

function notifText(n: NotificationItem) {
  const name = n.actor?.displayName || n.actor?.username || 'Someone'
  switch (n.type) {
    case 'LIKE':
      return `${name} liked your post`
    case 'COMMENT':
      return `${name} commented on your post`
    case 'COMMENT_REPLY':
      return `${name} replied to your comment`
    case 'FOLLOW':
      return `${name} started following you`
    default:
      return `${name} notified you`
  }
}

function notifTime(createdAt: string) {
  const d = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return d.toLocaleDateString()
}

function notifLink(n: NotificationItem) {
  if (n.post?.id) return `/posts/${n.post.id}`
  if (n.actor?.username) return `/u/${n.actor.username}`
  return '/feed'
}

watch(() => auth.token, (token) => {
  if (token) notifications.init()
  else notifications.disconnectSocket()
})

onMounted(() => {
  if (auth.token) {
    auth.fetchUser()
    notifications.init()
  }
  document.addEventListener('click', onDocumentClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  notifications.disconnectSocket()
})
</script>
<style scoped>
.header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: #fff; border-bottom: 1px solid var(--gray-200); box-shadow: var(--shadow); }
.logo { font-weight: 700; font-size: 1.25rem; color: var(--gray-900); }
.logo:hover { text-decoration: none; color: var(--primary); }
.nav { display: flex; align-items: center; gap: 1.25rem; }
.nav-link { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; color: var(--gray-700); font-size: 1.25rem; text-decoration: none; border-radius: var(--radius); }
.nav-link:hover { color: var(--primary); background: var(--gray-100); }
.nav-link .pi { font-size: 1.25rem; }
.nav-notifications { position: relative; }
.nav a { color: inherit; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.nav .btn.nav-link { padding: 0; min-width: 2.25rem; min-height: 2.25rem; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-ghost { background: transparent; color: var(--gray-700); }
.btn-ghost:hover { background: var(--gray-100); }

/* Avatar (left of nav when logged in) */
.avatar-wrap { position: relative; }
.avatar-btn { display: flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; padding: 0; border: none; border-radius: 50%; background: var(--gray-200); cursor: pointer; overflow: hidden; }
.avatar-btn:hover { background: var(--gray-300); }
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-initial { font-size: 0.9375rem; font-weight: 600; color: var(--gray-700); }

/* Dropdown */
.dropdown { position: absolute; top: calc(100% + 0.5rem); right: 0; left: auto; min-width: 10rem; padding: 0.25rem 0; background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; }
.dropdown-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 1rem; border: none; background: none; color: var(--gray-900); font-size: 0.9375rem; text-align: left; cursor: pointer; text-decoration: none; }
.dropdown-item:hover { background: var(--gray-100); }
.dropdown-item .pi { font-size: 1rem; color: var(--gray-600); }
.dropdown-item-danger { color: var(--gray-700); }
.dropdown-item-danger:hover { color: #b91c1c; background: #fef2f2; }
.dropdown-divider { height: 1px; margin: 0.25rem 0; background: var(--gray-200); }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }

/* Notifications */
.notif-wrap { position: relative; }
.notif-btn { position: relative; }
.notif-bubble { position: absolute; top: -2px; right: -2px; min-width: 1.125rem; height: 1.125rem; padding: 0 0.25rem; font-size: 0.6875rem; font-weight: 600; line-height: 1.125rem; text-align: center; color: #fff; background: #dc2626; border-radius: 999px; }
.notif-dropdown { min-width: 20rem; max-width: 22rem; max-height: 24rem; display: flex; flex-direction: column; }
.notif-dropdown-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--gray-200); }
.notif-dropdown-title { font-weight: 600; font-size: 0.9375rem; }
.notif-mark-all { padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--primary); background: none; border: none; cursor: pointer; }
.notif-mark-all:hover { text-decoration: underline; }
.notif-list { overflow-y: auto; flex: 1; padding: 0.25rem 0; }
.notif-empty { padding: 1rem 0.75rem; font-size: 0.875rem; color: var(--gray-600); text-align: center; }
.notif-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; color: inherit; text-decoration: none; }
.notif-item:hover { background: var(--gray-50); }
.notif-item.unread { background: var(--gray-50); }
.notif-avatar, .notif-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: var(--gray-200); flex-shrink: 0; display: block; line-height: 36px; text-align: center; font-size: 0.875rem; }
.notif-body { min-width: 0; flex: 1; }
.notif-text { font-size: 0.875rem; display: block; }
.notif-time { font-size: 0.75rem; color: var(--gray-600); }
.notif-see-all { display: block; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--primary); text-align: center; border-top: 1px solid var(--gray-200); text-decoration: none; }
.notif-see-all:hover { background: var(--gray-50); }
</style>
