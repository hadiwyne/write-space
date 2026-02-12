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
      <div class="filter-tag-and-view">
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
        :show-actions="canShowActions(p)"
        :show-repost="!!auth.token"
        :reposted="repostedIds.has(p.id)"
        :style="{ animationDelay: `${0.1 * i}s` }"
        @repost="handleRepost"
        @like="handleLike"
        @archive="handleArchive"
        @delete="handleDelete"
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

function canShowActions(p: FeedPost): boolean {
  const u = auth.user
  if (!u?.id) return false
  const authorId = (p as { author?: { id?: string } }).author?.id
  return authorId === u.id || !!u.isSuperadmin
}

async function handleArchive(postId: string) {
  try {
    await api.patch(`/posts/${postId}/archive`)
    posts.value = posts.value.filter((x) => x.id !== postId)
  } catch {
    // ignore
  }
}

async function handleDelete(postId: string) {
  try {
    await api.delete(`/posts/${postId}`)
    posts.value = posts.value.filter((x) => x.id !== postId)
  } catch {
    // ignore
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
.feed-hero { margin-bottom: clamp(1.5rem, 5vw, 3rem); }
.feed-hero h1 {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  margin: 0;
  color: var(--text-primary);
}

.feed-filters {
  display: flex;
  gap: clamp(0.5rem, 2vw, 1rem);
  align-items: center;
  flex-wrap: nowrap;
  background: var(--bg-card);
  padding: clamp(0.75rem, 2vw, 1rem);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  margin-bottom: clamp(1rem, 4vw, 2rem);
}

.filter-tag-and-view {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 2vw, 1rem);
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
}
.filter-tag-and-view .filter-tag {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}
.filter-tag-and-view .view-toggle {
  flex-shrink: 0;
  margin-left: 0;
}

.filter-tabs {
  display: flex;
  flex-shrink: 0;
  background: var(--bg-primary);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-light);
}
.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem clamp(0.75rem, 2vw, 1.5rem);
  border-radius: calc(var(--radius-md) - 2px);
  border: none;
  background: transparent;
  font-size: clamp(0.8125rem, 2vw, 0.9375rem);
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

.filter-tag { display: flex; gap: 0.5rem; flex: 1 1 auto; min-width: 0; }
.tag-input {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-family: inherit;
  min-width: 0;
  flex: 1 1 6rem;
  width: 100%;
  max-width: 14rem;
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
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.view-btn {
  width: 40px;
  height: 40px;
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
  gap: clamp(1rem, 3vw, 1.5rem);
}
.post-list--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: clamp(1rem, 3vw, 1.5rem);
}

@media (max-width: 768px) {
  .feed-filters { flex-wrap: wrap; flex-direction: column; align-items: stretch; }
  .filter-tag-and-view { flex-direction: column; align-items: stretch; flex-wrap: wrap; }
  .filter-tag-and-view .filter-tag { flex: none; max-width: none; }
  .filter-tabs { justify-content: center; }
  .view-toggle { justify-content: center; }
  .tag-input { max-width: none; }
}
@media (max-width: 480px) {
  .filter-tabs { flex-wrap: wrap; justify-content: center; }
  .filter-tab { flex: 1 1 calc(33.333% - 0.5rem); min-width: 0; justify-content: center; }
  .post-list--grid { grid-template-columns: 1fr; }
}
</style>
