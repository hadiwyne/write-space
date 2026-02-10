<template>
  <div class="comment-thread" :class="{ 'comment-reply': depth > 0 }">
    <div class="comment">
      <router-link :to="`/u/${comment.author?.username}`" class="comment-avatar-link">
        <img v-if="comment.author?.avatarUrl" :src="avatarSrc(comment.author.avatarUrl)" alt="" class="comment-avatar" />
        <span v-else class="comment-avatar-placeholder">{{ (comment.author?.displayName || comment.author?.username || '?')[0] }}</span>
      </router-link>
      <div class="comment-content">
        <span class="comment-meta">
          <router-link :to="`/u/${comment.author?.username}`" class="comment-author">{{ comment.author?.displayName || comment.author?.username }}</router-link>
          <time v-if="comment.createdAt" :datetime="comment.createdAt" class="comment-time">{{ formatCommentDate(comment.createdAt) }}</time>
        </span>
        <p class="comment-body">{{ comment.content }}</p>
        <button v-if="isLoggedIn" type="button" class="comment-reply-btn" @click="$emit('reply', comment.id)">Reply</button>
      </div>
    </div>
    <div v-if="replyToId === comment.id && isLoggedIn" class="reply-form-wrap" :class="{ 'reply-form-in-thread': depth > 0 }">
      <div class="reply-form">
        <textarea
          :value="replyContent"
          placeholder="Write a reply…"
          rows="3"
          class="reply-textarea"
          @input="$emit('update:replyContent', ($event.target as HTMLTextAreaElement).value)"
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
        :avatar-src="avatarSrc"
        @reply="$emit('reply', $event)"
        @update:reply-content="$emit('update:replyContent', $event)"
        @submit-reply="$emit('submitReply', $event)"
        @cancel-reply="$emit('cancelReply')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'CommentThread' })

export type CommentNode = {
  id: string
  content: string
  createdAt?: string
  author?: { username?: string; displayName?: string | null; avatarUrl?: string | null }
  replies?: CommentNode[]
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

defineProps<{
  comment: CommentNode
  depth: number
  replyToId: string | null
  replyContent: string
  isLoggedIn: boolean
  avatarSrc: (url: string | null | undefined) => string
}>()

defineEmits<{
  reply: [id: string]
  'update:replyContent': [value: string]
  submitReply: [parentId: string]
  cancelReply: []
}>()
</script>

<style scoped>
.comment-thread {
  margin-bottom: 0.5rem;
  position: relative;
}
.comment-thread.comment-reply {
  margin-left: 1.5rem;
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
.comment-avatar-link { flex-shrink: 0; }
.comment-avatar,
.comment-avatar-placeholder {
  width: 36px;
  height: 36px;
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
.comment-body { margin: 0.25rem 0 0; font-size: 0.9375rem; color: var(--text-secondary); }
.comment-reply .comment-body { font-size: 0.8125rem; }
.comment-reply-btn {
  margin-top: 0.25rem;
  padding: 0;
  background: none;
  border: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--accent-primary);
  cursor: pointer;
  font-family: inherit;
}
.comment-reply-btn:hover { text-decoration: underline; }

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
</style>
