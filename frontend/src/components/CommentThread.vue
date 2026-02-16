<template>
  <div class="comment-thread" :class="{ 'comment-reply': depth > 0 }">
    <div class="comment">
      <router-link :to="`/u/${comment.author?.username}`" class="comment-avatar-link">
        <AvatarFrame :frame="comment.author?.avatarFrame ?? null" :shape-class="avatarShapeClass(comment.author?.avatarShape)" :badge-url="comment.author?.badgeUrl ?? null">
          <img v-if="comment.author?.avatarUrl" :src="avatarSrc(comment.author.avatarUrl, comment.author?.id)" alt="" class="comment-avatar" :class="avatarShapeClass(comment.author?.avatarShape)" />
          <span v-else class="comment-avatar-placeholder" :class="avatarShapeClass(comment.author?.avatarShape)">{{ (comment.author?.displayName || comment.author?.username || '?')[0] }}</span>
        </AvatarFrame>
      </router-link>
      <div class="comment-content">
        <span class="comment-meta">
          <router-link :to="`/u/${comment.author?.username}`" class="comment-author">{{ comment.author?.displayName || comment.author?.username }}</router-link>
          <time v-if="comment.createdAt" :datetime="comment.createdAt" class="comment-time">{{ formatCommentDate(comment.createdAt) }}</time>
          <span v-if="comment.editedAt" class="comment-edited">(Edited)</span>
        </span>
        <p v-if="!editing" class="comment-body">{{ comment.content }}</p>
        <div v-else class="comment-edit-wrap">
          <textarea v-model="editContent" class="comment-edit-textarea" rows="3" placeholder="Edit your comment…"></textarea>
          <div class="comment-edit-actions">
            <button type="button" class="btn-reply btn-reply-primary" @click="saveEdit">Save</button>
            <button type="button" class="btn-reply btn-reply-ghost" @click="editing = false; editContent = comment.content">Cancel</button>
          </div>
        </div>
        <span v-if="isLoggedIn && !editing" class="comment-reactions">
          <button
            type="button"
            class="comment-react-btn"
            :class="{ active: comment.myReaction === 'LIKE' }"
            :aria-pressed="comment.myReaction === 'LIKE'"
            @click="$emit('like', comment.id)"
          >
            <i class="pi pi-thumbs-up" aria-hidden="true"></i>
            {{ comment.likeCount ?? 0 }}
          </button>
          <button
            type="button"
            class="comment-react-btn"
            :class="{ active: comment.myReaction === 'DISLIKE' }"
            :aria-pressed="comment.myReaction === 'DISLIKE'"
            @click="$emit('dislike', comment.id)"
          >
            <i class="pi pi-thumbs-down" aria-hidden="true"></i>
            {{ comment.dislikeCount ?? 0 }}
          </button>
        </span>
        <span class="comment-actions">
          <button v-if="isLoggedIn && !editing" type="button" class="comment-reply-btn" @click="$emit('reply', comment.id)">Reply</button>
          <button v-if="canEdit && !editing" type="button" class="comment-edit-btn" @click="startEdit">Edit</button>
          <button v-if="canDelete && !editing" type="button" class="comment-delete-btn" @click="$emit('delete', comment.id)">Delete</button>
        </span>
      </div>
    </div>
    <div v-if="replyToId === comment.id && isLoggedIn" class="reply-form-wrap" :class="{ 'reply-form-in-thread': depth > 0 }">
      <div class="reply-form">
        <textarea
          :value="replyContent"
          placeholder="Write a reply…"
          rows="3"
          class="reply-textarea"
          @input="onReplyContentInput($event)"
        ></textarea>
        <div class="reply-form-actions">
          <button type="button" class="btn-reply btn-reply-primary" @click="$emit('submitReply', comment.id)">Reply</button>
          <button type="button" class="btn-reply btn-reply-ghost" @click="$emit('cancelReply')">Cancel</button>
        </div>
      </div>
    </div>
    <div v-if="comment.replies?.length" class="comment-replies">
      <CommentThread
        v-for="r in comment.replies"
        :key="r.id"
        :comment="r"
        :depth="depth + 1"
        :reply-to-id="replyToId"
        :reply-content="replyContent"
        :is-logged-in="isLoggedIn"
        :can-delete-fn="canDeleteFn"
        :can-edit-fn="canEditFn"
        :avatar-src="avatarSrc"
        @reply="$emit('reply', $event)"
        @update:reply-content="$emit('update:replyContent', $event)"
        @submit-reply="$emit('submitReply', $event)"
        @cancel-reply="$emit('cancelReply')"
        @like="$emit('like', $event)"
        @dislike="$emit('dislike', $event)"
        @update-comment="$emit('updateComment', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { avatarShapeClass } from '@/utils/avatar'
