<template>
  <header class="header" :class="{ 'header--hidden': !headerVisible }">
    <router-link :to="auth.isLoggedIn ? '/feed' : '/'" class="logo" :aria-label="auth.isLoggedIn ? 'WriteSpace feed' : 'WriteSpace home'">WriteSpace</router-link>

    <div class="search-wrap">
      <form class="search-form" @submit.prevent="onSearch">
        <i class="pi pi-search search-icon" aria-hidden="true"></i>
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search posts and people…"
          aria-label="Search"
          autocomplete="off"
        />
      </form>
    </div>

    <nav class="nav" aria-label="Main navigation">
      <template v-if="auth.isLoggedIn">
        <router-link to="/feed" class="nav-btn" v-tooltip.bottom="'Feed'" aria-label="Feed">
          <i class="pi pi-home"></i>
        </router-link>
        <div class="notif-wrap" ref="notifWrapRef">
          <button type="button" class="nav-btn notif-btn" aria-label="Notifications" :aria-expanded="notifOpen" @click="notifOpen = !notifOpen">
            <i class="pi pi-bell"></i>
            <span v-if="!notifOpen && notifications.unreadCount > unreadCountWhenOpened" class="notif-bubble">{{ notifications.unreadCount > 99 ? '99+' : notifications.unreadCount }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="notifOpen" class="dropdown notif-dropdown" role="menu">
              <div class="notif-dropdown-header">
                <span class="notif-dropdown-title">Notifications</span>
                <button v-if="notifications.unreadCount > 0" type="button" class="notif-mark-all" @click="notifications.markAllRead()">Mark all read</button>
              </div>
              <div class="notif-tabs">
                <button type="button" class="notif-tab" :class="{ active: notifTab === 'all' }" @click="notifTab = 'all'">All</button>
                <button type="button" class="notif-tab" :class="{ active: notifTab === 'unread' }" @click="notifTab = 'unread'">Unread</button>
              </div>
              <div class="notif-list">
                <template v-if="displayedNotifications.length === 0">
                  <div class="notif-empty">{{ notifTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.' }}</div>
                </template>
                <router-link
                  v-for="n in displayedNotifications"
                  :key="n.id"
                  :to="notifLink(n)"
                  class="notif-item"
                  :class="{ unread: !n.readAt }"
                  @click="onNotifClick(n)"
                >
                  <span class="notif-dot" :class="{ unread: !n.readAt }" aria-hidden="true"></span>
                  <div class="notif-avatar-wrap">
                    <AvatarFrame :frame="actorFrame(n.actor)" :shape-class="avatarShapeClass(n.actor?.avatarShape)" :badge-url="actorBadgeUrl(n.actor)">
                      <img v-if="n.actor?.avatarUrl" :src="avatarSrc(n.actor.avatarUrl, n.actor?.id === auth.user?.id ? auth.avatarVersion : undefined)" alt="" class="notif-avatar" :class="avatarShapeClass(n.actor?.avatarShape)" />
                      <span v-else class="notif-avatar-placeholder" :class="avatarShapeClass(n.actor?.avatarShape)">{{ (n.actor?.displayName || n.actor?.username || '?')[0] }}</span>
                    </AvatarFrame>
                  </div>
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
        <router-link to="/follow-requests" class="nav-btn" v-tooltip.bottom="'Follow requests'" aria-label="Follow requests">
          <i class="pi pi-user-plus"></i>
        </router-link>
        <router-link to="/write" class="nav-btn nav-btn-create" v-tooltip.bottom="'Write a post'" aria-label="Write a post">
          <i class="pi pi-pencil"></i>
        </router-link>
        <div class="avatar-wrap" ref="avatarWrapRef">
          <button type="button" class="avatar-btn" :class="avatarShapeClass(auth.user?.avatarShape)" aria-label="Account menu" aria-haspopup="true" :aria-expanded="dropdownOpen" @click="dropdownOpen = !dropdownOpen">
            <AvatarFrame :frame="auth.user?.avatarFrame ?? null" :shape-class="avatarShapeClass(auth.user?.avatarShape)" :badge-url="authUserBadgeUrl()" :badge-cache-bust="auth.avatarVersion">
              <img v-if="auth.user?.avatarUrl" :src="avatarSrc(auth.user.avatarUrl, auth.avatarVersion)" alt="" class="avatar-img" />
              <span v-else class="avatar-initial">{{ (auth.user?.displayName || auth.user?.username || '?')[0] }}</span>
            </AvatarFrame>
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
              <router-link to="/customization" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-palette"></i> Customization
              </router-link>
              <router-link to="/privacy" class="dropdown-item" role="menuitem" @click="closeDropdown">
                <i class="pi pi-shield"></i> Privacy Settings
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
        <router-link to="/feed" class="nav-btn" v-tooltip.bottom="'Feed'" aria-label="Feed">
          <i class="pi pi-home"></i>
        </router-link>
        <router-link to="/login" class="nav-btn" v-tooltip.bottom="'Log in'" aria-label="Log in">
          <i class="pi pi-sign-in"></i>
        </router-link>
        <router-link to="/register" class="nav-btn nav-btn-primary" v-tooltip.bottom="'Sign up'" aria-label="Sign up">
          <i class="pi pi-user-plus"></i>
        </router-link>
      </template>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNotificationsStore } from '@/stores/notifications'
import { avatarSrc } from '@/api/client'
import { avatarShapeClass } from '@/utils/avatar'
import AvatarFrame from '@/components/AvatarFrame.vue'
import type { AvatarFrame as AvatarFrameType } from '@/types/avatarFrame'
import type { NotificationItem } from '@/stores/notifications'

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()
const route = useRoute()
const notifications = useNotificationsStore()
const dropdownOpen = ref(false)
const notifOpen = ref(false)
const notifTab = ref<'all' | 'unread'>('all')
const unreadCountWhenOpened = ref(0)
const searchQuery = ref('')
const displayedNotifications = computed(() => {
  if (notifTab.value === 'unread') return notifications.list.filter((n) => !n.readAt)
  return notifications.list
})
const avatarWrapRef = ref<HTMLElement | null>(null)
const notifWrapRef = ref<HTMLElement | null>(null)
const headerVisible = ref(true)
const lastScrollY = ref(0)
const scrollDownThreshold = 12
const scrollUpThreshold = 5

function getScrollY(): number {
  return window.scrollY ?? document.documentElement.scrollTop ?? 0
}

function onScroll() {
  const y = getScrollY()
  const prev = lastScrollY.value
  lastScrollY.value = y

  if (y <= scrollDownThreshold) {
    headerVisible.value = true
    return
  }
  const delta = y - prev
  if (delta > scrollDownThreshold) {
    headerVisible.value = false
  } else if (delta < -scrollUpThreshold) {
    headerVisible.value = true
  }
}

function closeDropdown() {
  dropdownOpen.value = false
}

function onSearch() {
  const q = searchQuery.value?.trim()
  if (q) router.push({ path: '/search', query: { q } })
  else router.push('/search')
}

async function logout() {
  dropdownOpen.value = false
  notifOpen.value = false
  notifications.disconnectSocket()
  theme.clearUserThemes()
  await auth.logout()
  router.push('/')
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(target)) dropdownOpen.value = false
  if (notifWrapRef.value && !notifWrapRef.value.contains(target)) notifOpen.value = false
}

function actorFrame(actor: NotificationItem['actor']): AvatarFrameType | null {
  return ((actor as { avatarFrame?: AvatarFrameType } | null)?.avatarFrame ?? null) as AvatarFrameType | null
}

function actorBadgeUrl(actor: NotificationItem['actor']): string | null {
  return (actor as { badgeUrl?: string } | null)?.badgeUrl ?? null
}

function authUserBadgeUrl(): string | null {
  return (auth.user as { badgeUrl?: string } | null)?.badgeUrl ?? null
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

function onNotifClick(n: NotificationItem) {
  notifOpen.value = false
  if (!n.readAt) notifications.markOneRead(n.id)
}

watch(notifOpen, (open) => {
  if (open) unreadCountWhenOpened.value = notifications.unreadCount
})

watch(() => auth.token, (token) => {
  if (token) notifications.init()
  else notifications.disconnectSocket()
})
watch(() => route.path, () => {
  headerVisible.value = true
})

onMounted(() => {
  lastScrollY.value = getScrollY()
  if (auth.token) {
    auth.fetchUser()
    notifications.init()
  }
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('scroll', onScroll)
  notifications.disconnectSocket()
})
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  width: 100%;
  padding: 0.75rem clamp(1rem, 4vw, 2rem);
  background: var(--nav-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 2px solid var(--border-medium);
  box-shadow: 0 2px 12px rgba(44, 24, 16, 0.06);
  animation: slideDown 0.5s ease-out;
  flex-wrap: wrap;
  transition: transform 0.25s ease;
}
.header.header--hidden {
  transform: translateY(-100%);
}
.logo {
  flex-shrink: 0;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 800;
  color: var(--accent-primary);
  letter-spacing: -0.03em;
  text-decoration: none;
  transition: opacity 0.3s ease;
}
.logo:hover {
  opacity: 0.8;
  text-decoration: none;
}

.search-wrap {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 500px;
  position: relative;
}
.search-form {
  position: relative;
  width: 100%;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.125rem;
  color: var(--text-tertiary);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-input::placeholder {
  color: var(--text-tertiary);
}
.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--text-secondary);
  font-size: 1.25rem;
  text-decoration: none;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-btn:hover {
  background: var(--bg-card);
  border-color: var(--border-medium);
  color: var(--accent-primary);
  text-decoration: none;
}
.nav-btn-create,
.nav-btn-primary {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}
.nav-btn-create:hover,
.nav-btn-primary:hover {
  background: var(--accent-burgundy);
  border-color: var(--accent-burgundy);
  color: white;
  text-decoration: none;
}

.avatar-wrap { position: relative; }
.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: 50%;
  background: var(--bg-primary);
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.2s ease;
}
.avatar-btn:has(.avatar-img) { background: none; }
.avatar-btn:hover { opacity: 0.8; }
.avatar-btn.avatar-shape-rounded { border-radius: 12%; }
.avatar-btn.avatar-shape-square { border-radius: 0; }
.avatar-btn.avatar-shape-squircle { border-radius: 25%; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-initial {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 10rem;
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
}
.dropdown-item:hover {
  background: var(--bg-primary);
  color: var(--accent-primary);
}
.dropdown-item .pi { font-size: 1rem; color: var(--text-tertiary); }
.dropdown-item-danger { color: var(--text-secondary); }
.dropdown-item-danger:hover { color: var(--accent-burgundy); background: rgba(107, 44, 62, 0.08); }
.dropdown-divider { height: 1px; margin: 0.25rem 0; background: var(--border-light); }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }

.notif-wrap { position: relative; }
.notif-btn { position: relative; }
.notif-bubble {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-align: center;
  color: white;
  background: var(--like-color);
  border-radius: 999px;
}
.notif-dropdown {
  min-width: min(20rem, 90vw);
  max-width: 22rem;
  max-height: min(24rem, 70vh);
  display: flex;
  flex-direction: column;
}
.notif-dropdown-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-light); }
.notif-dropdown-title { font-weight: 600; font-size: 0.9375rem; }
.notif-mark-all { padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--accent-primary); background: none; border: none; cursor: pointer; font-family: inherit; }
.notif-mark-all:hover { text-decoration: underline; }
.notif-tabs { display: flex; padding: 0 0.5rem; gap: 0.25rem; border-bottom: 1px solid var(--border-light); }
.notif-tab { padding: 0.375rem 0.625rem; font-size: 0.8125rem; color: var(--text-tertiary); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; font-family: inherit; }
.notif-tab:hover { color: var(--text-secondary); }
.notif-tab.active { color: var(--accent-primary); font-weight: 600; border-bottom-color: var(--accent-primary); }
.notif-list { overflow-y: auto; flex: 1; padding: 0.25rem 0; }
.notif-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: transparent; }
.notif-dot.unread { background: var(--like-color); }
.notif-empty { padding: 1rem 0.75rem; font-size: 0.875rem; color: var(--text-tertiary); text-align: center; }
.notif-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; color: inherit; text-decoration: none; }
.notif-item:hover { background: var(--bg-primary); }
.notif-item.unread { background: rgba(139, 69, 19, 0.05); }
.notif-avatar-wrap {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.notif-avatar-wrap :deep(.avatar-frame-root),
.notif-avatar-wrap :deep(.avatar-frame) {
  width: 100% !important;
  height: 100% !important;
  max-width: 36px !important;
  max-height: 36px !important;
  min-width: 0 !important;
  min-height: 0 !important;
  box-sizing: border-box;
  animation: none !important;
  transform: none !important;
}
.notif-avatar-wrap :deep(.avatar-frame > *) {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  object-fit: cover;
}
.notif-avatar, .notif-avatar-placeholder { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: var(--border-light); display: block; line-height: 36px; text-align: center; font-size: 0.875rem; box-sizing: border-box; }
.notif-avatar.avatar-shape-rounded, .notif-avatar-placeholder.avatar-shape-rounded { border-radius: 12%; }
.notif-avatar.avatar-shape-square, .notif-avatar-placeholder.avatar-shape-square { border-radius: 0; }
.notif-avatar.avatar-shape-squircle, .notif-avatar-placeholder.avatar-shape-squircle { border-radius: 25%; }
.notif-body { min-width: 0; flex: 1; }
.notif-text { font-size: 0.875rem; display: block; }
.notif-time { font-size: 0.75rem; color: var(--text-tertiary); }
.notif-see-all { display: block; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--accent-primary); text-align: center; border-top: 1px solid var(--border-light); text-decoration: none; }
.notif-see-all:hover { background: var(--bg-primary); }

@media (max-width: 768px) {
  .header { padding: 0.75rem 1rem; }
  .search-wrap { order: 3; width: 100%; max-width: none; margin-top: 0.75rem; flex: 1 1 100%; }
  .nav { flex-wrap: wrap; }
  .nav-btn, .avatar-btn { width: 40px; height: 40px; font-size: 1.125rem; }
  .notif-dropdown {
    position: fixed;
    left: 0.75rem;
    right: 0.75rem;
    top: 4.75rem;
    width: auto;
    min-width: 0;
    max-width: none;
    max-height: min(20rem, 60vh);
  }
}
@media (max-width: 480px) {
  .header { padding: 0.5rem 0.75rem; gap: 0.5rem; }
  .search-wrap { margin-top: 0.5rem; }
  .search-input { padding: 0.625rem 0.75rem 0.625rem 2.5rem; font-size: 0.875rem; }
  .search-icon { left: 0.75rem; }
  .notif-dropdown {
    left: 0.5rem;
    right: 0.5rem;
    top: 5.25rem;
    max-height: min(18rem, 55vh);
  }
}
</style>
