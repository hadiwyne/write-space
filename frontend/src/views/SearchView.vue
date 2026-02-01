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
          <PostCard v-for="p in posts" :key="p.id" :post="p" />
        </div>
      </div>
      <div v-if="tab === 'users'" class="results">
        <div v-if="users.length === 0" class="empty">No people found.</div>
        <ul v-else class="user-list">
          <li v-for="u in users" :key="u.id" class="user-item">
            <router-link :to="`/u/${u.username}`" class="user-link">
              <img v-if="u.avatarUrl" :src="avatarSrc(u.avatarUrl)" alt="" class="user-avatar" />
              <span v-else class="user-avatar-placeholder">{{ (u.displayName || u.username || '?')[0] }}</span>
              <div class="user-info">
                <span class="user-name">{{ u.displayName || u.username }}</span>
                <span class="user-handle">@{{ u.username }}</span>
              </div>
            </router-link>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api, apiBaseUrl } from '@/api/client'
import PostCard from '@/components/PostCard.vue'

function avatarSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBaseUrl + url
}

const query = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const tab = ref<'posts' | 'users'>('posts')
const posts = ref<Record<string, unknown>[]>([])
const users = ref<Record<string, unknown>[]>([])

async function search() {
  const q = query.value.trim()
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
</script>

<style scoped>
.search-page { padding: 0; }
.search-form { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.search-input { flex: 1; max-width: 24rem; padding: 0.5rem 1rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 1rem; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-primary { background: var(--primary); color: #fff; }
.search-tabs { display: flex; gap: 0.25rem; margin-bottom: 1rem; }
.tab { padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); background: #fff; border-radius: var(--radius); cursor: pointer; font-size: 0.9375rem; }
.tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.loading, .empty { color: var(--gray-700); padding: 1rem 0; }
.post-list { display: flex; flex-direction: column; gap: 1rem; }
.user-list { list-style: none; margin: 0; padding: 0; }
.user-item { border-bottom: 1px solid var(--gray-100); }
.user-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; color: inherit; text-decoration: none; }
.user-link:hover { color: var(--primary); }
.user-avatar, .user-avatar-placeholder { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: var(--gray-200); flex-shrink: 0; display: block; line-height: 48px; text-align: center; font-size: 1.25rem; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 500; }
.user-handle { font-size: 0.875rem; color: var(--gray-600); }
</style>
