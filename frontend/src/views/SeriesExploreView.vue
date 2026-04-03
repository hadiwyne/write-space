<template>
  <div class="explore">
    <div class="explore-header">
      <h1 class="explore-title">Series</h1>
      <p class="explore-subtitle">Curated publications from writers on this platform</p>
      <div class="explore-controls">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search series…"
            class="search-input"
            @input="onSearch"
          />
        </div>
        <router-link v-if="auth.isLoggedIn" to="/series/new" class="btn-create">
          <i class="pi pi-plus"></i> New Series
        </router-link>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading && !series.length" class="grid">
      <div v-for="i in 8" :key="i" class="series-card-skeleton" aria-hidden="true">
        <div class="skeleton-cover"></div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-sub"></div>
          <div class="skeleton-line skeleton-sub short"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && !series.length" class="empty">
      <i class="pi pi-book empty-icon"></i>
      <p class="empty-text">{{ searchQuery ? 'No series match your search.' : 'No series yet. Be the first!' }}</p>
      <router-link v-if="auth.isLoggedIn && !searchQuery" to="/series/new" class="btn-create">
        Create a Series
      </router-link>
    </div>

    <!-- Series Grid -->
    <div v-else class="grid">
      <router-link
        v-for="s in series"
        :key="s.id"
        :to="'/series/' + s.slug"
        class="series-card"
        :style="accentStyle(s)"
      >
        <!-- Cover Image -->
        <div class="series-cover">
          <img
            v-if="s.coverMimeType"
            :src="imageUrl(s.slug, 'cover')"
            alt=""
            class="series-cover-img"
            loading="lazy"
          />
          <div v-else class="series-cover-placeholder" :style="placeholderStyle(s)">
            <img
              v-if="s.logoMimeType"
              :src="imageUrl(s.slug, 'logo')"
              alt=""
              class="series-cover-logo"
            />
            <span v-else class="series-cover-initial">{{ s.name[0] }}</span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="series-card-body">
          <div class="series-card-header">
            <div class="series-logo-wrap">
              <img
                v-if="s.logoMimeType"
                :src="imageUrl(s.slug, 'logo')"
                alt=""
                class="series-logo"
              />
              <div v-else class="series-logo-fallback" :style="accentBgStyle(s)">
                {{ s.name[0] }}
              </div>
            </div>
            <div class="series-card-meta-wrap">
              <h2 class="series-card-name">{{ s.name }}</h2>
              <div class="series-card-owner" v-if="s.owner">
                by {{ s.owner.displayName || s.owner.username }}
              </div>
            </div>
          </div>
          <p v-if="s.tagline" class="series-card-tagline">{{ s.tagline }}</p>
          <div class="series-card-stats">
            <span><i class="pi pi-book"></i> {{ s.postCount }} post{{ s.postCount !== 1 ? 's' : '' }}</span>
            <span><i class="pi pi-users"></i> {{ s.followerCount }} follower{{ s.followerCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Load more -->
    <div v-if="hasMore && !loading" class="load-more-wrap">
      <button type="button" class="btn-load-more" @click="loadMore">Load more</button>
    </div>
    <div v-if="loading && series.length" class="loading-more">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, apiBaseUrl } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { SeriesInfo } from '@/stores/series'

const auth = useAuthStore()

const series = ref<(SeriesInfo & { owner?: any })[]>([])
const loading = ref(false)
const searchQuery = ref('')
const offset = ref(0)
const LIMIT = 20
const total = ref(0)
const hasMore = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

function imageUrl(slug: string, type: 'logo' | 'cover') {
  const base = apiBaseUrl.replace(/\/$/, '')
  return `${base}/series/${encodeURIComponent(slug)}/images/${type}`
}

function accentStyle(s: SeriesInfo) {
  return s.accentColor ? { '--series-accent': s.accentColor } : {}
}

function accentBgStyle(s: SeriesInfo) {
  return s.accentColor ? { background: s.accentColor, color: '#fff' } : {}
}

function placeholderStyle(s: SeriesInfo) {
  return s.accentColor
    ? { background: `linear-gradient(135deg, ${s.accentColor}33, ${s.accentColor}88)` }
    : {}
}

async function loadSeries(reset = false) {
  loading.value = true
  try {
    const params: Record<string, string> = {
      limit: String(LIMIT),
      offset: String(reset ? 0 : offset.value),
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const { data } = await api.get<{ series: any[]; total: number }>('/series', {
      params,
      cache: false,
    })

    if (reset) {
      series.value = data.series
      offset.value = data.series.length
    } else {
      series.value.push(...data.series)
      offset.value += data.series.length
    }
    total.value = data.total
    hasMore.value = offset.value < data.total
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    offset.value = 0
    loadSeries(true)
  }, 300)
}

function loadMore() {
  loadSeries(false)
}

onMounted(() => loadSeries(true))
</script>

<style scoped>
.explore {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.explore-header {
  margin-bottom: 2rem;
}

.explore-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.explore-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
}

.explore-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 0.875rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.375rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--accent-primary);
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--accent-primary);
  color: #fff;
  border-radius: var(--radius-md, 8px);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-create:hover { opacity: 0.9; }

/* ─── Grid ─── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* ─── Series Card ─── */
.series-card {
  --series-accent: var(--accent-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.series-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.series-cover {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.series-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.series-card:hover .series-cover-img {
  transform: scale(1.04);
}

.series-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--series-accent) 18%, var(--bg-secondary));
}

.series-cover-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 8px;
}

.series-cover-initial {
  font-size: 3rem;
  font-weight: 800;
  color: var(--series-accent);
  opacity: 0.6;
  text-transform: uppercase;
}

.series-card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.series-card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.series-logo-wrap {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.series-logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: contain;
}

.series-logo-fallback {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  background: var(--series-accent);
  color: #fff;
}

.series-card-meta-wrap {
  min-width: 0;
}

.series-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.series-card-owner {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
}

.series-card-tagline {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-card-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-top: auto;
  padding-top: 0.5rem;
}

.series-card-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ─── Skeletons ─── */
.series-card-skeleton {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
}

.skeleton-cover {
  width: 100%;
  height: 160px;
  background: var(--bg-secondary);
  animation: shimmer 1.5s infinite;
}

.skeleton-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: var(--bg-secondary);
  animation: shimmer 1.5s infinite;
}

.skeleton-title { width: 70%; height: 16px; }
.skeleton-sub { width: 90%; }
.skeleton-sub.short { width: 50%; }

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ─── Empty ─── */
.empty {
  text-align: center;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-tertiary);
}

.empty-text {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

/* ─── Load More ─── */
.load-more-wrap {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  padding: 0.75rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.btn-load-more:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.loading-more {
  text-align: center;
  margin-top: 2rem;
  color: var(--text-tertiary);
  font-size: 1.5rem;
}

@media (max-width: 640px) {
  .explore { padding: 1rem; }
  .explore-title { font-size: 1.5rem; }
  .search-wrap { max-width: 100%; }
  .grid { grid-template-columns: 1fr; }
}
</style>
