<template>
  <div class="post-page">
    <div v-if="loading" class="loading">Loading…</div>
    <template v-else-if="post">
      <article class="post">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <router-link v-if="!post.isAnonymous && post.author?.username" :to="`/u/${post.author.username}`" class="author">
            {{ post.author?.displayName || post.author?.username }}
          </router-link>
          <span v-else class="author author-anonymous">{{ post.anonymousAlias || 'Anonymous' }}</span>
          <span class="date">{{ formatDate(post.publishedAt) }}</span>
        </div>
        <div class="post-content" v-html="post.renderedHTML"></div>
        <div v-if="(post.tags?.length || 0) > 0" class="post-tags">
          <router-link v-for="t in post.tags" :key="t" :to="`/feed?tag=${t}`" class="tag">#{{ t }}</router-link>
        </div>
        <footer class="post-actions">
          <button type="button" class="action action-like" :class="{ active: liked }" @click="toggleLike" v-tooltip.bottom="liked ? 'Unlike' : 'Like'">
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
          <div v-if="auth.isLoggedIn" class="dropdown-wrap">
            <button type="button" class="action" v-tooltip.bottom="'Add to collection'" @click="toggleCollectionDropdown">
              <i class="pi pi-folder-plus"></i>
            </button>
            <div v-if="collectionDropdownOpen" class="action-dropdown">
              <div v-if="collectionsLoading" class="dropdown-loading">Loading…</div>
              <template v-else-if="collections.length === 0">
                <div class="dropdown-empty">No collections yet.</div>
                <router-link to="/collections" class="dropdown-option" @click="collectionDropdownOpen = false">Create collection</router-link>
              </template>
              <template v-else>
                <button
                  v-for="c in collections"
                  :key="collectionId(c)"
                  type="button"
                  class="dropdown-option"
                  :disabled="addingToCollection === collectionId(c)"
                  @click="addToCollection(collectionId(c))"
                >
                  <i class="pi pi-folder"></i>
                  {{ collectionTitle(c) }}
                </button>
                <router-link to="/collections" class="dropdown-option dropdown-option-muted" @click="collectionDropdownOpen = false">
                  <i class="pi pi-plus"></i> New collection
                </router-link>
              </template>
            </div>
          </div>
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
          <template v-else-if="showPostActions">
            <button type="button" class="action action-delete" v-tooltip.bottom="'Permanently delete (admin)'" @click="deletePost">
              <i class="pi pi-trash"></i> Delete
            </button>
          </template>
        </footer>
      </article>
      <section class="comments">
        <h2>Comments</h2>
        <div v-if="auth.isLoggedIn" class="comment-form">
          <textarea v-model="newComment" placeholder="Add a comment…" rows="3"></textarea>
          <button type="button" class="btn btn-primary btn-sm" @click="() => addComment()">Post</button>
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
            :can-delete-fn="canDeleteComment"
            :avatar-src="(url, userId) => avatarSrc(url, userId === auth.user?.id ? auth.avatarVersion : undefined)"
            @reply="replyToId = replyToId === $event ? null : $event"
            @update:reply-content="replyContent = $event"
            @submit-reply="addComment($event)"
            @cancel-reply="replyToId = null; replyContent = ''"
            @delete="deleteComment"
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
import { api, avatarSrc } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useLikedPostsStore } from '@/stores/likedPosts'
import ConfirmModal from '@/components/ConfirmModal.vue'
import CommentThread from '@/components/CommentThread.vue'

