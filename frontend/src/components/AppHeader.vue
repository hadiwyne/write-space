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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiBaseUrl } from '@/api/client'

const auth = useAuthStore()
const router = useRouter()
const dropdownOpen = ref(false)
const avatarWrapRef = ref<HTMLElement | null>(null)

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
  auth.logout()
  router.push('/')
}

function onDocumentClick(e: MouseEvent) {
  if (avatarWrapRef.value && !avatarWrapRef.value.contains(e.target as Node))
    dropdownOpen.value = false
}

onMounted(() => {
  if (auth.token) auth.fetchUser()
  document.addEventListener('click', onDocumentClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
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
</style>
