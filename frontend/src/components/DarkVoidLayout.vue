<template>
  <div class="dark-void-layout">
    <aside class="dark-void-nav" aria-label="Main navigation">
      <router-link :to="auth.isLoggedIn ? '/feed' : '/'" class="dark-void-logo" aria-label="WriteSpace">
        <span class="dark-void-logo-w">W</span>
      </router-link>
      <nav class="dark-void-nav-links">
        <router-link to="/feed" class="dark-void-nav-btn" aria-label="Feed">
          <i class="pi pi-home" aria-hidden="true"></i>
        </router-link>
        <router-link to="/search" class="dark-void-nav-btn" aria-label="Search">
          <i class="pi pi-search" aria-hidden="true"></i>
        </router-link>
        <router-link to="/notifications" class="dark-void-nav-btn" aria-label="Notifications">
          <i class="pi pi-bell" aria-hidden="true"></i>
        </router-link>
        <router-link v-if="auth.user" :to="`/u/${auth.user.username}`" class="dark-void-nav-btn" aria-label="Profile">
          <i class="pi pi-user" aria-hidden="true"></i>
        </router-link>
        <button
          type="button"
          class="dark-void-sidebar-toggle"
          aria-label="Open menu"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = true"
        >
          <i class="pi pi-bars" aria-hidden="true"></i>
        </button>
      </nav>
    </aside>

    <main class="dark-void-main">
      <p v-if="auth.isLoggedIn" class="dark-void-tagline">WHERE THOUGHTS GO TO BECOME DIGITAL GHOSTS.</p>
      <RouterView />
    </main>

    <Transition name="dark-void-fade">
      <div
        v-if="sidebarOpen"
        class="dark-void-sidebar-backdrop"
        aria-hidden="true"
        @click="sidebarOpen = false"
      />
    </Transition>

    <aside class="dark-void-sidebar" :class="{ 'dark-void-sidebar-open': sidebarOpen }" aria-label="Profile and trending">
      <div v-if="auth.user" class="dark-void-profile-card">
        <div class="dark-void-avatar-wrap" ref="avatarWrapRef">
          <button
            type="button"
            class="dark-void-profile-avatar-btn"
            :class="avatarShapeClass(auth.user.avatarShape)"
            aria-label="Account menu"
            aria-haspopup="true"
            :aria-expanded="dropdownOpen"
            @click="dropdownOpen = !dropdownOpen"
          >
            <AvatarFrame
              :frame="auth.user.avatarFrame ?? null"
              :shape-class="avatarShapeClass(auth.user.avatarShape)"
              :badge-url="authUserBadgeUrl()"
              :badge-cache-bust="auth.avatarVersion"
            >
              <img v-if="auth.user.avatarUrl" :src="avatarSrc(auth.user.avatarUrl, auth.avatarVersion)" alt="" class="dark-void-avatar-img" />
              <span v-else class="dark-void-avatar-placeholder">{{ (auth.user.displayName || auth.user.username || '?')[0] }}</span>
            </AvatarFrame>
          </button>
          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="dark-void-dropdown" role="menu">
              <router-link :to="`/u/${auth.user.username}`" class="dark-void-dropdown-item" role="menuitem" @click="closeDropdownAndSidebar">
                <i class="pi pi-user"></i> Profile
              </router-link>
              <router-link to="/settings" class="dark-void-dropdown-item" role="menuitem" @click="closeDropdownAndSidebar">
                <i class="pi pi-cog"></i> Settings
              </router-link>
              <router-link to="/archived" class="dark-void-dropdown-item" role="menuitem" @click="closeDropdownAndSidebar">
                <i class="pi pi-folder"></i> Archived
              </router-link>
              <router-link to="/bookmarks" class="dark-void-dropdown-item" role="menuitem" @click="closeDropdownAndSidebar">
                <i class="pi pi-bookmark"></i> Bookmarks
              </router-link>
              <router-link to="/collections" class="dark-void-dropdown-item" role="menuitem" @click="closeDropdownAndSidebar">
                <i class="pi pi-folder-open"></i> Collections
              </router-link>
              <router-link to="/customization" class="dark-void-dropdown-item" role="menuitem" @click="closeDropdownAndSidebar">
                <i class="pi pi-palette"></i> Customization
              </router-link>
              <div class="dark-void-dropdown-divider"></div>
              <button type="button" class="dark-void-dropdown-item dark-void-dropdown-item-danger" role="menuitem" @click="onLogout">
                <i class="pi pi-sign-out"></i> Log out
              </button>
            </div>
          </Transition>
        </div>
        <h2 class="dark-void-username">{{ auth.user.displayName || auth.user.username }}</h2>
        <p v-if="userBio" class="dark-void-bio">{{ userBio }}</p>
        <div class="dark-void-stats">
          <span class="dark-void-stat"><strong>POSTS</strong> {{ formatStat(profileStats.posts) }}</span>
          <span class="dark-void-stat"><strong>LIKES</strong> {{ formatStat(profileStats.likes) }}</span>
        </div>
      </div>
      <div class="dark-void-search-wrap">
        <form class="dark-void-search-form" @submit.prevent="onSidebarSearch">
          <input
            v-model="sidebarQuery"
            type="search"
            class="dark-void-search-input"
            placeholder="Search the void…"
            aria-label="Search"
          />
          <i class="pi pi-search dark-void-search-icon" aria-hidden="true"></i>
        </form>
      </div>
      <div class="dark-void-trending">
        <h3 class="dark-void-trending-title">CURRENTLY RADIATING</h3>
        <div class="dark-void-trending-tags">
          <router-link
            v-for="t in trendingTags"
            :key="t.tag"
            :to="{ path: '/search', query: { q: '#' + t.tag } }"
            class="dark-void-tag-chip"
            @click="sidebarOpen = false"
          >#{{ t.tag }}</router-link>
        </div>
      </div>
    </aside>

    <footer class="dark-void-status-bar" aria-live="polite">
      <span class="dark-void-status-left">{{ statusLeft }}</span>
      <span class="dark-void-status-online">ONLINE NOW: {{ onlineCount.toLocaleString() }} SOULS</span>
      <span class="dark-void-status-right">{{ statusRight }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, avatarSrc } from '@/api/client'
