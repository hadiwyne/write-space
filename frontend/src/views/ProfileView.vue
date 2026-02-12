<template>
  <div class="profile-page">
    <div v-if="loading" class="loading">Loading…</div>
    <template v-else-if="profile">
      <div class="profile-header">
        <div class="profile-avatar-wrap">
          <img v-if="profile.avatarUrl" :src="avatarSrc(profile.avatarUrl)" alt="" class="avatar" />
          <span v-else class="avatar-placeholder">{{ (profile.displayName || profile.username || '?')[0] }}</span>
        </div>
        <h1>{{ profile.displayName || profile.username }}</h1>
        <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
        <div v-if="profile.profileHTML" class="profile-html" v-html="profile.profileHTML"></div>
        <div class="profile-stats">
          <button type="button" class="stat-item" @click="scrollToPosts">
            <span class="stat-value">{{ totalPosts }}</span>
            <span class="stat-label">Posts</span>
          </button>
          <button type="button" class="stat-item" @click="openModal('followers')">
            <span class="stat-value">{{ profile._count?.followers ?? 0 }}</span>
            <span class="stat-label">Followers</span>
          </button>
          <button type="button" class="stat-item" @click="openModal('following')">
            <span class="stat-value">{{ profile._count?.following ?? 0 }}</span>
            <span class="stat-label">Following</span>
          </button>
        </div>
        <template v-if="isOwnProfile">
          <div class="profile-actions">
            <router-link to="/settings" class="edit-link">Edit profile</router-link>
            <router-link to="/archived" class="edit-link archived-link">Archived</router-link>
          </div>
        </template>
        <template v-else-if="auth.isLoggedIn">
          <button
            type="button"
            class="btn btn-follow"
            :class="{ 'btn-following': isFollowing }"
            :disabled="followLoading"
            @click="toggleFollow"
          >
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>
        </template>
      </div>
      <div id="posts-section" class="posts-section">
        <div ref="profileTabsRef" class="profile-tabs">
          <div
            class="profile-tabs-indicator"
            :style="tabIndicatorStyle"
            aria-hidden="true"
          />
          <button type="button" class="profile-tab" :class="{ active: profileTab === 'posts' }" @click="profileTab = 'posts'">
            Posts {{ totalPosts }}
          </button>
          <button
            v-if="isOwnProfile"
            type="button"
            class="profile-tab"
            :class="{ active: profileTab === 'liked' }"
            @click="switchToLiked"
          >
            Liked {{ profile._count?.likes ?? 0 }}
          </button>
        </div>
        <div v-if="profileTab === 'posts'">
          <div v-if="combinedFeed.length === 0" class="empty">No posts yet.</div>
          <div v-else class="post-list">
            <div
              v-for="(item, i) in combinedFeed"
              :key="feedItemKey(item)"
              class="feed-item-wrap"
            >
              <RepostCard
                v-if="item.type === 'repost'"
                :post="item.post"
                :reposted-at="item.repostedAt"
                :reposter-name="profile?.displayName || profile?.username || 'User'"
                :show-repost="!!auth.token"
                :reposted="!!isOwnProfile"
                @like="handleLike"
              />
              <PostCard
                v-else
                :post="item.post"
                :show-actions="!!isOwnProfile || !!auth.user?.isSuperadmin"
                :style="{ animationDelay: `${0.05 * i}s` }"
                @archive="archivePostFromList"
                @delete="deletePostFromList"
                @like="handleLike"
              />
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="likedLoading" class="empty">Loading…</div>
          <div v-else-if="likedPosts.length === 0" class="empty">No liked posts yet.</div>
          <div v-else class="post-list">
            <PostCard
              v-for="(p, i) in likedPosts"
              :key="p.id"
              :post="p"
              :show-repost="!!auth.token"
              :style="{ animationDelay: `${0.05 * i}s` }"
              @like="handleLike"
            />
          </div>
        </div>
      </div>
    </template>
    <div v-else class="error">User not found</div>

    <!-- Followers / Following modal -->
    <Teleport to="body">
      <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ modalMode === 'followers' ? 'Followers' : 'Following' }}</h2>
            <button type="button" class="modal-close" aria-label="Close" @click="modalOpen = false">×</button>
          </div>
          <div class="modal-body">
            <div v-if="modalLoading" class="modal-loading">Loading…</div>
            <div v-else-if="modalList.length === 0" class="modal-empty">No one yet.</div>
            <ul v-else class="modal-list">
              <li v-for="u in modalList" :key="u.id" class="modal-list-item">
                <router-link :to="`/u/${u.username}`" class="modal-user" @click="modalOpen = false">
                  <img v-if="u.avatarUrl" :src="avatarSrc(u.avatarUrl)" alt="" class="modal-avatar" />
                  <span v-else class="modal-avatar-placeholder">{{ (u.displayName || u.username || '?')[0] }}</span>
                  <span class="modal-user-name">{{ u.displayName || u.username }}</span>
                  <span class="modal-user-handle">@{{ u.username }}</span>
                </router-link>
                <template v-if="isOwnProfile">
                  <button
                    v-if="modalMode === 'followers'"
                    type="button"
                    class="btn-modal btn-remove"
                    :disabled="modalActionLoading === u.id"
                    @click.stop="removeFollower(u.id)"
                  >
                    Remove
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn-modal btn-unfollow"
                    :disabled="modalActionLoading === u.id"
                    @click.stop="unfollowUser(u.username)"
                  >
                    Unfollow
                  </button>
                </template>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>

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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { api, avatarSrc } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import PostCard from '@/components/PostCard.vue'
import RepostCard from '@/components/RepostCard.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const route = useRoute()
const auth = useAuthStore()
const profile = ref<{
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  profileHTML?: string | null
  _count?: { posts: number; followers: number; following: number; reposts?: number; likes?: number }
} | null>(null)
const posts = ref<Record<string, unknown>[]>([])
const reposts = ref<Record<string, unknown>[]>([])
const likedPosts = ref<{ id: string; [key: string]: unknown }[]>([])
const likedLoading = ref(false)
const profileTab = ref<'posts' | 'liked'>('posts')
const profileTabsRef = ref<HTMLElement | null>(null)
const tabIndicatorStyle = ref<{ left: string; width: string }>({ left: '0px', width: '0px' })

