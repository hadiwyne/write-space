<template>
  <article
    class="card"
    :class="[cardShapeClass, cardAnimationClass, cardButtonSizeClass, { 'card--bg-opacity': cardHasBgOpacity }]"
    :style="cardWrapperStyle"
  >
    <div v-if="cardStyle?.overlayGifUrl" class="card-overlay-gif" aria-hidden="true">
      <img :src="cardStyle.overlayGifUrl" alt="" class="card-overlay-gif-img" />
    </div>
    <div
      v-if="cardBadgeDisplay"
      class="card-badge"
      :class="['card-badge--' + (cardStyle?.badgePosition || 'top-right'), cardBadgeMovementClass]"
      aria-hidden="true"
    >
      <img v-if="cardBadgeDisplay === 'custom' && cardStyle?.badgeImageUrl" :src="cardStyle.badgeImageUrl" alt="" class="card-badge-img" />
      <span v-else class="card-badge-emoji">{{ cardBadgeEmoji }}</span>
    </div>
    <div v-if="post.repostData" class="card-repost-header">
      <i class="pi pi-refresh"></i>
      <router-link :to="'/u/' + post.repostData.user?.username" class="reposter-link" @click.stop>
        {{ post.repostData.user?.displayName || post.repostData.user?.username }} reposted
      </router-link>
    </div>
    <header class="card-header">
      <router-link
        v-if="!post.isAnonymous && post.author?.username"
        :to="'/u/' + post.author.username"
        class="card-author"
      >
        <AvatarFrame :frame="authorFrame(post.author)" :shape-class="avatarShapeClass(post.author?.avatarShape)" :badge-url="authorBadgeUrl(post.author)">
          <div class="author-avatar" :class="avatarShapeClass(post.author?.avatarShape)">
            <img v-if="post.author && post.author.avatarUrl" :src="avatarSrc(post.author.avatarUrl, post.author.id === auth.user?.id ? auth.avatarVersion : undefined)" alt="" class="avatar-img" />
            <span v-else class="avatar-initial">{{ (post.author && (post.author.displayName || post.author.username)) ? (post.author.displayName || post.author.username)[0] : '?' }}</span>
          </div>
        </AvatarFrame>
        <div class="author-info">
          <span class="author-name">{{ post.author && (post.author.displayName || post.author.username) }}</span>
          <div class="author-meta">
            <span class="meta-date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-read">{{ readTime }} min read</span>
          </div>
        </div>
      </router-link>
      <div v-else class="card-author card-author-anonymous">
        <div class="author-avatar author-avatar-anonymous">
          <img v-if="anonAvatarUrl" :src="anonAvatarUrl" alt="" class="avatar-img" />
          <span v-else class="avatar-initial">{{ (post.anonymousAlias || '?')[0] }}</span>
        </div>
        <div class="author-info">
          <span class="author-name">{{ post.anonymousAlias || 'Anonymous' }}</span>
          <div class="author-meta">
            <span class="meta-date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-read">{{ readTime }} min read</span>
          </div>
        </div>
      </div>
      <button type="button" class="card-menu" aria-label="Post menu" @click.stop>
        <span aria-hidden="true">⋯</span>
      </button>
    </header>

    <router-link :to="'/posts/' + post.id" class="card-body">
      <h2 class="card-title">{{ post.title }}</h2>
      <p v-if="excerpt" class="card-excerpt">{{ excerpt }}</p>
      <div v-if="postImageUrls.length" class="card-thumbnails" :class="'card-thumbnails--' + postImageUrls.length">
        <img
          v-for="(url, i) in postImageUrls"
          :key="i"
          :src="avatarSrc(url)"
          alt=""
          class="card-thumb"
          loading="lazy"
        />
      </div>
      <a
        v-if="linkPreview"
        :href="linkPreview.url"
        target="_blank"
        rel="noopener noreferrer"
        class="card-link-preview"
        @click.stop
      >
        <div v-if="linkPreview.image" class="card-link-preview-media">
          <img :src="linkPreview.image" alt="" class="card-link-preview-img" loading="lazy" />
        </div>
        <div class="card-link-preview-body">
          <span v-if="linkPreview.siteName" class="card-link-preview-site">{{ linkPreview.siteName }}</span>
          <span class="card-link-preview-title">{{ linkPreview.title || 'Link' }}</span>
          <p v-if="linkPreview.description" class="card-link-preview-desc">{{ linkPreviewDescription }}</p>
          <span class="card-link-preview-hint">
            <i class="pi pi-external-link" aria-hidden="true"></i> Open link
          </span>
        </div>
      </a>
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
    <div v-if="post.poll && post.poll.options?.length" class="card-poll-wrap">
      <PollBlock
        :post="postForPollBlock"
        compact
        @update="onPollUpdate"
      />
    </div>

    <footer class="card-footer" :class="cardFooterSizeClass">
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
import { avatarShapeClass } from '@/utils/avatar'
import AvatarFrame from '@/components/AvatarFrame.vue'
import PollBlock from '@/components/PollBlock.vue'
import type { AvatarFrame as AvatarFrameType } from '@/types/avatarFrame'
import type { PostCardStyle } from '@/types/postCardStyle'
import { BADGE_EMOJI } from '@/types/postCardStyle'
import { useAuthStore } from '@/stores/auth'
import { useLikedPostsStore } from '@/stores/likedPosts'