import { avatarShapeClass } from '@/utils/avatar'
import AvatarFrame from '@/components/AvatarFrame.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()
const sidebarQuery = ref('')
const onlineCount = ref(0)
const dropdownOpen = ref(false)
const sidebarOpen = ref(false)
const avatarWrapRef = ref<HTMLElement | null>(null)
const trendingTags = ref<{ tag: string; count: number }[]>([])

/** Configurable status bar text via env: VITE_DARK_VOID_STATUS_LEFT, VITE_DARK_VOID_STATUS_RIGHT */
const statusLeft = computed(() => import.meta.env.VITE_DARK_VOID_STATUS_LEFT ?? 'SERVER STATUS: HAUNTING – CURRENT MOOD: MELANCHOLY')
const statusRight = computed(() => import.meta.env.VITE_DARK_VOID_STATUS_RIGHT ?? 'JOIN THE SWARM')

const profileStats = computed(() => {
  const u = auth.user as { _count?: { posts?: number; likes?: number } } | undefined
  const c = u?._count
  return { posts: c?.posts ?? 0, likes: c?.likes ?? 0 }
})

const userBio = computed(() => (auth.user as { bio?: string } | null)?.bio ?? '')

function authUserBadgeUrl(): string | null {
  return (auth.user as { badgeUrl?: string } | null)?.badgeUrl ?? null
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toLocaleString()
}

function closeDropdownAndSidebar() {
  dropdownOpen.value = false
  sidebarOpen.value = false
}

function onLogout() {
  sidebarOpen.value = false
  logout()
}

