<template>
  <div class="post-page">
    <div v-if="loading" class="loading">Loading…</div>
    <template v-else-if="post">
      <article class="post">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <router-link :to="`/u/${post.author?.username}`" class="author">
            {{ post.author?.displayName || post.author?.username }}
          </router-link>
          <span class="date">{{ formatDate(post.publishedAt) }}</span>
        </div>
        <div class="post-content" v-html="post.renderedHTML"></div>
        <div v-if="(post.tags?.length || 0) > 0" class="post-tags">
          <router-link v-for="t in post.tags" :key="t" :to="`/feed?tag=${t}`" class="tag">#{{ t }}</router-link>
        </div>
        <footer class="post-actions">
          <button type="button" class="action" :class="{ active: liked }" @click="toggleLike" v-tooltip.bottom="liked ? 'Unlike' : 'Like'">
            <i :class="liked ? 'pi pi-heart-fill' : 'pi pi-heart'"></i>
            {{ likeCount }}
          </button>
          <span class="action" v-tooltip.bottom="'Comments'">
            <i class="pi pi-comment"></i>
            {{ commentCount }}
          </span>
          <template v-if="isOwnPost">
            <router-link :to="`/posts/${post.id}/edit`" class="action action-edit" v-tooltip.bottom="'Edit'">
              <i class="pi pi-pencil"></i> Edit
            </router-link>
            <button type="button" class="action action-archive" v-tooltip.bottom="'Hide from public (can restore later)'" @click="archivePost">
              <i class="pi pi-folder"></i> Archive
            </button>
            <button type="button" class="action action-delete" v-tooltip.bottom="'Permanently delete'" @click="deletePost">
              <i class="pi pi-trash"></i> Delete
            </button>
          </template>
        </footer>
      </article>
      <section class="comments">
        <h2>Comments</h2>
        <div v-if="auth.isLoggedIn" class="comment-form">
          <textarea v-model="newComment" placeholder="Add a comment…" rows="3"></textarea>
          <button type="button" class="btn btn-primary btn-sm" @click="addComment">Post</button>
        </div>
        <div class="comment-list">
          <div v-for="c in comments" :key="c.id" class="comment">
            <router-link :to="`/u/${c.author?.username}`" class="comment-avatar-link">
              <img v-if="c.author?.avatarUrl" :src="avatarSrc(c.author.avatarUrl)" alt="" class="comment-avatar" />
              <span v-else class="comment-avatar-placeholder">{{ (c.author?.displayName || c.author?.username || '?')[0] }}</span>
            </router-link>
            <div class="comment-content">
              <router-link :to="`/u/${c.author?.username}`" class="comment-author">{{ c.author?.displayName || c.author?.username }}</router-link>
              <p class="comment-body">{{ c.content }}</p>
            </div>
          </div>
        </div>
      </section>
    </template>
    <div v-else class="error">Post not found</div>

    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-label="confirmType === 'delete' ? 'Delete' : 'Archive'"
      cancel-label="Cancel"
      :variant="confirmType === 'delete' ? 'danger' : 'default'"
      @confirm="onConfirmConfirm"
      @cancel="confirmOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { api, apiBaseUrl } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import ConfirmModal from '@/components/ConfirmModal.vue'

function avatarSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBaseUrl + url
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const post = ref<{
  id: string
  title: string
  renderedHTML: string
  tags?: string[]
  publishedAt: string | null
  author?: { id?: string; username?: string; displayName?: string | null }
  _count?: { likes: number; comments: number }
} | null>(null)

const isOwnPost = computed(() => {
  const u = auth.user
  const a = post.value?.author
  return !!(u?.id && a?.id && u.id === a.id)
})
const comments = ref<{ id: string; content: string; author?: { username?: string; displayName?: string | null; avatarUrl?: string | null } }[]>([])
const loading = ref(true)
const liked = ref(false)
const likeCount = ref(0)
const newComment = ref('')

const commentCount = computed(() => post.value?._count?.comments ?? comments.value.length)

