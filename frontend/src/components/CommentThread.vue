<template>
  <div class="comment-thread" :class="{ 'comment-reply': depth > 0 }" :style="{ marginLeft: depth > 0 ? '2rem' : 0 }">
    <div class="comment">
      <router-link :to="`/u/${comment.author?.username}`" class="comment-avatar-link">
        <img v-if="comment.author?.avatarUrl" :src="avatarSrc(comment.author.avatarUrl)" alt="" class="comment-avatar" />
        <span v-else class="comment-avatar-placeholder">{{ (comment.author?.displayName || comment.author?.username || '?')[0] }}</span>
      </router-link>
      <div class="comment-content">
        <router-link :to="`/u/${comment.author?.username}`" class="comment-author">{{ comment.author?.displayName || comment.author?.username }}</router-link>
        <p class="comment-body">{{ comment.content }}</p>
        <button v-if="isLoggedIn" type="button" class="comment-reply-btn" @click="$emit('reply', comment.id)">Reply</button>
      </div>
    </div>
    <div v-if="replyToId === comment.id && isLoggedIn" class="comment comment-reply-form">
      <div class="comment-content">
        <textarea :value="replyContent" placeholder="Write a reply…" rows="2" @input="$emit('update:replyContent', ($event.target as HTMLTextAreaElement).value)"></textarea>
        <button type="button" class="btn btn-primary btn-sm" @click="$emit('submitReply', comment.id)">Reply</button>
        <button type="button" class="btn btn-sm btn-ghost" @click="$emit('cancelReply')">Cancel</button>
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
  author?: { username?: string; displayName?: string | null; avatarUrl?: string | null }
  replies?: CommentNode[]
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
.comment-thread { margin-bottom: 0.5rem; }
.comment { display: flex; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); }
.comment-avatar-link { flex-shrink: 0; }
.comment-avatar, .comment-avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: var(--gray-200); display: block; line-height: 36px; font-size: 0.875rem; text-align: center; }
.comment-reply .comment-avatar, .comment-reply .comment-avatar-placeholder { width: 28px; height: 28px; font-size: 0.75rem; line-height: 28px; }
.comment-content { flex: 1; min-width: 0; }
.comment-author { font-weight: 500; font-size: 0.875rem; }
.comment-reply .comment-author { font-size: 0.8125rem; }
.comment-body { margin: 0.25rem 0 0; font-size: 0.9375rem; }
.comment-reply .comment-body { font-size: 0.8125rem; }
.comment-reply-btn { margin-top: 0.25rem; padding: 0; background: none; border: none; font-size: 0.8125rem; color: var(--primary); cursor: pointer; }
.comment-reply-form { margin-left: 2.5rem; }
.comment-reply-form textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius); margin-bottom: 0.5rem; font-size: 0.9375rem; }
.comment-reply-form .btn-ghost { margin-left: 0.5rem; background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
.comment-reply-form .btn-ghost:hover { background: var(--gray-100); }
.comment-replies { margin-top: 0.5rem; }
</style>