import AvatarFrame from '@/components/AvatarFrame.vue'
defineOptions({ name: 'CommentThread' })

export type CommentNode = {
  id: string
  content: string
  createdAt?: string
  editedAt?: string | null
  author?: { id?: string; username?: string; displayName?: string | null; avatarUrl?: string | null; avatarShape?: string | null; avatarFrame?: unknown; badgeUrl?: string | null }
  replies?: CommentNode[]
  likeCount?: number
  dislikeCount?: number
  myReaction?: 'LIKE' | 'DISLIKE' | null
}

function formatCommentDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  }).replace(/\s+/g, ' ')
}

const props = defineProps<{
  comment: CommentNode
  depth: number
  replyToId: string | null
  replyContent: string
  isLoggedIn: boolean
  canDeleteFn?: (c: CommentNode) => boolean
  canEditFn?: (c: CommentNode) => boolean
  avatarSrc: (url: string | null | undefined, userId?: string) => string
}>()

const canDelete = computed(() => (props.canDeleteFn ? props.canDeleteFn(props.comment) : false))
const canEdit = computed(() => (props.canEditFn ? props.canEditFn(props.comment) : false))

const editing = ref(false)
const editContent = ref(props.comment.content)

function startEdit() {
  editing.value = true
  editContent.value = props.comment.content
}
function saveEdit() {
  const trimmed = editContent.value.trim()
  if (!trimmed) return
  emit('updateComment', { id: props.comment.id, content: trimmed })
  editing.value = false
}

const emit = defineEmits<{
  reply: [id: string]
  'update:replyContent': [value: string]
  submitReply: [parentId: string]
  cancelReply: []
  like: [commentId: string]
  dislike: [commentId: string]
  updateComment: [payload: { id: string; content: string }]
  delete: [commentId: string]
}>()

function onReplyContentInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:replyContent', target?.value ?? '')
}
</script>

<style scoped>
.comment-thread {
  margin-bottom: 0.5rem;
  position: relative;
}
.comment-thread.comment-reply {
  margin-left: clamp(1rem, 4vw, 1.5rem);
  padding-left: 0;
}
/* Curved connector from vertical line to this reply */
.comment-thread.comment-reply::before {
  content: '';
  position: absolute;
  left: -2.5rem; /* back to vertical line (padding-left 1rem + margin-left 1.5rem) */
  top: 0.875rem; /* align with avatar vertical center (28px / 2) */
  width: 2.5rem;
  height: 2px;
  background: var(--border-medium);
  border-radius: 0 0 0 10px;
  pointer-events: none;
}
.comment {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}
.comment-avatar-link {
  flex-shrink: 0;
  display: block;
  width: 36px;
  height: 36px;
  overflow: hidden;
}
.comment-avatar-link :deep(.avatar-frame-root),
.comment-avatar-link :deep(.avatar-frame) {
  width: 100%;
  height: 100%;
  max-width: 36px;
  max-height: 36px;
  min-width: 0;
  min-height: 0;
}
.comment-avatar-link :deep(.avatar-frame > *) {
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  display: block;
}
.comment-avatar,
.comment-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: block;
  box-sizing: border-box;
}
.comment-avatar.avatar-shape-rounded, .comment-avatar-placeholder.avatar-shape-rounded { border-radius: 12%; }
.comment-avatar.avatar-shape-square, .comment-avatar-placeholder.avatar-shape-square { border-radius: 0; }
.comment-avatar.avatar-shape-squircle, .comment-avatar-placeholder.avatar-shape-squircle { border-radius: 25%; }
.comment-avatar-placeholder {
  line-height: 36px;
  font-size: 0.875rem;
  text-align: center;
  color: white;
  font-weight: 600;
}
.comment-reply .comment-avatar-link {
  width: 28px;
  height: 28px;
}
.comment-reply .comment-avatar-link :deep(.avatar-frame-root),
.comment-reply .comment-avatar-link :deep(.avatar-frame) {
  max-width: 28px;
  max-height: 28px;
}
.comment-reply .comment-avatar,
.comment-reply .comment-avatar-placeholder { width: 28px; height: 28px; font-size: 0.75rem; line-height: 28px; }
.comment-content { flex: 1; min-width: 0; }
.comment-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.comment-author { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
.comment-reply .comment-author { font-size: 0.8125rem; }
.comment-time {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  font-weight: 400;
}
.comment-reply .comment-time { font-size: 0.75rem; }
.comment-edited {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-style: italic;
}
.comment-body { margin: 0.25rem 0 0; font-size: 0.9375rem; color: var(--text-secondary); }
.comment-reply .comment-body { font-size: 0.8125rem; }
.comment-reactions {
  display: inline-flex;
  gap: 0.25rem;
  margin-right: 0.5rem;
}
.comment-react-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.8125rem;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-tertiary);
  font-family: inherit;
}
.comment-react-btn:hover { color: var(--text-primary); background: var(--bg-card); }
.comment-react-btn.active { color: var(--accent-primary); }
.comment-edit-wrap {
  margin-top: 0.5rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}