function collectionId(c: { id: string; title: string }) {
  return c.id
}
function collectionTitle(c: { id: string; title: string }) {
  return c.title
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const likedStore = useLikedPostsStore()
const post = ref<{
  id: string
  title: string
  renderedHTML: string
  tags?: string[]
  publishedAt: string | null
  author?: { id?: string; username?: string; displayName?: string | null }
  isAnonymous?: boolean
  anonymousAlias?: string | null
  _count?: { likes: number; comments: number }
} | null>(null)

const isOwnPost = computed(() => {
  const u = auth.user
  const a = post.value?.author
  return !!(u?.id && a?.id && u.id === a.id)
})
const showPostActions = computed(() => isOwnPost.value || !!auth.user?.isSuperadmin)
const comments = ref<CommentNode[]>([])

type CommentNode = {
  id: string
  content: string
  author?: { id?: string; username?: string; displayName?: string | null; avatarUrl?: string | null }
  replies?: CommentNode[]
}
function canDeleteComment(c: CommentNode): boolean {
  const u = auth.user
  if (!u?.id) return false
  return (c.author?.id && c.author.id === u.id) || !!u.isSuperadmin
}
const loading = ref(true)
const liked = ref(false)
const likeCount = ref(0)
const bookmarked = ref(false)
const reposted = ref(false)
const repostCount = ref(0)
const exportOpen = ref(false)
const collectionDropdownOpen = ref(false)
const collections = ref<{ id: string; title: string }[]>([])
const collectionsLoading = ref(false)
const addingToCollection = ref<string | null>(null)
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
      const isLiked = likeRes.data?.liked ?? false
      liked.value = isLiked
      if (isLiked) likedStore.setLiked(id, true)
      bookmarked.value = bookmarkRes.data?.bookmarked ?? false
      reposted.value = repostRes.data?.reposted ?? false
    }
    repostCount.value = (post.value?._count as { reposts?: number } | undefined)?.reposts ?? 0
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
  const postId = route.params.id as string
  try {
    const { data } = await api.post(`/posts/${postId}/likes`)
    liked.value = data.liked
    likeCount.value = data.count ?? likeCount.value
    likedStore.setLiked(postId, data.liked)
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

function toggleCollectionDropdown() {
  collectionDropdownOpen.value = !collectionDropdownOpen.value
  if (collectionDropdownOpen.value && collections.value.length === 0 && !collectionsLoading.value) {
    loadCollections()
  }
}

async function loadCollections() {
  collectionsLoading.value = true
  try {
    const { data } = await api.get('/collections/me')
    collections.value = Array.isArray(data) ? data : []
  } catch {
    collections.value = []
  } finally {
    collectionsLoading.value = false
  }
}

async function addToCollection(collectionId: string) {
  const postId = route.params.id as string
  if (!postId || addingToCollection.value) return
  addingToCollection.value = collectionId
  try {
    await api.post(`/collections/${collectionId}/posts/${postId}`)
    collectionDropdownOpen.value = false
  } catch {
    // ignore (e.g. already in collection)
  } finally {
    addingToCollection.value = null
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

async function deleteComment(commentId: string) {
  const postId = route.params.id as string
  if (!postId) return
  try {
    await api.delete(`/posts/${postId}/comments/${commentId}`)
    const { data } = await api.get(`/posts/${postId}/comments`)
    comments.value = data ?? []
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
.loading, .error { padding: clamp(1rem, 4vw, 2rem) 0; color: var(--text-secondary); }
.post {
  margin-bottom: clamp(1rem, 4vw, 2rem);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: clamp(1rem, 4vw, 2rem);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--border-light);
}
.post-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--text-primary);
  word-break: break-word;
}
.post-meta { display: flex; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--text-tertiary); }
.post-meta .author { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
.post-meta .author:hover { color: var(--accent-burgundy); text-decoration: underline; }
.post-meta .author.author-anonymous { cursor: default; color: var(--text-secondary); }
.post-meta .author.author-anonymous:hover { text-decoration: none; color: var(--text-secondary); }
.post-content { line-height: 1.75; color: var(--text-secondary); }
.post-content :deep(img) { max-width: 100%; height: auto; display: block; }
.post-tags { margin-top: 1.25rem; display: flex; gap: 0.625rem; flex-wrap: wrap; }
.post-tags .tag {
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  color: var(--accent-primary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid var(--border-light);
  text-decoration: none;
  transition: all 0.2s ease;
}
.post-tags .tag:hover { background: var(--accent-primary); border-color: var(--accent-primary); color: white; text-decoration: none; }
.post-actions {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-family: inherit;
  transition: all 0.2s ease;
}
.action:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
.action.active { color: var(--accent-primary); border-color: var(--accent-primary); }
.action-like.active { color: var(--like-color); border-color: var(--like-color); background: rgba(220, 20, 60, 0.08); }
.dropdown-wrap { position: relative; }
.action-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  min-width: 12rem;
  max-height: 16rem;
  overflow-y: auto;
}
.dropdown-loading, .dropdown-empty { padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--text-tertiary); }
.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  text-decoration: none;
  font-family: inherit;
  transition: all 0.2s ease;
}
.dropdown-option:hover:not(:disabled) { background: var(--bg-primary); color: var(--accent-primary); }
.dropdown-option:disabled { opacity: 0.6; cursor: not-allowed; }
.dropdown-option-muted { color: var(--text-tertiary); font-size: 0.8125rem; }
.export-wrap { position: relative; }
.export-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  min-width: 10rem;
}
.export-option {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  font-family: inherit;
}
.export-option:hover { background: var(--bg-primary); }
.action .pi { font-size: 1.125rem; }
.action-edit { color: var(--accent-primary); text-decoration: none; background: transparent; border-color: transparent; }
.action-edit:hover { color: var(--accent-burgundy); text-decoration: underline; border-color: transparent; }
.action-archive { color: var(--text-tertiary); }
.action-archive:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
.action-delete { color: var(--text-tertiary); }
.action-delete:hover { color: var(--like-color); border-color: var(--like-color); }
.comments h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 1rem; color: var(--text-primary); }
.comment-form { margin-bottom: 1rem; }
.comment-form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.2s ease;
}
.comment-form textarea:focus { outline: none; border-color: var(--accent-primary); }
.btn-primary { background: var(--accent-primary); color: white; border: 2px solid var(--accent-primary); }
.btn-primary:hover:not(:disabled) { background: var(--accent-burgundy); border-color: var(--accent-burgundy); }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.9375rem; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; }
.comment-list { display: flex; flex-direction: column; gap: 0.75rem; }
.comment { display: flex; gap: 0.75rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--border-light); }
.comment-avatar-link { flex-shrink: 0; }
.comment-avatar, .comment-avatar-placeholder {
  width: 36px; height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: block;
  line-height: 36px;
  font-size: 0.875rem;
  text-align: center;
  color: white;
  font-weight: 600;
}
.comment-content { flex: 1; min-width: 0; }
.comment-author { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
.comment-body { margin: 0.25rem 0 0; font-size: 0.9375rem; color: var(--text-secondary); }
.comment-reply-btn { margin-top: 0.25rem; padding: 0; background: none; border: none; font-size: 0.8125rem; color: var(--accent-primary); cursor: pointer; }
.comment-reply-btn:hover { text-decoration: underline; }
.comment-reply-form { margin-left: 2.5rem; }
.comment-reply-form textarea {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
  font-family: inherit;
}
.comment-reply-form .btn-ghost {
  margin-left: 0.5rem;
  background: transparent;
  border: 2px solid var(--border-medium);
  color: var(--text-secondary);
  font-family: inherit;
}
.comment-reply-form .btn-ghost:hover { background: var(--bg-primary); color: var(--text-primary); }
.comment-replies { margin-left: 2.5rem; margin-top: 0.5rem; }
.comment-reply .comment-avatar-link { width: 28px; height: 28px; }
.comment-reply .comment-avatar, .comment-reply .comment-avatar-placeholder { width: 28px; height: 28px; font-size: 0.75rem; line-height: 28px; }
.comment-reply .comment-author, .comment-reply .comment-body { font-size: 0.8125rem; }

@media (max-width: 768px) {
  .post-meta { flex-wrap: wrap; gap: 0.5rem; font-size: 0.8125rem; }
  .post-actions {
    gap: 0.375rem;
    padding-top: 1rem;
    margin-top: 1.25rem;
  }
  .action {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    gap: 0.375rem;
  }
  .action .pi { font-size: 1rem; }
  .comments h2 { font-size: 1.125rem; }
  .comment-form textarea { padding: 0.625rem; font-size: 0.875rem; }
}
@media (max-width: 480px) {
  .post-actions {
    gap: 0.25rem;
    padding-top: 0.75rem;
    margin-top: 1rem;
  }
  .action {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.25rem;
  }
  .action .pi { font-size: 0.9375rem; }
  .comment-reply-form { margin-left: 1rem; }
  .comment-replies { margin-left: 1rem; }
}
</style>