const auth = useAuthStore()
const likedStore = useLikedPostsStore()

const anonAvatarModules = import.meta.glob<{ default: string }>('@/assets/anonavatars/*', { eager: true })
const anonAvatarUrls = Object.values(anonAvatarModules).map((m) => m.default).filter(Boolean)

function getAnonAvatarUrl(postId: string): string {
  if (anonAvatarUrls.length === 0) return ''
  let hash = 0
  for (let i = 0; i < postId.length; i++) hash = (hash << 5) - hash + postId.charCodeAt(i)
  const index = Math.abs(hash) % anonAvatarUrls.length
  return anonAvatarUrls[index]
}

function authorFrame(author: unknown): AvatarFrameType | null {
  return ((author as { avatarFrame?: AvatarFrameType } | null)?.avatarFrame ?? null) as AvatarFrameType | null
}

function authorBadgeUrl(author: unknown): string | null {
  return (author as { badgeUrl?: string } | null)?.badgeUrl ?? null
}

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

const anonAvatarUrl = computed(() => {
  if (!props.post?.isAnonymous || !props.post?.id) return ''
  return getAnonAvatarUrl(props.post.id)
})

const likedFromApi = computed(() => !!props.post.isLiked)
const liked = computed(() => likedFromApi.value || likedStore.has(props.post.id))
const likeCount = ref((props.post._count && props.post._count.likes) || 0)

watch(
  () => props.post,
  (post) => {
    likeCount.value = (post._count && post._count.likes) || 0
    // Sync API liked state to store
    if (post.isLiked) {
      likedStore.setLiked(post.id, true)
    }
  },
  { deep: true, immediate: true }
)

type PollBlockPost = {
  id: string
  poll?: {
    id: string
    isOpen: boolean
    resultsVisible: boolean
    options: Array<{ id: string; text: string; order?: number; _count?: { votes: number } }>
    votes?: Array<{ pollOptionId: string }>
  }
}
const postForPollBlock = computed(() => props.post as PollBlockPost)

const cardStyle = computed((): PostCardStyle => {
  const raw = (props.post as { cardStyle?: PostCardStyle }).cardStyle
  return raw && typeof raw === 'object' ? raw : null
})

function buildCardBackground(s: NonNullable<PostCardStyle>): string | undefined {
  const g = s.gradient
  if (g?.colors?.length) {
    if (g.conic) return `conic-gradient(from ${g.angle ?? 0}deg, ${g.colors.join(', ')})`
    return `linear-gradient(${g.angle ?? 180}deg, ${g.colors.join(', ')})`
  }
  if (s.backgroundColor) return s.backgroundColor
  return undefined
}