function updateProfileTabIndicator() {
  const measure = () => {
    const container = profileTabsRef.value
    if (!container) return
    const tabs = container.querySelectorAll<HTMLButtonElement>('.profile-tab')
    const index = profileTab.value === 'posts' ? 0 : 1
    const active = tabs[index]
    if (!active) return
    tabIndicatorStyle.value = {
      left: `${active.offsetLeft}px`,
      width: `${active.offsetWidth}px`,
    }
  }
  nextTick(() => requestAnimationFrame(measure))
}

type FeedItem = { type: 'post'; post: Record<string, unknown> } | { type: 'repost'; post: Record<string, unknown>; repostedAt: string }

function feedItemKey(item: FeedItem) {
  const id = (item.post as { id?: string }).id
  return item.type === 'repost' ? `r-${id ?? ''}` : String(id ?? '')
}

const combinedFeed = computed<FeedItem[]>(() => {
  const repostItems: FeedItem[] = (reposts.value as { repostedAt?: string }[]).map((r) => ({
    type: 'repost' as const,
    post: r as Record<string, unknown>,
    repostedAt: r.repostedAt || new Date().toISOString(),
  }))
  const postItems: FeedItem[] = (posts.value as Record<string, unknown>[]).map((p) => ({ type: 'post' as const, post: p }))
  const merged = [...postItems, ...repostItems]
  merged.sort((a, b) => {
    const dateA = a.type === 'repost' ? new Date(a.repostedAt).getTime() : new Date((a.post.publishedAt || a.post.createdAt) as string).getTime()
    const dateB = b.type === 'repost' ? new Date(b.repostedAt).getTime() : new Date((b.post.publishedAt || b.post.createdAt) as string).getTime()
    return dateB - dateA
  })
  return merged
})
const loading = ref(true)
const isFollowing = ref(false)
const followLoading = ref(false)
const modalOpen = ref(false)
const modalMode = ref<'followers' | 'following'>('followers')
const modalList = ref<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }[]>([])
const modalLoading = ref(false)
const modalActionLoading = ref<string | null>(null)
const confirmOpen = ref(false)
const confirmType = ref<'archive' | 'delete' | null>(null)
const confirmPostId = ref<string | null>(null)
const confirmTitle = computed(() =>
  confirmType.value === 'delete' ? 'Delete post?' : 'Archive post?'
)
const confirmMessage = computed(() =>
  confirmType.value === 'delete'
    ? 'Permanently delete this post? This cannot be undone.'
    : 'Archive this post? It will be hidden from the feed and your profile. You can restore it later.'
)
const isOwnProfile = computed(() => auth.user && profile.value && auth.user.username === profile.value.username)
const totalPosts = computed(() => {
  const p = profile.value?._count
  const postsCount = p?.posts ?? 0
  const repostsCount = p?.reposts ?? 0
  return postsCount + repostsCount
})

