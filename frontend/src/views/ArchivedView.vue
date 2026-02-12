<template>
  <div class="archived-page">
    <h1>Archived posts</h1>
    <p class="intro">Posts you’ve archived are hidden from your profile and the feed. Restore them here or delete permanently.</p>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="posts.length === 0" class="empty">No archived posts.</div>
    <div v-else class="post-list">
      <PostCard
        v-for="p in posts"
        :key="postKey(p)"
        :post="p"
        :show-actions="true"
        :archived-mode="true"
        @unarchive="unarchivePost"
        @delete="openDeleteConfirm"
      />
    </div>

    <ConfirmModal
      :open="deleteConfirmOpen"
      title="Delete post?"
      message="Permanently delete this post? This cannot be undone."
      confirm-label="Delete"
      cancel-label="Cancel"
      variant="danger"
      @confirm="onDeleteConfirm"
      @cancel="deleteConfirmOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import PostCard from '@/components/PostCard.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const posts = ref<Record<string, unknown>[]>([])
const loading = ref(true)

function postKey(p: Record<string, unknown>) {
  return String((p as { id?: string }).id ?? '')
}
const deleteConfirmOpen = ref(false)
const deleteConfirmPostId = ref<string | null>(null)

onMounted(async () => {
  try {
    const { data } = await api.get('/posts/archived')
    posts.value = Array.isArray(data) ? data : []
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
})

async function unarchivePost(postId: string) {
  try {
    await api.post(`/posts/${postId}/unarchive`)
    posts.value = posts.value.filter((p) => (p as { id: string }).id !== postId)
  } catch {
    // ignore
  }
}

function openDeleteConfirm(postId: string) {
  deleteConfirmPostId.value = postId
  deleteConfirmOpen.value = true
}

async function onDeleteConfirm() {
  const postId = deleteConfirmPostId.value
  deleteConfirmOpen.value = false
  deleteConfirmPostId.value = null
  if (!postId) return
  try {
    await api.delete(`/posts/${postId}`)
    posts.value = posts.value.filter((p) => (p as { id: string }).id !== postId)
  } catch {
    // ignore
  }
}
</script>

<style scoped>
.archived-page { padding: 0; }
.archived-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 0.5rem; }
.intro { color: var(--gray-700); font-size: 0.9375rem; margin: 0 0 1.5rem; }
.loading, .empty { padding: 1rem 0; color: var(--gray-700); }
.post-list { display: flex; flex-direction: column; gap: clamp(1rem, 3vw, 1.5rem); }
</style>
