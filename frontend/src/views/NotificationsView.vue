<template>
  <div class="notifications-page">
    <h1>Notifications</h1>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="notifications.length === 0" class="empty">No notifications yet.</div>
    <ul v-else class="notification-list">
      <li
        v-for="n in notifications"
        :key="notifId(n)"
        class="notification-item"
        :class="{ unread: !n.readAt }"
      >
        <!-- Series invite: interactive card with action buttons -->
        <div v-if="n.type === 'SERIES_INVITE'" class="notification-row">
          <div class="notif-avatar-wrap">
            <AvatarFrame :frame="n.actor?.avatarFrame ?? null" :shape-class="avatarShapeClass(n.actor?.avatarShape)" :badge-url="actorBadgeUrl(n.actor)">
              <img v-if="notifAvatarUrl(n)" :src="notifAvatarUrl(n)" alt="" class="notif-avatar" :class="avatarShapeClass(n.actor?.avatarShape)" />
              <span v-else class="notif-avatar-placeholder" :class="avatarShapeClass(n.actor?.avatarShape)">{{ (n.actor?.displayName || n.actor?.username || '?')[0] }}</span>
            </AvatarFrame>
          </div>
          <div class="notif-body">
            <span class="notif-text">{{ notificationText(n) }}</span>
            <span class="notif-date">{{ formatDate(n.createdAt) }}</span>
            <!-- Action buttons / result badge -->
            <!-- Series invite actions -->
            <div v-if="!n._inviteResult" class="invite-actions">
              <button type="button" class="invite-btn invite-btn--accept" :disabled="!!n._inviteLoading" @click.stop="handleInviteAction(n, 'accept')">
                <i class="pi pi-check"></i> Accept
              </button>
              <button type="button" class="invite-btn invite-btn--reject" :disabled="!!n._inviteLoading" @click.stop="handleInviteAction(n, 'reject')">
                <i class="pi pi-times"></i> Decline
              </button>
            </div>
            <span v-else-if="n._inviteResult === 'accepted'" class="invite-result invite-result--accepted">
              <i class="pi pi-check-circle"></i> You accepted the invitation to join {{ n.series?.name ?? 'the series' }}
            </span>
            <span v-else-if="n._inviteResult" class="invite-result invite-result--rejected">
              <i class="pi pi-times-circle"></i> You declined the invitation to join {{ n.series?.name ?? 'the series' }}
            </span>
          </div>
        </div>

        <!-- All other notifications: standard link row -->
        <router-link
          v-else
          :to="notificationLink(n)"
          class="notification-link"
          @click="markRead(notifId(n))"
        >
          <div class="notif-avatar-wrap">
            <AvatarFrame :frame="n.actor?.avatarFrame ?? null" :shape-class="avatarShapeClass(n.actor?.avatarShape)" :badge-url="actorBadgeUrl(n.actor)">
              <img v-if="notifAvatarUrl(n)" :src="notifAvatarUrl(n)" alt="" class="notif-avatar" :class="avatarShapeClass(n.actor?.avatarShape)" />
              <span v-else class="notif-avatar-placeholder" :class="avatarShapeClass(n.actor?.avatarShape)">{{ (n.actor?.displayName || n.actor?.username || '?')[0] }}</span>
            </AvatarFrame>
          </div>
          <div class="notif-body">
            <span class="notif-text">{{ notificationText(n) }}</span>
            <span class="notif-date">{{ formatDate(n.createdAt) }}</span>
          </div>
        </router-link>
      </li>
    </ul>
    <button v-if="notifications.length > 0" type="button" class="btn btn-sm mark-all" @click="markAllRead">Mark all as read</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, avatarSrc } from '@/api/client'
import { avatarShapeClass } from '@/utils/avatar'
import { getAnonAvatarUrl } from '@/utils/anonAvatar'
import AvatarFrame from '@/components/AvatarFrame.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

const auth = useAuthStore()