/** For shimmer/gradient-shift we need a gradient + background-size. If only solid color, use a two-tone gradient. */
function getBackgroundForAnimation(
  s: NonNullable<PostCardStyle>,
  bg: string | undefined
): { background: string; backgroundSize?: string } {
  const anim = s.animation
  if (anim !== 'shimmer' && anim !== 'gradient-shift') return { background: bg ?? '' }
  if (bg && (s.gradient?.colors?.length ?? 0) > 0) {
    return {
      background: bg,
      backgroundSize: anim === 'shimmer' ? '200% 100%' : '200% 200%',
    }
  }
  const color = s.backgroundColor || 'var(--bg-card, #fff)'
  const fallbackGradient = `linear-gradient(90deg, ${color} 0%, rgba(255,255,255,0.7) 50%, ${color} 100%)`
  return {
    background: fallbackGradient,
    backgroundSize: anim === 'shimmer' ? '200% 100%' : '200% 200%',
  }
}

const cardHasBgOpacity = computed(() => {
  const s = cardStyle.value
  return s && s.backgroundOpacity != null && s.backgroundOpacity !== 1
})

const cardWrapperStyle = computed(() => {
  const s = cardStyle.value
  const base: Record<string, string> = { animationDelay: props.animationDelay }
  if (!s) return base
  let bg = buildCardBackground(s)
  const animBg = getBackgroundForAnimation(s, bg)
  if (cardHasBgOpacity.value) {
    base.background = 'transparent'
    base['--card-bg'] = animBg.background
    base['--card-bg-opacity'] = String(s.backgroundOpacity)
    base['--card-bg-size'] = animBg.backgroundSize || 'auto'
  } else {
    if (animBg.background) base.background = animBg.background
    if (animBg.backgroundSize) base.backgroundSize = animBg.backgroundSize
  }
  if (s.backgroundImage) base.backgroundImage = s.backgroundImage
  if (s.opacity != null && s.opacity !== 1) base.opacity = String(s.opacity)
  if (s.borderColor) base.borderColor = s.borderColor
  if (s.borderWidth != null) base.borderWidth = `${s.borderWidth}px`
  if (s.borderStyle) base.borderStyle = s.borderStyle
  if (s.boxShadow) base.boxShadow = s.boxShadow
  return base
})

const cardShapeClass = computed(() => {
  const shape = cardStyle.value?.shape
  if (!shape || shape === 'default') return ''
  return `card--shape-${shape}`
})

const cardAnimationClass = computed(() => {
  const anim = cardStyle.value?.animation
  if (!anim || anim === 'none') return ''
  return `card--animation-${anim}`
})

const cardButtonSizeClass = computed(() => {
  const size = cardStyle.value?.buttonSize
  if (!size || size === 'default') return ''
  return `card--buttons-${size}`
})

const cardFooterSizeClass = computed(() => {
  const size = cardStyle.value?.buttonSize
  if (!size || size === 'default') return ''
  return `card-footer--${size}`
})

const cardBadgeDisplay = computed(() => {
  const b = cardStyle.value?.badge
  return b && b !== 'none' ? b : null
})

const cardBadgeMovementClass = computed(() => {
  const m = cardStyle.value?.badgeMovement
  if (!m || m === 'none') return ''
  return `card-badge--${m}`
})

const cardBadgeEmoji = computed(() => {
  const b = cardBadgeDisplay.value
  if (!b || b === 'custom') return ''
  return BADGE_EMOJI[b as keyof typeof BADGE_EMOJI] ?? '✨'
})

const emit = defineEmits<{
  (e: 'archive', postId: string): void
  (e: 'delete', postId: string): void
  (e: 'unarchive', postId: string): void
  (e: 'repost', postId: string): void
  (e: 'like', postId: string, liked: boolean): void
  (e: 'poll-update', updatedPost: Record<string, unknown>): void
}>()

function onPollUpdate(updatedPost: Record<string, unknown>) {
  emit('poll-update', updatedPost)
}