function logout() {
  dropdownOpen.value = false
  theme.clearUserThemes()
  auth.logout()
  router.push('/')
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(target)) dropdownOpen.value = false
}

function onSidebarSearch() {
  const q = sidebarQuery.value?.trim()
  if (q) router.push({ path: '/search', query: { q } })
  else router.push('/search')
  sidebarOpen.value = false
}

async function fetchOnlineCount() {
  try {
    const { data } = await api.get<{ count: number }>('/presence/online-count')
    onlineCount.value = typeof data?.count === 'number' ? data.count : 0
  } catch {
    onlineCount.value = 0
  }
}

async function fetchTrendingTags() {
  try {
    const { data } = await api.get<{ tag: string; count: number }[]>('/search/trending-tags')
    trendingTags.value = Array.isArray(data) ? data : []
  } catch {
    trendingTags.value = []
  }
}

let onlineInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (auth.isLoggedIn) auth.fetchUser()
  fetchOnlineCount()
  fetchTrendingTags()
  document.addEventListener('click', onDocumentClick)
  onlineInterval = setInterval(fetchOnlineCount, 60000)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  if (onlineInterval) clearInterval(onlineInterval)
})
</script>

<style scoped>
.dark-void-layout {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    'nav main sidebar'
    'status status status';
  min-height: 100vh;
  padding-bottom: 2.5rem;
  overflow: hidden;
  height: 100vh;
}
.dark-void-nav {
  grid-area: nav;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 4.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 1.5rem;
  border-right: 1px solid var(--dark-void-border);
  background: var(--dark-void-bg);
  z-index: 20;
}
.dark-void-logo {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dark-void-text);
  text-decoration: none;
  color: var(--dark-void-text);
}
.dark-void-logo-w {
  font-weight: 700;
  font-size: 1.25rem;
}
.dark-void-nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.dark-void-sidebar-toggle {
  display: none;
  width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  color: var(--dark-void-text);
  cursor: pointer;
  transition: background 0.2s;
}
.dark-void-sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}
.dark-void-sidebar-toggle .pi { font-size: 1.25rem; }
.dark-void-nav-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dark-void-text);
  text-decoration: none;
  border-radius: 0;
  transition: background 0.2s;
}
.dark-void-nav-btn:hover,
.dark-void-nav-btn.router-link-active {
  background: rgba(255, 255, 255, 0.1);
}
.dark-void-nav-btn:focus-visible {
  outline: 2px solid var(--dark-void-text-muted);
  outline-offset: 2px;
}
.dark-void-main {
  grid-area: main;
  min-width: 0;
  margin-left: 4.5rem;
  margin-right: 280px;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem clamp(1rem, 4vw, 2rem);
  padding-top: 1rem;
  padding-bottom: 4.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
 /* space above fixed status bar so last items don’t sit under it */
}
.dark-void-main::-webkit-scrollbar {
  display: none;
}
.dark-void-tagline {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--dark-void-text-muted);
  margin: 0 0 1rem;
}
.dark-void-sidebar {
  grid-area: sidebar;
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 280px;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border-left: 1px solid var(--dark-void-border);
  background: var(--dark-void-bg);
  z-index: 20;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.dark-void-sidebar::-webkit-scrollbar {
  display: none;
}
.dark-void-profile-card {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.dark-void-avatar-wrap {
  position: relative;
}
.dark-void-profile-avatar-btn {
  width: 4rem;
  height: 4rem;
  padding: 0;
  border: 2px solid var(--dark-void-border);
  border-radius: 50%;
  overflow: hidden;
  background: none;
  cursor: pointer;
  display: block;
}
.dark-void-profile-avatar-btn:hover {
  border-color: var(--dark-void-text-muted);
}
.dark-void-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  min-width: 12rem;
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 0.25rem 0;
  z-index: 100;
}
.dark-void-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--dark-void-text);
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.dark-void-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
.dark-void-dropdown-item-danger:hover {
  color: #e88a8a;
}
.dark-void-dropdown-divider {
  height: 1px;
  background: var(--dark-void-border);
  margin: 0.25rem 0;
}
.dark-void-profile-avatar-btn .dark-void-avatar-img,
.dark-void-profile-avatar-btn .dark-void-avatar-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dark-void-profile-avatar-btn .dark-void-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--dark-void-text-muted);
  background: var(--dark-void-border);
}
.dark-void-avatar-img,
.dark-void-avatar-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dark-void-avatar-placeholder {
  background: var(--dark-void-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--dark-void-text-muted);
}
.dark-void-username {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
  color: var(--dark-void-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.dark-void-bio {
  font-size: 0.8rem;
  color: var(--dark-void-text-muted);
  margin: 0;
  text-align: center;
  line-height: 1.4;
}
.dark-void-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
}
.dark-void-stat {
  font-size: 0.75rem;
  color: var(--dark-void-text-muted);
}
.dark-void-stat strong {
  color: var(--dark-void-text);
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}
.dark-void-search-wrap {
  width: 100%;
}
.dark-void-search-form {
  position: relative;
}
.dark-void-search-input {
  width: 100%;
  padding: 0.6rem 2rem 0.6rem 0.75rem;
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: var(--radius-sm);
  color: var(--dark-void-text);
  -webkit-text-fill-color: var(--dark-void-text);
  font-size: 0.875rem;
}
.dark-void-search-input::placeholder {
  color: var(--dark-void-text-muted);
  opacity: 1;
}
.dark-void-search-input:-webkit-autofill,
.dark-void-search-input:-webkit-autofill:hover,
.dark-void-search-input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--dark-void-text);
  -webkit-box-shadow: 0 0 0 1000px var(--dark-void-card) inset;
  transition: background-color 5000s ease-in-out 0s;
}
.dark-void-search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dark-void-text-muted);
  pointer-events: none;
}
.dark-void-trending-title {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--dark-void-text-muted);
  margin: 0 0 0.5rem;
}
.dark-void-trending-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.dark-void-tag-chip {
  padding: 0.35rem 0.6rem;
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: var(--radius-sm);
  color: var(--dark-void-text);
  font-size: 0.8rem;
  text-decoration: none;
  transition: background 0.2s;
}
.dark-void-tag-chip:hover {
  background: rgba(255, 255, 255, 0.06);
}
.dark-void-status-bar {
  grid-area: status;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem 6rem 0.5rem 5rem;
  background: var(--dark-void-bg);
  border-top: 1px solid var(--dark-void-border);
  font-size: 0.7rem;
  color: var(--dark-void-text-muted);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  min-height: 2.5rem;
}
.dark-void-status-left {
  flex: 0 1 auto;
  min-width: 0;
}
.dark-void-status-right {
  flex: 0 1 auto;
  min-width: 0;
}
.dark-void-status-online {
  flex: 0 0 auto;
  font-weight: 600;
  color: var(--dark-void-text);
  white-space: nowrap;
}

.dark-void-sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 19;
  cursor: pointer;
}
.dark-void-fade-enter-active,
.dark-void-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dark-void-fade-enter-from,
.dark-void-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .dark-void-sidebar-toggle {
    display: flex;
  }
  .dark-void-sidebar {
    transform: translateX(100%);
    transition: transform 0.25s ease-out;
  }
  .dark-void-sidebar.dark-void-sidebar-open {
    transform: translateX(0);
  }
  .dark-void-layout {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'nav main'
      'status status';
  }
  .dark-void-main {
    margin-right: 0;
  }
}
@media (max-width: 768px) {
  .dark-void-nav {
    width: 3.5rem;
    padding: 0.75rem 0;
  }
  .dark-void-main {
    margin-left: 3.5rem;
    padding: 1rem;
    padding-bottom: 4.5rem;
  }
  .dark-void-tagline {
    font-size: 0.65rem;
  }
  .dark-void-status-bar {
    padding-left: 4rem;
    padding-right: 5rem;
  }
}
</style>