async function load() {
  const username = route.params.username as string
  profileTab.value = 'posts'
  loading.value = true
  isFollowing.value = false
  reposts.value = []
  likedPosts.value = []
  try {
    const [profileRes, postsRes, repostsRes] = await Promise.all([
      api.get(`/users/${username}`),
      api.get(`/posts?author=${username}`).catch(() => ({ data: [] })),
      api.get(`/users/${username}/reposts`).catch(() => ({ data: [] })),
    ])
    profile.value = profileRes.data
    posts.value = Array.isArray(postsRes.data) ? postsRes.data : []
    reposts.value = Array.isArray(repostsRes.data) ? repostsRes.data : []
    if (Array.isArray(postsRes.data) && postsRes.data.length === 0 && username) {
      const fallback = await api.get('/feed').then((r) => r.data).catch(() => [])
      const byUser = fallback.filter((p: { author?: { username?: string } }) => p.author?.username === username)
      posts.value = byUser
    }
    if (auth.isLoggedIn && profile.value && auth.user?.username !== profile.value.username) {
      const statusRes = await api.get(`/users/${username}/follow/status`).catch(() => ({ data: { isFollowing: false } }))
      isFollowing.value = statusRes.data?.isFollowing ?? false
    }
  } catch {
    profile.value = null
    posts.value = []
    reposts.value = []
  } finally {
    loading.value = false
  }
}

async function toggleFollow() {
  const username = profile.value?.username
  if (!username || followLoading.value) return
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await api.delete(`/users/${username}/follow`)
      isFollowing.value = false
    } else {
      await api.post(`/users/${username}/follow`)
      isFollowing.value = true
    }
    if (profile.value?._count != null) {
      profile.value._count = {
        ...profile.value._count,
        followers: (profile.value._count.followers ?? 0) + (isFollowing.value ? 1 : -1),
      }
    }
  } finally {
    followLoading.value = false
  }
}

function scrollToPosts() {
  profileTab.value = 'posts'
  document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })
}

async function switchToLiked() {
  profileTab.value = 'liked'
  const username = profile.value?.username
  if (!username || likedPosts.value.length > 0) return
  likedLoading.value = true
  try {
    const { data } = await api.get(`/users/${username}/likes`)
    likedPosts.value = Array.isArray(data) ? data : []
  } catch {
    likedPosts.value = []
  } finally {
    likedLoading.value = false
  }
}

async function openModal(mode: 'followers' | 'following') {
  const username = profile.value?.username
  if (!username) return
  modalOpen.value = true
  modalMode.value = mode
  modalList.value = []
  modalLoading.value = true
  try {
    const path = mode === 'followers' ? `/users/${username}/followers` : `/users/${username}/following`
    const { data } = await api.get(path)
    modalList.value = data
  } finally {
    modalLoading.value = false
  }
}

async function removeFollower(userId: string) {
  modalActionLoading.value = userId
  try {
    await api.delete(`/users/me/followers/${userId}`)
    modalList.value = modalList.value.filter((u) => u.id !== userId)
    if (profile.value?._count != null)
      profile.value._count = { ...profile.value._count, followers: Math.max(0, (profile.value._count.followers ?? 0) - 1) }
  } finally {
    modalActionLoading.value = null
  }
}

