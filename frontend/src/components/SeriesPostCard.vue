<template>
  <article class="spc" :style="accentStyle">
    <!-- Repost banner -->
    <div v-if="post.repostData" class="spc-repost-header">
      <i class="pi pi-refresh"></i>
      <router-link :to="'/u/' + post.repostData.user?.username" class="spc-reposter-link" @click.stop>
        {{ post.repostData.user?.displayName || post.repostData.user?.username }} reposted
      </router-link>
    </div>

    <!-- Thumbnail / Cover Image -->
    <router-link :to="'/posts/' + post.id" class="spc-image-link" tabindex="-1" aria-hidden="true">
      <div class="spc-image-wrap" :class="{ 'spc-image-wrap--placeholder': !thumbnail }">
        <img
          v-if="thumbnail"
          :src="avatarSrc(thumbnail)"
          alt=""
          class="spc-image"
          loading="lazy"
          :style="thumbnailStyle"
        />
        <div v-else class="spc-image-placeholder">
          <i class="pi pi-book"></i>
        </div>
      </div>
    </router-link>

    <!-- Series Attribution Bar -->
    <router-link :to="'/series/' + post.series.slug" class="spc-series-bar" @click.stop>
      <div class="spc-series-logo-wrap">
        <img
          v-if="post.series.logoMimeType"
          :src="seriesLogoUrl"
          alt=""
          class="spc-series-logo"
        />
        <div v-else class="spc-series-logo-fallback" :style="accentBgStyle">
          {{ post.series.name[0] }}
        </div>
      </div>
      <span class="spc-series-name">{{ post.series.name }}</span>
    </router-link>

    <!-- Post Content -->
    <div class="spc-body">
      <router-link :to="'/posts/' + post.id" class="spc-title-link">
        <h3 class="spc-title">{{ post.title }}</h3>
      </router-link>
      <p v-if="excerpt" class="spc-excerpt">{{ excerpt }}</p>

      <!-- Author & Date -->
      <div class="spc-meta">
        <router-link
          v-if="!post.isAnonymous && post.author?.username"
          :to="'/u/' + post.author.username"
          class="spc-author"
          @click.stop
        >
          <div class="spc-author-avatar">
            <img
              v-if="post.author?.avatarUrl"
              :src="avatarSrc(post.author.avatarUrl)"
              alt=""
              class="spc-author-img"
            />
            <span v-else class="spc-author-initial">
              {{ (post.author?.displayName || post.author?.username || '?')[0] }}
            </span>
          </div>
          <span class="spc-author-name">{{ post.author?.displayName || post.author?.username }}</span>
        </router-link>
        <span v-else class="spc-author">
          <div class="spc-author-avatar">
            <span class="spc-author-initial">{{ (post.anonymousAlias || '?')[0] }}</span>
          </div>
          <span class="spc-author-name">{{ post.anonymousAlias || 'Anonymous' }}</span>
        </span>
        <span class="spc-meta-dot">·</span>
        <span class="spc-date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
      </div>

      <!-- Contributor edit attribution -->
      <div v-if="post.lastEditedBy" class="spc-edited-by">
        <i class="pi pi-pencil"></i>
        Edited by
        <router-link :to="'/u/' + post.lastEditedBy.username" class="spc-edited-by-link" @click.stop>
          {{ post.lastEditedBy.displayName || post.lastEditedBy.username }}
        </router-link>
      </div>
    </div>

    <!-- Footer Actions -->
    <footer class="spc-footer">
      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="spc-action spc-like"
        :class="{ liked }"
        @click.stop="toggleLike"
      >
        <i :class="liked ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
        {{ likeCount }}
      </button>
      <span v-else class="spc-action">
        <i class="pi pi-heart"></i>
        {{ likeCount }}
      </span>

      <router-link :to="'/posts/' + post.id + '#comments'" class="spc-action" @click.stop>
        <i class="pi pi-comment"></i>
        {{ post._count?.comments || 0 }}
      </router-link>

      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="spc-action spc-repost"
        :class="{ reposted: isReposted }"
        :title="isReposted ? 'Undo repost' : 'Repost'"
        @click.stop="toggleRepost"
      >
        <i class="pi pi-refresh"></i>
        {{ repostCount }}
      </button>
      <span v-else class="spc-action">
        <i class="pi pi-refresh"></i>
        {{ repostCount }}
      </span>

      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="spc-action spc-bookmark"
        :class="{ bookmarked: isBookmarked }"
        @click.stop="toggleBookmark"
      >
        <i :class="isBookmarked ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api, avatarSrc, apiBaseUrl } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useLikedPostsStore } from '@/stores/likedPosts'

const props = defineProps<{
  post: any
}>()

const auth = useAuthStore()
const likedStore = useLikedPostsStore()

// ─── Series logo ─────────────────────────────────────────────────────────────

const seriesLogoUrl = computed(() => {
  const base = apiBaseUrl.replace(/\/$/, '')
  return `${base}/series/${encodeURIComponent(props.post.series.slug)}/images/logo`
})

const accentStyle = computed(() => {
  const color = props.post.series?.accentColor
  if (!color) return {}
  return { '--spc-accent': color }
})

const accentBgStyle = computed(() => {
  const color = props.post.series?.accentColor
  return color ? { background: color, color: '#fff' } : {}
})

// ─── Thumbnail ───────────────────────────────────────────────────────────────

const thumbnail = computed<string | null>(() => {
  if (props.post.imageUrls?.length) return props.post.imageUrls[0]
  if (props.post.linkPreview?.image) return props.post.linkPreview.image
  return null
})

