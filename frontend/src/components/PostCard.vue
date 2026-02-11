<template>
  <article class="card" :style="{ animationDelay }">
    <header class="card-header">
      <router-link :to="'/u/' + (post.author && post.author.username)" class="card-author">
        <div class="author-avatar">
          <img v-if="post.author && post.author.avatarUrl" :src="avatarSrc(post.author.avatarUrl)" alt="" class="avatar-img" />
          <span v-else class="avatar-initial">{{ (post.author && (post.author.displayName || post.author.username)) ? (post.author.displayName || post.author.username)[0] : '?' }}</span>
        </div>
        <div class="author-info">
          <span class="author-name">{{ post.author && (post.author.displayName || post.author.username) }}</span>
          <div class="author-meta">
            <span class="meta-date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-read">{{ readTime }} min read</span>
          </div>
        </div>
      </router-link>
      <button type="button" class="card-menu" aria-label="Post menu" @click.stop>
        <span aria-hidden="true">⋯</span>
      </button>
    </header>

    <router-link :to="'/posts/' + post.id" class="card-body">
      <h2 class="card-title">{{ post.title }}</h2>
      <p v-if="excerpt" class="card-excerpt">{{ excerpt }}</p>
      <div v-if="postImageUrls.length" class="card-thumbnails">
        <img
          v-for="(url, i) in postImageUrls"
          :key="i"
          :src="avatarSrc(url)"
          alt=""
          class="card-thumb"
          loading="lazy"
        />
      </div>
      <div v-if="post.tags && post.tags.length" class="card-tags">
        <router-link
          v-for="t in post.tags"
          :key="t"
          :to="`/feed?tag=${t}`"
          class="tag"
          @click.stop
        >
          #{{ t }}
        </router-link>
      </div>
    </router-link>

    <footer class="card-footer">
      <button
        v-if="canLike"
        type="button"
        class="action-stat action-like-btn"
        :class="{ liked: liked }"
        v-tooltip.bottom="liked ? 'Unlike' : 'Like'"
        @click.stop="toggleLike"
      >
        <i :class="liked ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
        {{ likeCount }}
      </button>
      <span v-else class="action-stat">
        <i class="pi pi-heart"></i>
        {{ likeCount }}
      </span>
      <router-link
        :to="'/posts/' + post.id + '#comments'"
        class="action-stat action-comment-link"
        v-tooltip.bottom="'View and add comments'"
      >
        <i class="pi pi-comment"></i>
        {{ (post._count && post._count.comments) || 0 }}
      </router-link>
      <span class="action-stat" v-tooltip.bottom="'Reposts'">
        <i class="pi pi-refresh"></i>
        {{ (post._count && post._count.reposts) || 0 }}
      </span>
      <button
        v-if="showRepost && post.id"
        type="button"
        class="action-btn"
        :class="{ active: reposted }"
        v-tooltip.bottom="reposted ? 'Undo repost' : 'Repost'"
        @click.stop="onRepost"
      >
        <i class="pi pi-refresh"></i>
        Repost
      </button>
      <div v-if="showActions" class="card-actions">
        <template v-if="archivedMode">
          <button type="button" class="action-btn action-archive" v-tooltip.bottom="'Restore to profile'" @click.stop="onUnarchive">
            <i class="pi pi-refresh"></i>
          </button>
        </template>
        <template v-else>
          <button type="button" class="action-btn action-archive" v-tooltip.bottom="'Archive'" @click.stop="onArchive">
            <i class="pi pi-folder"></i>
          </button>
        </template>
        <button type="button" class="action-btn action-delete" v-tooltip.bottom="'Delete'" @click.stop="onDelete">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api, avatarSrc } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useLikedPostsStore } from '@/stores/likedPosts'

const auth = useAuthStore()
const likedStore = useLikedPostsStore()
const props = defineProps({
  post: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
  archivedMode: { type: Boolean, default: false },
  showRepost: { type: Boolean, default: false },
  reposted: { type: Boolean, default: false },
  showLike: { type: Boolean, default: true },
  animationDelay: { type: String, default: '0s' },
})
const canLike = computed(() => props.showLike && !!auth.token)

const likedFromApi = computed(() =>
  !!(props.post.likes && Array.isArray(props.post.likes) && props.post.likes.length > 0)
)
const liked = computed(() => likedFromApi.value || likedStore.has(props.post.id))
const likeCount = ref((props.post._count && props.post._count.likes) || 0)

watch(
  () => props.post,
  (post) => {
    likeCount.value = (post._count && post._count.likes) || 0
    // Sync API liked state to store
    if (post.likes && Array.isArray(post.likes) && post.likes.length > 0) {
      likedStore.setLiked(post.id, true)
    }
  },
  { deep: true, immediate: true }
)