type NotifRecord = Record<string, unknown> & {
  id?: string
  type?: string
  readAt?: string | null
  createdAt?: string
  actor?: { id?: string; displayName?: string; username?: string; avatarUrl?: string | null; avatarShape?: string | null; avatarFrame?: unknown; badgeUrl?: string | null }
  postId?: string
  commentId?: string
  isAnonymousActor?: boolean
  series?: { id?: string; name?: string; slug?: string } | null
  inviteToken?: string | null
  _inviteLoading?: boolean
  _inviteResult?: 'accepted' | 'rejected'
}

const notifications = ref<NotifRecord[]>([])
const loading = ref(true)
const notificationsStore = useNotificationsStore()

onMounted(async () => {
  try {
    const { data } = await api.get('/notifications')
    notifications.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
})

function actorBadgeUrl(actor: NotifRecord['actor']): string | null {
  return (actor as { badgeUrl?: string } | null)?.badgeUrl ?? null
}

function actorAvatarSrc(actor: NotifRecord['actor']) {
  if (!actor?.avatarUrl) return ''
  const id = (actor as { id?: string }).id
  return avatarSrc(actor.avatarUrl, id === auth.user?.id ? auth.avatarVersion : undefined)
}

function notifAvatarUrl(n: NotifRecord): string {
  if (n.isAnonymousActor && n.postId) return getAnonAvatarUrl(String(n.postId))
  return actorAvatarSrc(n.actor)
}

function notifId(n: NotifRecord) {
  return String(n.id ?? '')
}

function actorName(n: NotifRecord): string {
  return (n.actor as { displayName?: string })?.displayName
    || (n.actor as { username?: string })?.username
    || 'Someone'
}

function notificationText(n: NotifRecord) {
  const actor = actorName(n)
  const series = n.series?.name ?? 'a series'
  switch (n.type) {
    case 'LIKE':               return `${actor} liked your post`
    case 'COMMENT':            return `${actor} commented on your post`
    case 'COMMENT_REPLY':      return `${actor} replied to your comment`
    case 'FOLLOW':             return `${actor} started following you`
    case 'FOLLOW_REQUEST':     return `${actor} requested to follow you`
    case 'MENTION':            return n.commentId ? `${actor} mentioned you in a comment` : `${actor} mentioned you in a post`
    case 'SERIES_INVITE':           return `${actor} invited you to join ${series}`
    case 'SERIES_INVITE_ACCEPTED':  return n.inviteToken
      ? `You accepted the invitation to join ${series}`
      : `${actor} accepted your invite to join ${series}`
    case 'SERIES_INVITE_REJECTED':  return n.inviteToken
      ? `You declined the invitation to join ${series}`
      : `${actor} declined your invite to join ${series}`
    case 'SERIES_POST_SUBMITTED':   return `${actor} submitted "${(n as any).post?.title ?? 'a post'}" to ${series} for review`
    case 'SERIES_POST_APPROVED':    return `Your post "${(n as any).post?.title ?? 'Post'}" was approved in ${series}`
    case 'SERIES_POST_REJECTED':    return `Your post "${(n as any).post?.title ?? 'Post'}" was not approved for ${series}`
    case 'SERIES_FOLLOW':           return `${actor} followed your series ${series}`
    default:                        return `${actor} notified you`
  }
}

function notificationLink(n: NotifRecord) {
  if (n.type === 'FOLLOW_REQUEST') return '/follow-requests'
  if (n.type === 'SERIES_POST_SUBMITTED') {
    return n.series?.slug ? `/series/${n.series.slug}/settings?tab=posts` : '/feed'
  }
  if (n.type === 'SERIES_INVITE_ACCEPTED' || n.type === 'SERIES_INVITE_REJECTED' || n.type === 'SERIES_POST_REJECTED') {
    return n.series?.slug ? `/series/${n.series.slug}` : '/feed'
  }
  if (n.type === 'SERIES_POST_APPROVED') {
    return (n as any).post?.id ? `/posts/${(n as any).post.id}` : (n.series?.slug ? `/series/${n.series.slug}` : '/feed')
  }
  const postId = n.postId as string | undefined
  if (postId) return `/posts/${postId}`
  if (n.isAnonymousActor) return '/feed'
  const username = n.actor?.username
  if (username) return `/u/${username}`
  return '/feed'
}

async function handleInviteAction(n: NotifRecord, action: 'accept' | 'reject') {
  const token = n.inviteToken
  if (!token) return
  n._inviteLoading = true
  try {
    await api.post(`/series/invites/${token}/${action}`, {}, { cache: false })
    n._inviteResult = action === 'accept' ? 'accepted' : 'rejected'
    await markRead(notifId(n))
  } catch {
    // silently restore
  } finally {
    n._inviteLoading = false
  }
}


function formatDate(s: string | undefined) {
  if (s == null || typeof s !== 'string') return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

async function markRead(id: string) {
  try {
    await api.post(`/notifications/${id}/read`)
    const idx = notifications.value.findIndex((n) => notifId(n) === id)
    if (idx >= 0) notifications.value[idx].readAt = new Date().toISOString()
    await notificationsStore.fetchUnreadCount()
  } catch {
    // ignore
  }
}

async function markAllRead() {
  await notificationsStore.markAllRead()
  notifications.value = notifications.value.map((n) => ({ ...n, readAt: new Date().toISOString() }))
}
</script>

<style scoped>
.notifications-page { padding: 0; max-width: 640px; margin: 0 auto; width: 100%; }
.notifications-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 1rem; }
.loading, .empty { color: var(--gray-700); padding: 1rem 0; }
.notification-list { list-style: none; margin: 0; padding: 0; }
.notification-item { border-bottom: 1px solid var(--gray-100); }
.notification-item.unread { background: var(--gray-50); }

/* Shared row layout for both link and invite rows */
.notification-link,
.notification-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  color: inherit;
  text-decoration: none;
}
.notification-link:hover { background: var(--gray-50); }
.notification-row { cursor: default; }