async function unfollowUser(username: string) {
  const u = modalList.value.find((x) => x.username === username)
  if (!u) return
  modalActionLoading.value = u.id
  try {
    await api.delete(`/users/${username}/follow`)
    modalList.value = modalList.value.filter((x) => x.id !== u.id)
    if (profile.value?._count != null)
      profile.value._count = { ...profile.value._count, following: Math.max(0, (profile.value._count.following ?? 0) - 1) }
  } finally {
    modalActionLoading.value = null
  }
}

function archivePostFromList(postId: string) {
  confirmType.value = 'archive'
  confirmPostId.value = postId
  confirmOpen.value = true
}

function deletePostFromList(postId: string) {
  confirmType.value = 'delete'
  confirmPostId.value = postId
  confirmOpen.value = true
}

async function onConfirmConfirm() {
  const postId = confirmPostId.value
  const type = confirmType.value
  if (!postId || !type) return
  confirmOpen.value = false
  confirmType.value = null
  confirmPostId.value = null
  try {
    if (type === 'archive') {
      await api.post(`/posts/${postId}/archive`)
    } else {
      await api.delete(`/posts/${postId}`)
    }
    posts.value = (posts.value as { id: string }[]).filter((p) => p.id !== postId)
    if (profile.value?._count?.posts != null)
      profile.value._count = { ...profile.value._count, posts: Math.max(0, profile.value._count.posts - 1) }
  } catch {
    // ignore
  }
}

function handleLike(_postId: string, isLiked: boolean) {
  if (isOwnProfile.value && profile.value?._count != null) {
    const currentLikes = profile.value._count.likes ?? 0
    profile.value._count = {
      ...profile.value._count,
      likes: Math.max(0, currentLikes + (isLiked ? 1 : -1)),
    }
  }
}

watch(profileTab, updateProfileTabIndicator)
watch(isOwnProfile, updateProfileTabIndicator)
watch([profile, loading], () => {
  if (profile.value && !loading.value) updateProfileTabIndicator()
}, { immediate: true })
watch(() => route.params.username, load)

onMounted(() => {
  load()
  window.addEventListener('resize', updateProfileTabIndicator)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateProfileTabIndicator)
})
</script>

<style scoped>
.profile-page { padding: 0; }
.loading, .error { padding: clamp(1rem, 4vw, 2rem) 0; color: var(--text-secondary); }
.profile-header {
  text-align: center;
  padding: clamp(1rem, 4vw, 2rem);
  border-bottom: 2px solid var(--border-light);
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.avatar {
  width: clamp(72px, 20vw, 96px);
  height: clamp(72px, 20vw, 96px);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.25);
  border: 3px solid var(--bg-card);
  outline: 2px solid var(--border-medium);
  display: block;
}
.avatar-placeholder {
  width: clamp(72px, 20vw, 96px);
  height: clamp(72px, 20vw, 96px);
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.25);
  border: 3px solid var(--bg-card);
  outline: 2px solid var(--border-medium);
}
.profile-header h1 {
  margin: 0 0 0.25rem;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  word-break: break-word;
}
.bio { color: var(--text-secondary); margin: 0 0 0.5rem; font-size: 0.9375rem; }
.profile-html {
  margin: 0.5rem 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  text-align: left;
  max-width: min(480px, 100%);
  margin-left: auto;
  margin-right: auto;
  color: var(--text-secondary);
  padding: 0 0.5rem;
}
.profile-html :deep(p) { margin: 0.5rem 0; }
.profile-html :deep(img) { max-width: 100%; height: auto; }

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 4vw, 2rem);
  margin: 1rem 0 0;
  padding: 1rem 0;
  border-top: 1px solid var(--border-light);
  width: 100%;
  max-width: 360px;
  flex-wrap: wrap;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  border-radius: var(--radius-md);
}
.stat-item:hover {
  background: var(--bg-primary);
  color: var(--accent-primary);
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}
.stat-item:hover .stat-value { color: var(--accent-primary); }
.stat-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.stat-item:hover .stat-label { color: var(--accent-primary); }
.profile-actions { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap; }
.edit-link { font-size: 0.875rem; font-weight: 600; color: var(--accent-primary); text-decoration: none; }
.edit-link:hover { color: var(--accent-burgundy); text-decoration: underline; }
.archived-link { color: var(--text-tertiary); }
.archived-link:hover { color: var(--accent-primary); }
.btn-follow {
  margin-top: 0.75rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 2px solid var(--accent-primary);
  background: var(--accent-primary);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.btn-follow:hover:not(:disabled) { background: var(--accent-burgundy); border-color: var(--accent-burgundy); }
.btn-follow:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-following { background: transparent; color: var(--text-secondary); border-color: var(--border-medium); }
.btn-following:hover:not(:disabled) { background: var(--bg-primary); border-color: var(--border-medium); }
.posts-section { margin-top: 1.5rem; }
.profile-tabs {
  position: relative;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: var(--bg-primary);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-light);
}
.profile-tabs-indicator {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0;
  width: 0;
  border-radius: calc(var(--radius-md) - 2px);
  background: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.25);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 0;
}
.profile-tab {
  position: relative;
  z-index: 1;
  padding: 0.625rem 1.25rem;
  border-radius: calc(var(--radius-md) - 2px);
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}
.profile-tab:hover:not(.active) { color: var(--accent-primary); }
.profile-tab.active {
  color: white;
  /* Always show active state (sliding indicator may measure late; this ensures tab is highlighted) */
  background: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.25);
}
.empty { color: var(--text-secondary); padding: 1rem 0; }
.post-list { display: flex; flex-direction: column; gap: clamp(1rem, 3vw, 1.5rem); }
.feed-item-wrap { display: contents; }

