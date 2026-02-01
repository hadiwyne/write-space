<template>
  <article class="repost-card">
    <div class="repost-header">
      <i class="pi pi-refresh" aria-hidden="true"></i>
      <span class="repost-text">{{ reposterName }} reposted {{ repostedAgo }}</span>
    </div>
    <PostCard
      :post="post"
      :show-actions="showActions"
      :archived-mode="archivedMode"
      :show-repost="showRepost"
      :reposted="reposted"
      animation-delay="0s"
      @archive="$emit('archive', post.id)"
      @delete="$emit('delete', post.id)"
      @unarchive="$emit('unarchive', post.id)"
      @repost="$emit('repost', post.id)"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PostCard from './PostCard.vue'

const props = defineProps({
  post: { type: Object, required: true },
  repostedAt: { type: [String, Date], required: true },
  reposterName: { type: String, required: true },
  showActions: { type: Boolean, default: false },
  archivedMode: { type: Boolean, default: false },
  showRepost: { type: Boolean, default: false },
  reposted: { type: Boolean, default: false },
})
defineEmits<{
  (e: 'archive', postId: string): void
  (e: 'delete', postId: string): void
  (e: 'unarchive', postId: string): void
  (e: 'repost', postId: string): void
}>()

function formatAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const repostedAgo = computed(() => formatAgo(props.repostedAt))
</script>

<style scoped>
.repost-card {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.repost-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0 0.25rem 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-tertiary);
}
.repost-header .pi {
  font-size: 1rem;
  color: var(--accent-primary);
}
</style>
