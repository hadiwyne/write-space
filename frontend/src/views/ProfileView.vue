<template>
  <div class="profile-page">
    <div v-if="loading" class="loading">Loading…</div>
    <template v-else-if="profile">
      <div class="profile-header">
        <img v-if="profile.avatarUrl" :src="avatarSrc(profile.avatarUrl)" alt="" class="avatar" />
        <span v-else class="avatar-placeholder">{{ (profile.displayName || profile.username || '?')[0] }}</span>
        <h1>{{ profile.displayName || profile.username }}</h1>
        <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
        <div v-if="profile.profileHTML" class="profile-html" v-html="profile.profileHTML"></div>
        <p class="meta">
          <button type="button" class="meta-link" @click="scrollToPosts">
            {{ profile._count?.posts ?? 0 }} posts
          </button>
          <span class="meta-sep">·</span>
          <button type="button" class="meta-link" @click="openModal('followers')">
            {{ profile._count?.followers ?? 0 }} followers
          </button>
          <span class="meta-sep">·</span>
          <button type="button" class="meta-link" @click="openModal('following')">
            {{ profile._count?.following ?? 0 }} following
          </button>
        </p>
        <template v-if="isOwnProfile">
          <router-link to="/settings" class="edit-link">Edit profile</router-link>
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
        <h2>Posts</h2>
        <div v-if="posts.length === 0" class="empty">No posts yet.</div>
        <div v-else class="post-list">
          <PostCard v-for="p in posts" :key="p.id" :post="p" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, apiBaseUrl } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const auth = useAuthStore()
const profile = ref<{
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  _count?: { posts: number; followers: number; following: number }
} | null>(null)
const posts = ref<unknown[]>([])
const loading = ref(true)
const isFollowing = ref(false)
const followLoading = ref(false)
const modalOpen = ref(false)
const modalMode = ref<'followers' | 'following'>('followers')
const modalList = ref<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }[]>([])
const modalLoading = ref(false)
const modalActionLoading = ref<string | null>(null)
const isOwnProfile = computed(() => auth.user && profile.value && auth.user.username === profile.value.username)
function avatarSrc(url: string | null | undefined) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBaseUrl + url
}

async function load() {
  const username = route.params.username as string
  loading.value = true
  isFollowing.value = false
  try {
    const [profileRes, postsRes] = await Promise.all([
      api.get(`/users/${username}`),
      api.get(`/posts?author=${username}`).catch(() => ({ data: [] })),
    ])
    profile.value = profileRes.data
    posts.value = Array.isArray(postsRes.data) ? postsRes.data : []
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
  document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' })
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

onMounted(load)
watch(() => route.params.username, load)
</script>

<style scoped>
.profile-page { padding: 0; }
.loading, .error { padding: 2rem 0; color: var(--gray-700); }
.profile-header { text-align: center; padding: 2rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem; }
.avatar, .avatar-placeholder { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; background: var(--gray-200); display: inline-block; line-height: 80px; font-size: 2rem; margin-bottom: 0.5rem; }
.profile-header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.bio { color: var(--gray-700); margin: 0 0 0.5rem; font-size: 0.9375rem; }
.profile-html { margin: 0.5rem 0; font-size: 0.9375rem; line-height: 1.6; text-align: left; max-width: 480px; margin-left: auto; margin-right: auto; }
.profile-html :deep(p) { margin: 0.5rem 0; }
.profile-html :deep(img) { max-width: 100%; }
.meta { font-size: 0.875rem; color: var(--gray-700); margin: 0; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0.25rem; }
.meta-sep { user-select: none; }
.meta-link { background: none; border: none; padding: 0; font-size: inherit; color: var(--primary); cursor: pointer; text-decoration: none; }
.meta-link:hover { text-decoration: underline; }
.edit-link { display: inline-block; margin-top: 0.75rem; font-size: 0.875rem; }
.btn-follow { margin-top: 0.75rem; padding: 0.5rem 1.25rem; font-size: 0.9375rem; font-weight: 500; border-radius: var(--radius); border: 1px solid var(--primary); background: var(--primary); color: #fff; cursor: pointer; }
.btn-follow:hover:not(:disabled) { filter: brightness(1.05); }
.btn-follow:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-following { background: transparent; color: var(--gray-700); border-color: var(--gray-300); }
.btn-following:hover:not(:disabled) { background: var(--gray-100); border-color: var(--gray-400); }
.posts-section h2 { font-size: 1.25rem; margin: 0 0 1rem; }
.empty { color: var(--gray-700); padding: 1rem 0; }
.post-list { display: flex; flex-direction: column; gap: 1rem; }

/* Modal (teleported, so unscoped for backdrop) */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: #fff; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); max-width: 400px; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--gray-200); }
.modal-title { margin: 0; font-size: 1.25rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; line-height: 1; color: var(--gray-700); cursor: pointer; padding: 0.25rem; }
.modal-close:hover { color: var(--gray-900); }
.modal-body { padding: 1rem; overflow-y: auto; }
.modal-loading, .modal-empty { color: var(--gray-700); padding: 1rem 0; text-align: center; }
.modal-list { list-style: none; margin: 0; padding: 0; }
.modal-list-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100); }
.modal-list-item:last-child { border-bottom: none; }
.modal-user { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; color: inherit; text-decoration: none; }
.modal-user:hover { color: var(--primary); }
.modal-avatar, .modal-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: var(--gray-200); flex-shrink: 0; display: block; line-height: 40px; font-size: 1rem; text-align: center; }
.modal-user-name { font-weight: 500; }
.modal-user-handle { color: var(--gray-700); font-size: 0.875rem; }
.btn-modal { flex-shrink: 0; padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: var(--radius); border: 1px solid var(--gray-300); background: #fff; color: var(--gray-700); cursor: pointer; }
.btn-modal:hover:not(:disabled) { background: var(--gray-100); }
.btn-modal:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-remove:hover:not(:disabled) { border-color: #dc2626; color: #dc2626; }
.btn-unfollow:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
</style>
