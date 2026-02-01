<template>
  <div class="feed">
    <h1>Feed</h1>
    <div class="feed-toolbar">
      <div class="feed-tabs">
        <button type="button" class="tab" :class="{ active: sort === 'latest' }" @click="sort = 'latest'; load()">Latest</button>
        <button type="button" class="tab" :class="{ active: sort === 'popular' }" @click="sort = 'popular'; load()">Popular</button>
      </div>
      <div class="feed-tag-filter">
        <input v-model="tagFilter" type="text" placeholder="Filter by tag" class="tag-input" @keyup.enter="load()" />
        <button type="button" class="btn btn-sm" @click="load()">Apply</button>
      </div>
    </div>
    <div v-if="loading">Loading…</div>
    <div v-else-if="posts.length === 0">No posts yet. <router-link to="/write">Write</router-link> one.</div>
    <div v-else class="post-list">
      <PostCard
        v-for="p in posts"
        :key="p.id"
        :post="p"
        :show-repost="!!auth.token"
        :reposted="repostedIds.has((p as { id: string }).id)"
        @repost="handleRepost"
      />
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
const loading = ref(true)
const sort = ref<'latest' | 'popular'>('latest')
const tagFilter = ref('')
const repostedIds = ref<Set<string>>(new Set())

async function handleRepost(postId: string) {
  try {
    const { data } = await api.post(`/posts/${postId}/reposts`)
    const p = posts.value.find((x) => (x as { id: string }).id === postId) as { _count?: { reposts?: number } }
    if (p?._count) p._count = { ...p._count, reposts: (p._count.reposts ?? 0) + (data.reposted ? 1 : -1) }
    if (data.reposted) repostedIds.value = new Set([...repostedIds.value, postId])
    else repostedIds.value = new Set([...repostedIds.value].filter((id) => id !== postId))
  } catch {
    // ignore
  }
}

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (sort.value === 'popular') params.set('sort', 'popular')
    if (tagFilter.value.trim()) params.set('tag', tagFilter.value.trim())
    const { data } = await api.get(`/feed?${params.toString()}`)
    posts.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.feed { padding: 0; }
.feed-toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.feed-tabs { display: flex; gap: 0.25rem; }
.tab { padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); background: #fff; border-radius: var(--radius); cursor: pointer; font-size: 0.9375rem; }
.tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.feed-tag-filter { display: flex; gap: 0.5rem; }
.tag-input { padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 0.9375rem; width: 12rem; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: var(--radius); border: 1px solid var(--primary); background: var(--primary); color: #fff; cursor: pointer; }
.post-list { display: flex; flex-direction: column; gap: 1rem; }
</style>