async function toggleLike() {
  if (!auth.token || !props.post.id) return
  
  // Optimistic Update
  const originalLiked = liked.value
  const originalCount = likeCount.value
  
  // We can't directly mutate 'liked' as it's a computed property based on props and store
  // but we can update the store which 'liked' depends on
  likedStore.setLiked(props.post.id, !originalLiked)
  likeCount.value = originalLiked ? originalCount - 1 : originalCount + 1
  
  try {
    const { data } = await api.post(`/posts/${props.post.id}/likes`)
    likedStore.setLiked(props.post.id, data.liked)
    likeCount.value = data.count ?? likeCount.value
    emit('like', props.post.id, data.liked)
  } catch (err) {
    // Rollback
    likedStore.setLiked(props.post.id, originalLiked)
    likeCount.value = originalCount
    console.warn('PostCard like failed, rolled back state:', err)
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
async function onRepost() {
  if (!auth.token || !props.post.id) return
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

interface LinkPreview {
  url: string
  image?: string | null
  title?: string | null
  description?: string | null
  siteName?: string | null
}
const linkPreview = computed(() => {
  const lp = props.post.linkPreview
  if (!lp || typeof lp !== 'object' || !('url' in lp) || typeof (lp as LinkPreview).url !== 'string') return null
  return lp as LinkPreview
})
const linkPreviewDescription = computed(() => {
  const desc = linkPreview.value?.description
  if (!desc) return ''
  return desc.length > 120 ? desc.slice(0, 120) + '…' : desc
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
  padding: clamp(1rem, 4vw, 2rem);
  margin-bottom: 0;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--border-light);
  transition: all 0.2s ease;
  animation: fadeInUp 0.6s ease-out both;
}
.card-repost-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--accent-primary);
  font-weight: 700;
  border: 1px dashed var(--border-medium);
}
.reposter-link {
  color: var(--text-secondary);
  text-decoration: none;
}
.reposter-link:hover {
  color: var(--accent-primary);
  text-decoration: underline;
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
.card.card--bg-opacity::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--card-bg);
  background-size: var(--card-bg-size, auto);
  opacity: var(--card-bg-opacity, 1);
  border-radius: inherit;
  pointer-events: none;
}
.card.card--bg-opacity .card-repost-header,
.card.card--bg-opacity .card-header,
.card.card--bg-opacity .card-body,
.card.card--bg-opacity .card-footer,
.card.card--bg-opacity .card-overlay-gif,
.card.card--bg-opacity .card-badge {
  position: relative;
  z-index: 1;
}
.card:hover {
  border-color: var(--accent-secondary);
}
.card:hover::after {
  opacity: 1;
}

/* Card style: shape */
.card--shape-rounded { border-radius: 1rem; }
.card--shape-square { border-radius: 0; }
.card--shape-squircle { border-radius: 20%; }
.card--shape-pill { border-radius: 9999px; }

/* Card style: surface animations (no card movement) */
.card--animation-shimmer {
  background-size: 200% 100%;
  animation: card-shimmer 3s ease-in-out infinite;
}
@keyframes card-shimmer {
  0%, 100% { background-position: 100% 0; }
  50% { background-position: 0 0; }
}
.card--animation-glitter {
  position: relative;
}
.card--animation-glitter::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 35%);
  pointer-events: none;
  animation: card-glitter 4s ease-in-out infinite;
}
@keyframes card-glitter {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.card--animation-gradient-shift {
  background-size: 200% 200%;
  animation: card-gradient-shift 6s ease infinite;
}
@keyframes card-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Card style: footer button size */
.card--buttons-small .card-footer .action-stat,
.card--buttons-small .card-footer .action-btn {
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  gap: 0.375rem;
}
.card--buttons-small .card-footer .action-stat .pi,
.card--buttons-small .card-footer .action-btn .pi { font-size: 0.9375rem; }
.card--buttons-large .card-footer .action-stat,
.card--buttons-large .card-footer .action-btn {
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  gap: 0.625rem;
}
.card--buttons-large .card-footer .action-stat .pi,
.card--buttons-large .card-footer .action-btn .pi { font-size: 1.25rem; }

/* Overlay GIF (transparent) */
.card-overlay-gif {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}
.card-overlay-gif-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}

/* Card badge (corner) */
.card-badge {
  position: absolute;
  z-index: 3;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}