.comment-edit-textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9375rem;
  font-family: inherit;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  resize: vertical;
  min-height: 4.5rem;
  margin-bottom: 0.75rem;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}
.comment-edit-textarea::placeholder { color: var(--text-tertiary); }
.comment-edit-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.comment-edit-actions { display: flex; gap: 0.5rem; align-items: center; }
.comment-actions { margin-top: 0.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.comment-reply-btn,
.comment-edit-btn,
.comment-delete-btn {
  padding: 0;
  background: none;
  border: none;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.comment-reply-btn { color: var(--accent-primary); }
.comment-reply-btn:hover { text-decoration: underline; }
.comment-edit-btn { color: var(--text-tertiary); }
.comment-edit-btn:hover { color: var(--accent-primary); text-decoration: underline; }
.comment-delete-btn { color: var(--text-tertiary); }
.comment-delete-btn:hover { color: var(--like-color); text-decoration: underline; }

.reply-form-wrap {
  margin-top: 0.5rem;
  margin-left: 2.5rem; /* align with comment content (avatar + gap) */
}
.reply-form-wrap.reply-form-in-thread { margin-left: 0; }
.comment-replies {
  position: relative;
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  padding-left: 1rem;
  border-left: 2px solid var(--border-medium);
}
.reply-form {
  background: var(--bg-primary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}
.reply-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-family: inherit;
  margin-bottom: 0.75rem;
  resize: vertical;
  min-height: 4.5rem;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}
.reply-textarea::placeholder { color: var(--text-tertiary); }
.reply-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.reply-form-actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-reply {
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}
.btn-reply-primary {
  background: var(--accent-primary);
  color: white;
  border: 2px solid var(--accent-primary);
}
.btn-reply-primary:hover:not(:disabled) {
  background: var(--accent-burgundy);
  border-color: var(--accent-burgundy);
}
.btn-reply-ghost {
  background: transparent;
  border: 2px solid var(--border-medium);
  color: var(--text-secondary);
}
.btn-reply-ghost:hover {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-medium);
}

@media (max-width: 480px) {
  .comment { padding: 0.625rem; gap: 0.5rem; }
  .comment-avatar-link { width: 32px; height: 32px; }
  .comment-avatar-link :deep(.avatar-frame-root),
  .comment-avatar-link :deep(.avatar-frame) { max-width: 32px; max-height: 32px; }
  .comment-avatar, .comment-avatar-placeholder { width: 32px; height: 32px; font-size: 0.8125rem; line-height: 32px; }
  .comment-reply .comment-avatar-link { width: 24px; height: 24px; }
  .comment-reply .comment-avatar-link :deep(.avatar-frame-root),
  .comment-reply .comment-avatar-link :deep(.avatar-frame) { max-width: 24px; max-height: 24px; }
  .comment-reply .comment-avatar, .comment-reply .comment-avatar-placeholder { width: 24px; height: 24px; font-size: 0.6875rem; line-height: 24px; }
  .comment-body, .comment-reply .comment-body { font-size: 0.875rem; }
  .reply-form-wrap { margin-left: 1rem; }
  .comment-replies { margin-left: 1rem; padding-left: 0.5rem; }
}
</style>
