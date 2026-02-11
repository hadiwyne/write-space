<template>
  <div class="bookmarks-page">
    <h1>Bookmarks</h1>
    <p v-if="!auth.isLoggedIn" class="hint">Log in to save and view bookmarks.</p>
    <div v-else-if="loading" class="loading">Loading…</div>
    <div v-else-if="posts.length === 0" class="empty">No bookmarks yet.</div>
    <div v-else class="post-list">
      <PostCard v-for="p in posts" :key="postKey(p)" :post="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import PostCard from '@/components/PostCard.vue'

const auth = useAuthStore()
const posts = ref<Record<string, unknown>[]>([])
function postKey(p: Record<string, unknown>) {
  return String((p as { id?: string }).id ?? '')
}
const loading = ref(true)

onMounted(async () => {
  if (!auth.token) {
    loading.value = false
    return
  }
  try {
    const { data } = await api.get('/bookmarks')
    posts.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.bookmarks-page { padding: 0; }
.bookmarks-page h1 { font-size: 1.5rem; margin: 0 0 1rem; }
.hint, .loading, .empty { margin: 0 0 1rem; color: var(--gray-700); }
.post-list { display: flex; flex-direction: column; gap: 1rem; }
</style>
