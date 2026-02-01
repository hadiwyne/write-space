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
          <button v-if="auth.isLoggedIn" type="button" class="action" :class="{ active: bookmarked }" @click="toggleBookmark" v-tooltip.bottom="bookmarked ? 'Remove bookmark' : 'Bookmark'">
            <i :class="bookmarked ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
          </button>
          <button v-if="auth.isLoggedIn" type="button" class="action" :class="{ active: reposted }" @click="toggleRepost" v-tooltip.bottom="reposted ? 'Undo repost' : 'Repost'">
            <i class="pi pi-refresh"></i>
            {{ repostCount }}
          </button>
          <div class="export-wrap" ref="exportWrapRef">
            <button type="button" class="action" v-tooltip.bottom="'Export'" @click="exportOpen = !exportOpen">
              <i class="pi pi-download"></i> Export
            </button>
            <div v-if="exportOpen" class="export-dropdown">
              <button type="button" class="export-option" @click="downloadExport('html')">Download as HTML</button>
              <button type="button" class="export-option" @click="downloadExport('docx')">Download as DOCX</button>
            </div>
          </div>
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
          <CommentThread
            v-for="c in comments"
            :key="c.id"
            :comment="c"
            :depth="0"
            :reply-to-id="replyToId"
            :reply-content="replyContent"
            :is-logged-in="!!auth.isLoggedIn"
            :avatar-src="avatarSrc"
            @reply="replyToId = replyToId === $event ? null : $event"
            @update:reply-content="replyContent = $event"
            @submit-reply="addComment($event)"
            @cancel-reply="replyToId = null; replyContent = ''"
          />
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
import CommentThread from '@/components/CommentThread.vue'

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
const comments = ref<CommentNode[]>([])

type CommentNode = {
  id: string
  content: string
  author?: { username?: string; displayName?: string | null; avatarUrl?: string | null }
  replies?: CommentNode[]
}
const loading = ref(true)
const liked = ref(false)
const likeCount = ref(0)
const bookmarked = ref(false)
const reposted = ref(false)
const repostCount = ref(0)
const exportOpen = ref(false)
const newComment = ref('')
const replyToId = ref<string | null>(null)
const replyContent = ref('')

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
      const [likeRes, bookmarkRes, repostRes] = await Promise.all([
        api.get(`/posts/${id}/likes/me`).catch(() => ({ data: { liked: false } })),
        api.get(`/posts/${id}/bookmarks/me`).catch(() => ({ data: { bookmarked: false } })),
        api.get(`/posts/${id}/reposts/me`).catch(() => ({ data: { reposted: false } })),
      ])
      liked.value = likeRes.data?.liked ?? false
      bookmarked.value = bookmarkRes.data?.bookmarked ?? false
      reposted.value = repostRes.data?.reposted ?? false
    }
    repostCount.value = post.value?._count?.reposts ?? 0
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

async function toggleBookmark() {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await api.post(`/posts/${route.params.id}/bookmarks`)
    bookmarked.value = data.bookmarked
  } catch {
    // ignore
  }
}

async function toggleRepost() {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await api.post(`/posts/${route.params.id}/reposts`)
    reposted.value = data.reposted
    repostCount.value = data.count ?? repostCount.value
  } catch {
    // ignore
  }
}

async function downloadExport(format: string) {
  exportOpen.value = false
  try {
    const { data } = await api.get(`/posts/${route.params.id}/export`, { params: { format }, responseType: 'blob' })
    const ext = format === 'docx' ? 'docx' : 'html'
    const name = (post.value?.title || 'post').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80) || 'export'
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // ignore
  }
}

function findCommentInTree(tree: CommentNode[], id: string): CommentNode | null {
  for (const c of tree) {
    if (c.id === id) return c
    const found = c.replies && findCommentInTree(c.replies, id)
    if (found) return found
  }
  return null
}

async function addComment(parentId?: string) {
  const text = parentId ? replyContent.value.trim() : newComment.value.trim()
  if (!text || !auth.isLoggedIn) return
  try {
    const body = parentId ? { content: text, parentId } : { content: text }
    const { data } = await api.post(`/posts/${route.params.id}/comments`, body)
    if (parentId) {
      const parent = findCommentInTree(comments.value, parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(data)
      }
      replyToId.value = null
      replyContent.value = ''
    } else {
      comments.value.push(data)
      newComment.value = ''
    }
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
.post-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
.action { display: inline-flex; align-items: center; gap: 0.35rem; margin-right: 0; font-size: 0.9375rem; color: var(--gray-700); cursor: pointer; background: none; border: none; }
.export-wrap { position: relative; }
.export-dropdown { position: absolute; top: 100%; left: 0; margin-top: 0.25rem; background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; min-width: 10rem; }
.export-option { display: block; width: 100%; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.875rem; background: none; border: none; cursor: pointer; color: var(--gray-800); }
.export-option:hover { background: var(--gray-100); }
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
.comment-reply-btn { margin-top: 0.25rem; padding: 0; background: none; border: none; font-size: 0.8125rem; color: var(--primary); cursor: pointer; }
.comment-reply-form { margin-left: 2.5rem; }
.comment-reply-form textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius); margin-bottom: 0.5rem; font-size: 0.9375rem; }
.comment-reply-form .btn-ghost { margin-left: 0.5rem; background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
.comment-reply-form .btn-ghost:hover { background: var(--gray-100); }
.comment-replies { margin-left: 2.5rem; margin-top: 0.5rem; }
.comment-reply .comment-avatar-link { width: 28px; height: 28px; }
.comment-reply .comment-avatar, .comment-reply .comment-avatar-placeholder { width: 28px; height: 28px; font-size: 0.75rem; line-height: 28px; }
.comment-reply .comment-author, .comment-reply .comment-body { font-size: 0.8125rem; }
</style>