const emit = defineEmits<{
  (e: 'archive', postId: string): void
  (e: 'delete', postId: string): void
  (e: 'unarchive', postId: string): void
  (e: 'repost', postId: string): void
  (e: 'like', postId: string, liked: boolean): void
}>()

async function toggleLike() {
  if (!auth.token || !props.post.id) return
  try {
    const { data } = await api.post(`/posts/${props.post.id}/likes`)
    likedStore.setLiked(props.post.id, data.liked)
    likeCount.value = data.count ?? likeCount.value
    emit('like', props.post.id, data.liked)
  } catch {
    // ignore
  }
}

function onArchive() {
  emit('archive', props.post.id)
}
function onDelete() {
  emit('delete', props.post.id)
}
function onUnarchive() {
  emit('unarchive', props.post.id)
}
function onRepost() {
  emit('repost', props.post.id)
}
/** Extract image URLs from post (rendered HTML or markdown) for thumbnail preview. Max 4. */
const postImageUrls = computed(() => {
  const html = props.post.renderedHTML || ''
  const content = props.post.content || ''
  const urls: string[] = []
  if (html) {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
    let m: RegExpExecArray | null
    while ((m = imgRegex.exec(html)) !== null && urls.length < 4) urls.push(m[1])
  }
  if (urls.length < 4 && content) {
    const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g
    let m: RegExpExecArray | null
    while ((m = mdRegex.exec(content)) !== null && urls.length < 4) {
      if (!urls.includes(m[1])) urls.push(m[1])
    }
  }
  return urls.slice(0, 4)
})

/** Excerpt from rendered HTML first (so markdown shows as plain text, not raw syntax). Strip image URLs so we never show them. */
const excerpt = computed(() => {
  const raw = props.post.renderedHTML || props.post.content || ''
  let text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  postImageUrls.value.forEach((url) => {
    text = text.split(url).join(' ')
  })
  text = text.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.slice(0, 160) + (text.length > 160 ? '…' : '')
})
const readTime = computed(() => {
  const raw = (props.post.content || props.post.renderedHTML || '')
  const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
})
function formatDate(s: string | undefined) {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.card {
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 0;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--border-light);
  transition: all 0.2s ease;
  animation: fadeInUp 0.6s ease-out both;
}
.card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: var(--accent-primary);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.card:hover {
  border-color: var(--accent-secondary);
}
.card:hover::after {
  opacity: 1;
}

.card-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-light);
  text-decoration: none;
  color: inherit;
}
.card-author:hover { text-decoration: none; color: inherit; }
.author-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.25);
  border: 3px solid var(--bg-card);
  outline: 2px solid var(--border-medium);
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-initial { line-height: 1; }
.author-info { min-width: 0; }
.author-name {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}
.author-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
.meta-dot { user-select: none; }

.card-menu {
  position: absolute;
  top: 2rem;
  right: 2rem;
  padding: 0.5rem;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  transition: all 0.2s ease;
}
.card-menu:hover {
  background: var(--bg-primary);
  color: var(--accent-primary);
}

.card-body {
  display: block;
  color: inherit;
  text-decoration: none;
}
.card-body:hover { text-decoration: none; color: inherit; }
.card-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--text-primary);
  transition: color 0.2s ease;
}
.card:hover .card-title { color: var(--accent-primary); }
.card-excerpt {
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.card-thumbnails {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.card-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-primary);
}
.card-tags {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.tag {
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  color: var(--accent-primary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid var(--border-light);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tag:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
  text-decoration: none;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-light);
  flex-wrap: wrap;
  align-items: center;
}
.action-stat,
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}
.action-stat { cursor: default; }
.action-stat .pi { font-size: 1.125rem; }
.action-stat:hover { color: var(--text-secondary); text-decoration: none; }
.action-like-btn {
  cursor: pointer;
  border: none;
  background: var(--bg-primary);
  font-family: inherit;
}
.action-like-btn:hover { color: var(--like-color); text-decoration: none; }
.action-like-btn.liked { color: var(--like-color); }
.action-like-btn.liked .pi { color: var(--like-color); }
.action-comment-link { cursor: pointer; }
.action-comment-link:hover { color: var(--accent-primary); text-decoration: none; }
.action-btn:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.action-btn.active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
.card-actions { margin-left: auto; display: flex; gap: 0.5rem; }
.action-archive:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
.action-delete:hover { color: var(--like-color); border-color: var(--like-color); }

@media (max-width: 768px) {
  .card { padding: 1.5rem; }
  .card-title { font-size: 1.5rem; }
  .card-footer .action-stat, .card-footer .action-btn { min-width: calc(50% - 0.25rem); }
}
</style>
