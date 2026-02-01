<template>
  <article class="card">
    <header class="card-header">
      <router-link :to="'/u/' + (post.author && post.author.username)" class="author">
        <img v-if="post.author && post.author.avatarUrl" :src="avatarSrc(post.author.avatarUrl)" alt="" class="avatar-img" />
        <span v-else class="avatar">{{ (post.author && (post.author.displayName || post.author.username)) ? (post.author.displayName || post.author.username)[0] : '?' }}</span>
        <span class="name">{{ post.author && (post.author.displayName || post.author.username) }}</span>
      </router-link>
      <span class="date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
    </header>
    <router-link :to="'/posts/' + post.id" class="card-body">
      <h2 class="title">{{ post.title }}</h2>
      <p class="excerpt">{{ excerpt }}</p>
      <div v-if="post.tags && post.tags.length" class="tags">
        <span v-for="t in post.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
    </router-link>
    <footer class="card-footer">
      <span class="stat" v-tooltip.bottom="'Likes'">
        <i class="pi pi-heart"></i>
        {{ (post._count && post._count.likes) || 0 }}
      </span>
      <span class="stat" v-tooltip.bottom="'Comments'">
        <i class="pi pi-comment"></i>
        {{ (post._count && post._count.comments) || 0 }}
      </span>
      <span class="stat" v-tooltip.bottom="'Reposts'">
        <i class="pi pi-refresh"></i>
        {{ (post._count && post._count.reposts) || 0 }}
      </span>
      <button
        v-if="showRepost && post.id"
        type="button"
        class="card-action card-repost"
        :class="{ active: reposted }"
        v-tooltip.bottom="reposted ? 'Undo repost' : 'Repost'"
        @click.stop="onRepost"
      >
        <i class="pi pi-refresh"></i>
      </button>
      <div v-if="showActions" class="card-actions">
        <template v-if="archivedMode">
          <button type="button" class="card-action card-unarchive" v-tooltip.bottom="'Restore to profile'" @click.stop="onUnarchive">
            <i class="pi pi-refresh"></i>
          </button>
        </template>
        <template v-else>
          <button type="button" class="card-action card-archive" v-tooltip.bottom="'Archive'" @click.stop="onArchive">
            <i class="pi pi-folder"></i>
          </button>
        </template>
        <button type="button" class="card-action card-delete" v-tooltip.bottom="'Delete'" @click.stop="onDelete">
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { apiBaseUrl } from '@/api/client'

const props = defineProps({
  post: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
  archivedMode: { type: Boolean, default: false },
  showRepost: { type: Boolean, default: false },
  reposted: { type: Boolean, default: false },
})
const emit = defineEmits<{
  (e: 'archive', postId: string): void
  (e: 'delete', postId: string): void
  (e: 'unarchive', postId: string): void
  (e: 'repost', postId: string): void
}>()

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
function avatarSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBaseUrl + url
}
const excerpt = computed(() => {
  const raw = (props.post.content || props.post.renderedHTML || '')
  const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 160) + (text.length > 160 ? '…' : '')
})
function formatDate(s: string | undefined) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return d.toLocaleDateString()
}
</script>

<style scoped>
.card { background: #fff; border: 1px solid var(--gray-200); border-radius: 12px; padding: 1.25rem; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.author { display: flex; align-items: center; gap: 0.5rem; color: var(--gray-700); font-size: 0.875rem; }
.avatar, .avatar-img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: var(--gray-200); display: inline-flex; align-items: center; justify-content: center; font-size: 0.875rem; }
.card-body { display: block; color: inherit; }
.title { font-size: 1.25rem; margin: 0 0 0.25rem; }
.excerpt { color: var(--gray-700); font-size: 0.9375rem; margin: 0 0 0.5rem; }
.tag { font-size: 0.8125rem; color: var(--primary); margin-right: 0.5rem; }
.card-footer { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--gray-100); font-size: 0.8125rem; color: var(--gray-700); display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.stat { display: inline-flex; align-items: center; gap: 0.35rem; }
.stat .pi { font-size: 0.95rem; }
.card-actions { margin-left: auto; display: flex; align-items: center; gap: 0.25rem; }
.card-action { padding: 0.25rem 0.5rem; background: none; border: none; color: var(--gray-500); cursor: pointer; border-radius: var(--radius); }
.card-action .pi { font-size: 0.95rem; }
.card-action:hover { background: var(--gray-100); color: var(--gray-700); }
.card-delete:hover { color: #dc2626; }
.card-unarchive:hover { color: var(--primary); }
.card-repost { margin-left: auto; }
.card-repost.active { color: var(--primary); }
</style>
