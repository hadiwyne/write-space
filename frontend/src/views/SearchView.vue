<template>
  <div class="search-page">
    <h1>Search</h1>
    <div class="search-form">
      <input v-model="query" type="search" placeholder="Search posts and people…" class="search-input" @keyup.enter="search" />
      <button type="button" class="btn btn-primary" @click="search">Search</button>
    </div>
    <div v-if="loading" class="loading">Searching…</div>
    <template v-else-if="hasSearched">
      <div class="search-tabs">
        <button type="button" class="tab" :class="{ active: tab === 'posts' }" @click="tab = 'posts'">Posts</button>
        <button type="button" class="tab" :class="{ active: tab === 'users' }" @click="tab = 'users'">People</button>
      </div>
      <div v-if="tab === 'posts'" class="results">
        <div v-if="posts.length === 0" class="empty">No posts found.</div>
        <div v-else class="post-list">
          <PostCard v-for="p in posts" :key="postKey(p)" :post="p" />
        </div>
      </div>
      <div v-if="tab === 'users'" class="results">
        <div v-if="users.length === 0" class="empty">No people found.</div>
        <ul v-else class="user-list">
          <li v-for="u in users" :key="userKey(u)" class="user-item">
            <router-link :to="`/u/${userUsername(u)}`" class="user-link">
              <img v-if="userAvatarUrl(u)" :src="avatarSrc(userAvatarUrl(u))" alt="" class="user-avatar" />
              <span v-else class="user-avatar-placeholder">{{ (userDisplayName(u) || userUsername(u) || '?')[0] }}</span>
              <div class="user-info">
                <span class="user-name">{{ userDisplayName(u) || userUsername(u) }}</span>
                <span class="user-handle">@{{ userUsername(u) }}</span>
              </div>
            </router-link>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api, avatarSrc } from '@/api/client'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const rawQ = route.query.q
const query = ref(Array.isArray(rawQ) ? (rawQ[0] ?? '') : (typeof rawQ === 'string' ? rawQ : ''))
const loading = ref(false)
const hasSearched = ref(false)
const tab = ref<'posts' | 'users'>('posts')
const posts = ref<Record<string, unknown>[]>([])
const users = ref<Record<string, unknown>[]>([])

function postKey(p: Record<string, unknown>) {
  return String((p as { id?: string }).id ?? '')
}

function userKey(u: Record<string, unknown>) {
  return String((u as { id?: string }).id ?? '')
}

function userUsername(u: Record<string, unknown>) {
  return String((u as { username?: string }).username ?? '')
}

function userDisplayName(u: Record<string, unknown>) {
  return (u as { displayName?: string }).displayName
}

function userAvatarUrl(u: Record<string, unknown>) {
  return (u as { avatarUrl?: string | null }).avatarUrl
}

async function search() {
  const q = typeof query.value === 'string' ? query.value.trim() : ''
  if (!q) return
  loading.value = true
  hasSearched.value = true
  try {
    const [postsRes, usersRes] = await Promise.all([
      api.get(`/search/posts?q=${encodeURIComponent(q)}`),
      api.get(`/search/users?q=${encodeURIComponent(q)}`),
    ])
    posts.value = Array.isArray(postsRes.data) ? postsRes.data : []
    users.value = Array.isArray(usersRes.data) ? usersRes.data : []
  } finally {
    loading.value = false
  }
}

watch(() => route.query.q, (q) => {
  const val = Array.isArray(q) ? (q[0] ?? '') : (typeof q === 'string' ? q : '')
  query.value = val
  if (typeof val === 'string' && val.trim()) search()
})
onMounted(() => {
  const q = route.query.q
  const val = Array.isArray(q) ? (q[0] ?? '') : (typeof q === 'string' ? q : '')
  if (typeof val === 'string' && val.trim()) search()
})
</script>

<style scoped>
.search-page { padding: 0; }
.search-form { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.search-input { flex: 1; max-width: 24rem; padding: 0.75rem 1rem; border: 2px solid var(--border-light); border-radius: var(--radius-md); font-size: 1rem; font-family: inherit; background: var(--bg-card); transition: border-color 0.2s ease; }
.search-input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1); }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-primary { background: var(--primary); color: #fff; }
.search-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; background: var(--bg-primary); padding: 0.25rem; border-radius: var(--radius-md); border: 2px solid var(--border-light); }
.tab { padding: 0.625rem 1.25rem; border: none; background: transparent; border-radius: calc(var(--radius-md) - 2px); cursor: pointer; font-size: 0.9375rem; font-weight: 600; font-family: inherit; color: var(--text-secondary); transition: all 0.3s ease; }
.tab:hover:not(.active) { background: rgba(139, 69, 19, 0.08); color: var(--accent-primary); }
.tab.active { background: var(--accent-primary); color: white; box-shadow: 0 2px 8px rgba(139, 69, 19, 0.25); }
.loading, .empty { color: var(--gray-700); padding: 1rem 0; }
.post-list { display: flex; flex-direction: column; gap: 1rem; }
.user-list { list-style: none; margin: 0; padding: 0; }
.user-item { border-bottom: 1px solid var(--gray-100); }
.user-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; color: inherit; text-decoration: none; }
.user-link:hover { color: var(--primary); }
.user-avatar, .user-avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); flex-shrink: 0; display: block; line-height: 48px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 500; }
.user-handle { font-size: 0.875rem; color: var(--gray-600); }
</style>