.card-badge--top-right { top: 0.75rem; right: 0.75rem; }
.card-badge--top-left { top: 0.75rem; left: 0.75rem; }
.card-badge--bottom-right { bottom: 0.75rem; right: 0.75rem; }
.card-badge--bottom-left { bottom: 0.75rem; left: 0.75rem; }
.card-badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.card-badge--float {
  animation: card-badge-float 2.5s ease-in-out infinite;
}
.card-badge--orbit {
  animation: card-badge-orbit 8s linear infinite;
}
@keyframes card-badge-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes card-badge-orbit {
  from { transform: rotate(0deg) translateX(12px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
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
.card-author.card-author-anonymous { cursor: default; pointer-events: none; }
.card-author.card-author-anonymous .card-body { pointer-events: auto; }
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
.author-avatar:has(.avatar-img) { background: none; }
.author-avatar.avatar-shape-rounded { border-radius: 12%; }
.author-avatar.avatar-shape-square { border-radius: 0; }
.author-avatar.avatar-shape-squircle { border-radius: 25%; }
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
  top: clamp(1rem, 2vw, 2rem);
  right: clamp(1rem, 2vw, 2rem);
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
.card-poll-wrap {
  position: relative;
  z-index: 2;
  pointer-events: auto;
}
.card-title {
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  font-weight: 800;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--text-primary);
  transition: color 0.2s ease;
  word-break: break-word;
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
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-primary);
  display: block;
}
/* One image: large preview */
.card-thumbnails--1 .card-thumb {
  max-height: 240px;
  object-position: center;
}
/* Two images: medium, side by side */
.card-thumbnails--2 .card-thumb {
  flex: 1 1 0;
  min-width: 0;
  max-height: 160px;
}
/* Three or four: small grid */
.card-thumbnails--3 .card-thumb,
.card-thumbnails--4 .card-thumb {
  width: 72px;
  height: 72px;
  max-width: 72px;
}

.card-link-preview {
  display: block;
  max-width: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 1rem;
  text-decoration: none;
  color: inherit;
  background: var(--bg-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.card-link-preview:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 12px rgba(139, 69, 19, 0.1);
  text-decoration: none;
  color: inherit;
}
.card-link-preview:hover .card-link-preview-img {
  transform: scale(1.02);
}
.card-link-preview-media {
  position: relative;
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: var(--gray-100);
}
.card-link-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}
.card-link-preview-body {
  padding: 0.625rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.card-link-preview-site {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--accent-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.card-link-preview-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-link-preview-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-link-preview-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
}
.card-link-preview-hint .pi {
  font-size: 0.6875rem;
}
.card-link-preview:hover .card-link-preview-hint {
  color: var(--accent-primary);
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
  .card-author { gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.75rem; }
  .author-avatar { width: 44px; height: 44px; font-size: 1rem; }
  .author-name { font-size: 0.9375rem; }
  .author-meta { font-size: 0.8125rem; gap: 0.5rem; }
  .card-footer {
    gap: 0.375rem;
    padding-top: 1rem;
  }
  .card-footer .action-stat,
  .card-footer .action-btn {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    gap: 0.375rem;
  }
  .card-footer .action-stat .pi,
  .card-footer .action-btn .pi { font-size: 1rem; }
  .card-actions { margin-left: auto; }
}
@media (max-width: 480px) {
  .card { padding: 1rem; }
  .card-footer {
    gap: 0.25rem;
    padding-top: 0.75rem;
  }
  .card-footer .action-stat,
  .card-footer .action-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }
  .card-footer .action-stat .pi,
  .card-footer .action-btn .pi { font-size: 0.9375rem; }
  .card-thumbnails--2 .card-thumb { min-width: 100%; max-height: 140px; }
  .card-thumbnails--3 .card-thumb,
  .card-thumbnails--4 .card-thumb {
    width: 56px;
    height: 56px;
    max-width: 56px;
  }
  .card-link-preview-media { height: 120px; }
  .card-link-preview-body { padding: 0.5rem 0.75rem; }
}
</style>