const confirmOpen = ref(false)
const confirmType = ref<'archive' | 'delete' | null>(null)
const confirmTitle = computed(() =>
  confirmType.value === 'delete' ? 'Delete post?' : 'Archive post?'
)
const confirmMessage = computed(() =>
  confirmType.value === 'delete'
    ? 'Permanently delete this post? This cannot be undone.'
    : 'Archive this post? It will be hidden from the feed and your profile. You can restore it later.'
)

async function load() {
  const id = route.params.id as string
  try {
    const [postRes, commentsRes] = await Promise.all([
      api.get(`/posts/${id}`),
      api.get(`/posts/${id}/comments`),
    ])
    post.value = postRes.data
    comments.value = commentsRes.data
    likeCount.value = post.value?._count?.likes ?? 0
    if (auth.token) {
      const meRes = await api.get(`/posts/${id}/likes/me`).catch(() => ({ data: { liked: false } }))
      liked.value = meRes.data?.liked ?? false
    }
  } finally {
    loading.value = false
  }
}

function formatDate(s: string | null | undefined) {
  if (!s) return ''
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'long' })
}

async function toggleLike() {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await api.post(`/posts/${route.params.id}/likes`)
    liked.value = data.liked
    likeCount.value = data.count ?? likeCount.value
  } catch {
    // ignore
  }
}

async function addComment() {
  const text = newComment.value.trim()
  if (!text || !auth.isLoggedIn) return
  try {
    const { data } = await api.post(`/posts/${route.params.id}/comments`, { content: text })
    comments.value.push(data)
    newComment.value = ''
  } catch {
    // ignore
  }
}

function archivePost() {
  confirmType.value = 'archive'
  confirmOpen.value = true
}

function deletePost() {
  confirmType.value = 'delete'
  confirmOpen.value = true
}

async function onConfirmConfirm() {
  if (!confirmType.value) return
  const type = confirmType.value
  confirmOpen.value = false
  confirmType.value = null
  try {
    if (type === 'archive') {
      await api.post(`/posts/${route.params.id}/archive`)
    } else {
      await api.delete(`/posts/${route.params.id}`)
    }
    router.push(auth.user?.username ? `/u/${auth.user.username}` : '/feed')
  } catch {
    // ignore
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<style scoped>
.post-page { padding: 0; }
.loading, .error { padding: 2rem 0; color: var(--gray-700); }
.post { margin-bottom: 2rem; }
.post-title { font-size: 2rem; margin: 0 0 0.5rem; }
.post-meta { display: flex; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--gray-700); }
.post-content { line-height: 1.7; }
.post-content :deep(img) { max-width: 100%; }
.post-tags { margin-top: 1rem; }
.post-tags .tag { margin-right: 0.5rem; font-size: 0.875rem; }
.post-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); display: flex; gap: 1rem; }
.action { display: inline-flex; align-items: center; gap: 0.35rem; margin-right: 0; font-size: 0.9375rem; color: var(--gray-700); cursor: pointer; background: none; border: none; }
.action .pi { font-size: 1rem; }
.action.active { color: var(--primary); }
.action-edit { color: var(--primary); text-decoration: none; }
.action-edit:hover { text-decoration: underline; }
.action-archive { color: var(--gray-600); }
.action-archive:hover { color: var(--gray-800); }
.action-delete { color: var(--gray-600); }
.action-delete:hover { color: #dc2626; }
.comments h2 { font-size: 1.25rem; margin: 0 0 1rem; }
.comment-form { margin-bottom: 1rem; }
.comment-form textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius); margin-bottom: 0.5rem; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.comment-list { display: flex; flex-direction: column; gap: 0.75rem; }
.comment { display: flex; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); }
.comment-avatar-link { flex-shrink: 0; }
.comment-avatar, .comment-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: var(--gray-200); display: block; line-height: 36px; font-size: 0.875rem; text-align: center; }
.comment-content { flex: 1; min-width: 0; }
.comment-author { font-weight: 500; font-size: 0.875rem; }
.comment-body { margin: 0.25rem 0 0; font-size: 0.9375rem; }
</style>