const thumbnailStyle = computed(() => {
  const pos = props.post.cardStyle?.thumbnailPosition ?? 50
  return { objectPosition: `center ${pos}%` }
})

// ─── Excerpt ─────────────────────────────────────────────────────────────────

const MAX_EXCERPT = 120

const excerpt = computed(() => {
  const html = props.post.renderedHTML || ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > MAX_EXCERPT ? text.slice(0, MAX_EXCERPT) + '…' : text
})

// ─── Date ────────────────────────────────────────────────────────────────────

function formatDate(d?: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

// ─── Likes ───────────────────────────────────────────────────────────────────

const likeCount = ref<number>(props.post._count?.likes ?? 0)
const liked = ref<boolean>(
  likedStore.has(props.post.id) || !!props.post.isLiked
)

async function toggleLike() {
  if (!auth.isLoggedIn) return
  const wasLiked = liked.value
  liked.value = !wasLiked
  likeCount.value += wasLiked ? -1 : 1
  likedStore.setLiked(props.post.id, !wasLiked)
  try {
    const { data } = await api.post(`/posts/${props.post.id}/likes`, {}, { cache: false })
    liked.value = !!data.liked
    likeCount.value = data.count ?? likeCount.value
    likedStore.setLiked(props.post.id, !!data.liked)
  } catch {
    liked.value = wasLiked
    likeCount.value += wasLiked ? 1 : -1
    likedStore.setLiked(props.post.id, wasLiked)
  }
}

// ─── Repost ───────────────────────────────────────────────────────────────────

const repostCount = ref<number>(props.post._count?.reposts ?? 0)
const isReposted = ref<boolean>(!!props.post.isReposted)

async function toggleRepost() {
  if (!auth.isLoggedIn) return
  const was = isReposted.value
  isReposted.value = !was
  repostCount.value += was ? -1 : 1
  try {
    const { data } = await api.post(`/posts/${props.post.id}/reposts`, {}, { cache: false })
    isReposted.value = !!data.reposted
    repostCount.value = props.post._count?.reposts ?? repostCount.value
  } catch {
    isReposted.value = was
    repostCount.value += was ? 1 : -1
  }
}

// ─── Bookmark ─────────────────────────────────────────────────────────────────

const isBookmarked = ref<boolean>(!!props.post.isBookmarked)

async function toggleBookmark() {
  if (!auth.isLoggedIn) return
  const was = isBookmarked.value
  isBookmarked.value = !was
  try {
    if (was) {
      await api.delete(`/bookmarks/${props.post.id}`, { cache: false })
    } else {
      await api.post(`/bookmarks/${props.post.id}`, {}, { cache: false })
    }
  } catch {
    isBookmarked.value = was
  }
}
</script>

<style scoped>
.spc {
  --spc-accent: var(--accent-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.spc:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

/* ─── Repost header ─── */
.spc-repost-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #17bf63;
  border-bottom: 1px solid var(--border-light);
  background: color-mix(in srgb, #17bf63 6%, var(--bg-card));
}

.spc-reposter-link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.spc-reposter-link:hover {
  text-decoration: underline;
}

/* ─── Image ─── */
.spc-image-link {
  display: block;
  text-decoration: none;
}

.spc-image-wrap {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--bg-secondary);
  position: relative;
}

.spc-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.spc:hover .spc-image {
  transform: scale(1.03);
}

.spc-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, color-mix(in srgb, var(--spc-accent) 12%, var(--bg-secondary)) 100%);
  color: var(--text-tertiary);
}

.spc-image-placeholder .pi {
  font-size: 2.5rem;
  opacity: 0.4;
}

/* ─── Series bar ─── */
.spc-series-bar {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--border-light);
  text-decoration: none;
  background: color-mix(in srgb, var(--spc-accent) 6%, var(--bg-card));
  transition: background 0.15s;
}

.spc-series-bar:hover {
  background: color-mix(in srgb, var(--spc-accent) 12%, var(--bg-card));
}

.spc-series-logo-wrap {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.spc-series-logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: contain;
}

.spc-series-logo-fallback {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--spc-accent);
  color: #fff;
  text-transform: uppercase;
}

.spc-series-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--spc-accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Body ─── */
.spc-body {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spc-title-link {
  text-decoration: none;
}

.spc-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s;
}

.spc-title-link:hover .spc-title {
  color: var(--spc-accent);
}

.spc-excerpt {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Meta ─── */
.spc-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.spc-author {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-decoration: none;
  color: var(--text-secondary);
  min-width: 0;
}

.spc-author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spc-author-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spc-author-initial {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-tertiary);
}

.spc-author-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

a.spc-author:hover .spc-author-name {
  color: var(--text-primary);
}

.spc-meta-dot {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.spc-date {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.spc-edited-by {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}
.spc-edited-by .pi {
  font-size: 0.7rem;
}
.spc-edited-by-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
}
.spc-edited-by-link:hover {
  text-decoration: underline;
}

/* ─── Footer ─── */
.spc-footer {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 1rem;
  border-top: 1px solid var(--border-light);
}

.spc-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm, 6px);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  transition: color 0.15s, background 0.15s;
}

.spc-action:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.spc-like.liked,
.spc-like.liked .pi {
  color: #e0245e;
}

.spc-repost.reposted,
.spc-repost.reposted .pi {
  color: #17bf63;
}

.spc-bookmark.bookmarked,
.spc-bookmark.bookmarked .pi {
  color: var(--spc-accent);
}

.spc-action .pi {
  font-size: 1rem;
}

.spc-bookmark {
  margin-left: auto;
}
</style>
