<template>
  <div class="feed">
    <header class="feed-hero">
      <h1>Your Feed</h1>
    </header>

    <section class="feed-filters">
      <div class="filter-tabs">
        <button
          type="button"
          class="filter-tab"
          :class="{ active: sort === 'latest' }"
          @click="sort = 'latest'; load()"
        >
          <i class="pi pi-clock"></i>
          Latest
        </button>
        <button
          type="button"
          class="filter-tab"
          :class="{ active: sort === 'popular' }"
          @click="sort = 'popular'; load()"
        >
          <i class="pi pi-bolt"></i>
          Popular
        </button>
        <button
          type="button"
          class="filter-tab"
          :class="{ active: sort === 'friends' }"
          @click="sort = 'friends'; load()"
        >
          <i class="pi pi-users"></i>
          Friends
        </button>
      </div>
      <div class="filter-tag">
        <input
          v-model="tagFilter"
          type="text"
          placeholder="Filter by tag"
          class="tag-input"
          @keyup.enter="load()"
        />
        <button type="button" class="tag-btn" @click="load()">Apply</button>
      </div>
      <div class="view-toggle">
        <button
          type="button"
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          aria-label="List view"
          @click="viewMode = 'list'"
        >
          <i class="pi pi-list"></i>
        </button>
        <button
          type="button"
          class="view-btn"
          :class="{ active: viewMode === 'grid' }"
          aria-label="Grid view"
          @click="viewMode = 'grid'"
        >
          <i class="pi pi-th-large"></i>
        </button>
      </div>
    </section>

    <div v-if="loading" class="feed-loading">Loading…</div>
    <div v-else-if="posts.length === 0" class="feed-empty">
      <template v-if="sort === 'friends' && !auth.token">
        <router-link to="/login">Log in</router-link> to see posts from people you follow.
      </template>
      <template v-else-if="sort === 'friends'">
        No posts from people you follow yet. Follow some <router-link to="/search">people</router-link> to fill this feed.
      </template>
      <template v-else>
        No posts yet. <router-link to="/write">Write</router-link> one.
      </template>
    </div>
    <div v-else class="post-list" :class="{ 'post-list--grid': viewMode === 'grid' }">
      <PostCard
        v-for="(p, i) in posts"
        :key="p.id"
        :post="p"
        :show-repost="!!auth.token"
        :reposted="repostedIds.has(p.id)"
        :style="{ animationDelay: `${0.1 * i}s` }"
        @repost="handleRepost"
        @like="handleLike"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import PostCard from '@/components/PostCard.vue'

type FeedPost = { id: string; _count?: { likes?: number; reposts?: number; comments?: number }; likes?: unknown[]; [key: string]: unknown }

const route = useRoute()
const auth = useAuthStore()
const posts = ref<FeedPost[]>([])
const loading = ref(true)
const sort = ref<'latest' | 'popular' | 'friends'>('latest')
const tagFilter = ref('')
const viewMode = ref<'list' | 'grid'>('list')
const repostedIds = ref<Set<string>>(new Set())

async function handleRepost(postId: string) {
  try {
    const { data } = await api.post(`/posts/${postId}/reposts`)
    const p = posts.value.find((x) => x.id === postId)
    if (p?._count) p._count = { ...p._count, reposts: (p._count.reposts ?? 0) + (data.reposted ? 1 : -1) }
    if (data.reposted) repostedIds.value = new Set([...repostedIds.value, postId])
    else repostedIds.value = new Set([...repostedIds.value].filter((id) => id !== postId))
  } catch {
    // ignore
  }
}

function handleLike(postId: string, isLiked: boolean) {
  const p = posts.value.find((x) => x.id === postId)
  if (p?._count) {
    p._count = { ...p._count, likes: (p._count.likes ?? 0) + (isLiked ? 1 : -1) }
  }
  // Update the likes array so the UI reflects the change immediately
  if (p) {
    if (isLiked) {
      p.likes = [{ id: 'local' }]
    } else {
      p.likes = []
    }
  }
}

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (sort.value === 'popular') params.set('sort', 'popular')
    if (sort.value === 'friends') params.set('sort', 'friends')
    if (tagFilter.value.trim()) params.set('tag', tagFilter.value.trim())
    const { data } = await api.get(`/feed?${params.toString()}`)
    posts.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

function onPageShow(e: PageTransitionEvent) {
  if (e.persisted) load()
}

watch(() => route.path, (path) => {
  if (path === '/feed') load()
})

onMounted(() => {
  load()
  window.addEventListener('pageshow', onPageShow)
})
onUnmounted(() => {
  window.removeEventListener('pageshow', onPageShow)
})
</script>

<style scoped>
.feed { padding: 0; }
.feed-hero { margin-bottom: 3rem; }
.feed-hero h1 {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  margin: 0;
  color: var(--text-primary);
}

.feed-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  background: var(--bg-card);
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.filter-tabs {
  display: flex;
  background: var(--bg-primary);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-light);
}
.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border-radius: calc(var(--radius-md) - 2px);
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.filter-tab:hover:not(.active) {
  background: rgba(139, 69, 19, 0.08);
  color: var(--accent-primary);
}
.filter-tab.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.25);
}
.filter-tab .pi { font-size: 1rem; }

.filter-tag { display: flex; gap: 0.5rem; }
.tag-input {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-family: inherit;
  width: 10rem;
  background: var(--bg-card);
}
.tag-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.tag-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  background: var(--accent-primary);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.tag-btn:hover {
  background: var(--accent-burgundy);
  border-color: var(--accent-burgundy);
}

.view-toggle {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}
.view-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.view-btn:hover:not(.active) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.view-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.feed-loading, .feed-empty {
  padding: 2rem 0;
  color: var(--text-secondary);
}
.feed-empty a { font-weight: 600; }

.post-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.post-list--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .feed-hero h1 { font-size: 2rem; }
  .feed-filters { flex-direction: column; align-items: stretch; padding: 0.75rem; }
  .filter-tabs { justify-content: center; }
  .view-toggle { margin-left: 0; justify-content: center; }
}
</style>