.notif-avatar-wrap {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  position: relative;
}
.notif-avatar-wrap :deep(.avatar-frame-root),
.notif-avatar-wrap :deep(.avatar-frame) {
  width: 100%;
  height: 100%;
  max-width: 40px;
  max-height: 40px;
  min-width: 0;
  min-height: 0;
}
.notif-avatar-wrap :deep(.avatar-frame > *) {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
}
.notif-avatar, .notif-avatar-placeholder { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: var(--gray-200); display: block; line-height: 40px; text-align: center; font-size: 1rem; box-sizing: border-box; }
.notif-avatar.avatar-shape-rounded, .notif-avatar-placeholder.avatar-shape-rounded { border-radius: 12%; }
.notif-avatar.avatar-shape-square, .notif-avatar-placeholder.avatar-shape-square { border-radius: 0; }
.notif-avatar.avatar-shape-squircle, .notif-avatar-placeholder.avatar-shape-squircle { border-radius: 25%; }

.notif-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.notif-text { font-size: 0.9375rem; }
.notif-date { font-size: 0.8125rem; color: var(--gray-600); margin-top: 0.25rem; }

/* ─── Invite action buttons ─── */
.invite-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.875rem;
  border-radius: var(--radius, 8px);
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, background 0.15s;
}
.invite-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.invite-btn--accept {
  background: var(--accent-primary, #6366f1);
  color: #fff;
}
.invite-btn--accept:hover:not(:disabled) { opacity: 0.88; }

.invite-btn--reject {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}
.invite-btn--reject:hover:not(:disabled) { background: var(--gray-100); color: var(--text-primary); }

.invite-result {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
}
.invite-result--accepted { color: #17bf63; }
.invite-result--rejected { color: var(--text-tertiary); }

.mark-all { margin-top: 1rem; padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: var(--radius); border: 1px solid var(--gray-300); background: #fff; cursor: pointer; }
.mark-all:hover { background: var(--gray-100); }

@media (max-width: 480px) {
  .notification-link, .notification-row { padding: 0.625rem; gap: 0.5rem; }
  .notif-avatar-wrap { width: 36px; height: 36px; }
  .notif-avatar-wrap :deep(.avatar-frame-root),
  .notif-avatar-wrap :deep(.avatar-frame) { max-width: 36px; max-height: 36px; }
  .notif-avatar, .notif-avatar-placeholder { line-height: 36px; font-size: 0.875rem; }
  .notif-text { font-size: 0.875rem; }
}
</style>