@media (max-width: 768px) {
  .profile-avatar-wrap { margin-bottom: 0.75rem; }
  .avatar, .avatar-placeholder { width: 80px; height: 80px; font-size: 1.875rem; }
  .profile-stats { gap: 1rem; padding: 0.75rem 0; max-width: none; }
  .profile-tab { padding: 0.5rem 1rem; font-size: 0.875rem; }
  .profile-actions { gap: 0.75rem; }
  .edit-link { font-size: 0.8125rem; }
}
@media (max-width: 480px) {
  .profile-header { padding: 1rem 0.75rem; }
  .avatar, .avatar-placeholder { width: 72px; height: 72px; font-size: 1.75rem; }
  .profile-stats { gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
  .stat-item { padding: 0.375rem 0.75rem; }
  .stat-value { font-size: 1.125rem; }
  .stat-label { font-size: 0.75rem; }
  .profile-tabs { flex-wrap: wrap; }
  .profile-tab { flex: 1 1 auto; min-width: 0; }
  .modal { max-width: min(400px, calc(100vw - 2rem)); max-height: 85vh; }
  .modal-backdrop { padding: 0.75rem; }
}

/* Modal (teleported) */
.modal-backdrop { position: fixed; inset: 0; background: rgba(44, 24, 16, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border-light);
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light); }
.modal-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
.modal-close { background: none; border: none; font-size: 1.5rem; line-height: 1; color: var(--text-tertiary); cursor: pointer; padding: 0.25rem; }
.modal-close:hover { color: var(--text-primary); }
.modal-body { padding: 1rem; overflow-y: auto; }
.modal-loading, .modal-empty { color: var(--text-secondary); padding: 1rem 0; text-align: center; }
.modal-list { list-style: none; margin: 0; padding: 0; }
.modal-list-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-light); }
.modal-list-item:last-child { border-bottom: none; }
.modal-user { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; color: inherit; text-decoration: none; }
.modal-user:hover { color: var(--accent-primary); }
.modal-avatar, .modal-avatar-placeholder {
  width: 40px; height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  flex-shrink: 0;
  display: block;
  line-height: 40px;
  font-size: 1rem;
  text-align: center;
  color: white;
  font-weight: 600;
}
.modal-user-name { font-weight: 600; color: var(--text-primary); }
.modal-user-handle { color: var(--text-tertiary); font-size: 0.875rem; }
.btn-modal {
  flex-shrink: 0;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-medium);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}
.btn-modal:hover:not(:disabled) { background: var(--bg-primary); color: var(--text-primary); }
.btn-modal:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-remove:hover:not(:disabled) { border-color: var(--like-color); color: var(--like-color); }
.btn-unfollow:hover:not(:disabled) { border-color: var(--accent-primary); color: var(--accent-primary); }
</style>
