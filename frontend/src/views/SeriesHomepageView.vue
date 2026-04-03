<template>
  <div
    class="series-page"
    :style="pageStyle"
    v-if="series"
  >
    <!-- Post submitted for review banner -->
    <Transition name="fade">
      <div v-if="showSubmittedBanner" class="submitted-banner">
        <i class="pi pi-check-circle"></i>
        Your post has been submitted for review. The series owner will be notified.
        <button type="button" class="submitted-banner-close" @click="showSubmittedBanner = false">×</button>
      </div>
    </Transition>

    <!-- Hero / Cover Header -->
    <header class="series-hero" :class="{ 'series-hero--has-cover': series.coverMimeType }" :style="heroStyle">
      <div class="series-hero-inner">
        <!-- Wordmark or Logo + Name -->
        <div class="series-identity">
          <img
            v-if="series.wordmarkMimeType"
            :src="imageUrl('wordmark')"
            alt="series wordmark"
            class="series-wordmark"
          />
          <div v-else class="series-name-row">
            <div v-if="series.logoMimeType" class="series-logo-wrap">
              <img :src="imageUrl('logo')" alt="" class="series-logo" />
            </div>
            <div v-else-if="series.name" class="series-logo-fallback" :style="accentBg">
              {{ series.name[0] }}
            </div>
            <h1 class="series-name">{{ series.name }}</h1>
          </div>
        </div>

        <p v-if="series.tagline" class="series-tagline">
          {{ series.tagline }}
        </p>

        <!-- Members row: owner + contributors -->
        <div class="series-members-row" v-if="seriesMembers.length">
          <router-link
            v-for="m in seriesMembers"
            :key="m.user.id"
            :to="'/u/' + m.user.username"
            class="series-member-chip"
            :title="m.role === 'OWNER' ? 'Owner' : m.role === 'EDITOR' ? 'Editor' : 'Contributor'"
          >
            <img
              v-if="m.user.avatarUrl"
              :src="avatarSrc(m.user.avatarUrl)"
              :alt="m.user.username"
              class="series-member-avatar"
            />
            <span v-else class="series-member-avatar series-member-avatar--fallback">
              {{ (m.user.displayName || m.user.username)[0].toUpperCase() }}
            </span>
            <span class="series-member-name">@{{ m.user.username }}</span>
            <span v-if="m.role === 'OWNER'" class="series-member-badge">Owner</span>
          </router-link>
        </div>

        <div class="series-actions">
          <!-- Members never see the follow button — they are part of the series -->
          <span v-if="isMember" class="series-member-status">
            <i class="pi pi-shield"></i> Member
          </span>
          <button
            v-else-if="auth.isLoggedIn"
            type="button"
            class="btn-follow"
            :class="{ following: isFollowing }"
            :style="isFollowing ? {} : accentBg"
            :disabled="followLoading"
            @click="toggleFollow"
          >
            <i :class="isFollowing ? 'pi pi-check' : 'pi pi-plus'"></i>
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>

          <!-- Clickable follower count -->
          <button type="button" class="follower-count-btn" @click="openFollowersModal">
            <i class="pi pi-users"></i>
            <span>{{ followerCount }} follower{{ followerCount !== 1 ? 's' : '' }}</span>
          </button>

          <router-link
            v-if="memberRole === 'OWNER' || memberRole === 'CONTRIBUTOR'"
            :to="'/series/' + series.slug + '/settings'"
            class="btn-settings"
          >
            <i class="pi pi-cog"></i> Settings
          </router-link>
        </div>

        <!-- Nav Links -->
        <nav v-if="navLinks.length" class="series-nav">
          <a
            v-for="link in navLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="series-nav-link"
          >{{ link.label }}</a>
        </nav>
      </div>

      <!-- Cover image background -->
      <img
        v-if="series.coverMimeType"
        :src="imageUrl('cover')"
        alt=""
        class="series-hero-bg"
        :style="{ objectPosition: `center ${series.coverFocalY ?? 50}%` }"
        aria-hidden="true"
      />
    </header>

    <!-- Section navigation tabs -->
    <nav v-if="sections.length" class="section-tabs-bar" :style="{ '--s-accent': series.accentColor || 'var(--accent-primary)' }">
      <button
        type="button"
        class="section-tab"
        :class="{ active: activeSectionId === null }"
        @click="selectSection(null)"
      >All Posts</button>
      <button
        v-for="sec in sections"
        :key="sec.id"
        type="button"
        class="section-tab"
        :class="{ active: activeSectionId === sec.id }"
        @click="selectSection(sec.id)"
      >{{ sec.name }}</button>
    </nav>

    <div class="series-content">
      <!-- Description / About (only in All view) -->
      <div v-if="series.description && activeSectionId === null" class="series-about">
        <p class="series-description">{{ series.description }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loadingPosts || loadingSection" class="posts-loading">
        <i class="pi pi-spin pi-spinner"></i>
      </div>

      <!-- ── Active Section view ── -->
      <template v-else-if="activeSectionId !== null">
        <div v-if="!sectionPosts.length" class="posts-loading" style="padding:3rem;color:var(--text-tertiary);">
          No posts in this section yet.
        </div>
        <template v-else>
          <!-- Section: feature layout -->
          <template v-if="activeSection?.layoutMode === 'feature'">
            <div class="layout-feature">
              <router-link :to="'/posts/' + sectionPosts[0].id" class="feature-hero-card">
                <div class="feature-hero-img-wrap" v-if="getThumb(sectionPosts[0])">
                  <img :src="avatarSrc(getThumb(sectionPosts[0]) || '')" alt="" class="feature-hero-img" loading="lazy" />
                </div>
                <div class="feature-hero-body">
                  <h2 class="feature-hero-title">{{ sectionPosts[0].title }}</h2>
                  <p v-if="getExcerpt(sectionPosts[0])" class="feature-hero-excerpt">{{ getExcerpt(sectionPosts[0]) }}</p>
                  <div class="feature-hero-meta">
                    <span class="meta-author">{{ sectionPosts[0].author?.displayName || sectionPosts[0].author?.username }}</span>
                    <span class="meta-dot">·</span>
                    <span class="meta-date">{{ formatDate(sectionPosts[0].publishedAt || sectionPosts[0].createdAt) }}</span>
                  </div>
                </div>
              </router-link>
              <div class="feature-rest post-list">
                <router-link v-for="p in sectionPosts.slice(1)" :key="p.id" :to="'/posts/' + p.id" class="post-item">
                  <div class="post-item-body">
                    <h3 class="post-item-title">{{ p.title }}</h3>
                    <p class="post-item-excerpt">{{ getExcerpt(p, 100) }}</p>
                    <div class="post-item-meta">
                      <span>{{ p.author?.displayName || p.author?.username }}</span>
                      <span class="meta-dot">·</span>
                      <span>{{ formatDate(p.publishedAt || p.createdAt) }}</span>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </template>

          <!-- Section: magazine layout -->
          <template v-else-if="activeSection?.layoutMode === 'magazine'">
            <div class="layout-magazine">
              <router-link :to="'/posts/' + sectionPosts[0].id" class="magazine-main">
                <div class="magazine-main-img" v-if="getThumb(sectionPosts[0])">
                  <img :src="avatarSrc(getThumb(sectionPosts[0]) || '')" alt="" loading="lazy" />
                </div>
                <div class="magazine-main-overlay">
                  <h2 class="magazine-main-title">{{ sectionPosts[0].title }}</h2>
                  <div class="magazine-main-meta">
                    {{ sectionPosts[0].author?.displayName || sectionPosts[0].author?.username }}
                    · {{ formatDate(sectionPosts[0].publishedAt || sectionPosts[0].createdAt) }}
                  </div>
                </div>
              </router-link>
              <div class="magazine-side">
                <router-link v-for="p in sectionPosts.slice(1, 5)" :key="p.id" :to="'/posts/' + p.id" class="magazine-side-item">
                  <div class="magazine-side-img" v-if="getThumb(p)">
                    <img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" />
                  </div>
                  <div class="magazine-side-body">
                    <h3 class="magazine-side-title">{{ p.title }}</h3>
                    <span class="magazine-side-meta">{{ formatDate(p.publishedAt || p.createdAt) }}</span>
                  </div>
                </router-link>
              </div>
            </div>
            <div class="post-grid magazine-extra" v-if="sectionPosts.length > 5">
              <router-link v-for="p in sectionPosts.slice(5)" :key="p.id" :to="'/posts/' + p.id" class="post-item">
                <div v-if="getThumb(p)" class="post-item-thumb"><img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" /></div>
                <div class="post-item-body">
                  <h3 class="post-item-title">{{ p.title }}</h3>
                  <div class="post-item-meta">{{ formatDate(p.publishedAt || p.createdAt) }}</div>
                </div>
              </router-link>
            </div>
          </template>

          <!-- Section: newspaper layout -->
          <template v-else-if="activeSection?.layoutMode === 'newspaper'">
            <div class="layout-newspaper">
              <router-link v-for="p in sectionPosts" :key="p.id" :to="'/posts/' + p.id" class="newspaper-item">
                <div v-if="getThumb(p)" class="newspaper-thumb"><img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" /></div>
                <div class="newspaper-body">
                  <h3 class="newspaper-title">{{ p.title }}</h3>
                  <div class="newspaper-meta">{{ p.author?.displayName || p.author?.username }} · {{ formatDate(p.publishedAt || p.createdAt) }}</div>
                </div>
              </router-link>
            </div>
          </template>

          <!-- Section: grid layout -->
          <template v-else-if="activeSection?.layoutMode === 'grid'">
            <div class="post-grid">
              <router-link v-for="p in sectionPosts" :key="p.id" :to="'/posts/' + p.id" class="post-item">
                <div v-if="getThumb(p)" class="post-item-thumb"><img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" /></div>
                <div class="post-item-body">
                  <h3 class="post-item-title">{{ p.title }}</h3>
                  <div class="post-item-meta">
                    <span>{{ p.author?.displayName || p.author?.username }}</span>
                    <span class="meta-dot">·</span>
                    <span>{{ formatDate(p.publishedAt || p.createdAt) }}</span>
                  </div>
                </div>
              </router-link>
            </div>
          </template>

          <!-- Section: list layout (default) -->
          <template v-else>
            <div class="post-list">
              <router-link v-for="p in sectionPosts" :key="p.id" :to="'/posts/' + p.id" class="post-item">
                <div class="post-item-body">
                  <h3 class="post-item-title">{{ p.title }}</h3>
                  <p class="post-item-excerpt">{{ getExcerpt(p, 120) }}</p>
                  <div class="post-item-meta">
                    <span>{{ p.author?.displayName || p.author?.username }}</span>
                    <span class="meta-dot">·</span>
                    <span>{{ formatDate(p.publishedAt || p.createdAt) }}</span>
                  </div>
                </div>
              </router-link>
            </div>
          </template>
        </template>
      </template>

      <!-- Feature Layout: 1 pinned hero + list -->
      <template v-else-if="series.layoutMode === 'feature'">
        <div v-if="heroPosts.length" class="layout-feature">
          <router-link :to="'/posts/' + heroPosts[0].id" class="feature-hero-card">
            <div class="feature-hero-img-wrap" v-if="getThumb(heroPosts[0])">
              <img :src="avatarSrc(getThumb(heroPosts[0]) || '')" alt="" class="feature-hero-img" loading="lazy" />
            </div>
            <div class="feature-hero-body">
              <h2 class="feature-hero-title">{{ heroPosts[0].title }}</h2>
              <p v-if="getExcerpt(heroPosts[0])" class="feature-hero-excerpt">{{ getExcerpt(heroPosts[0]) }}</p>
              <div class="feature-hero-meta">
                <span class="meta-author">{{ heroPosts[0].author?.displayName || heroPosts[0].author?.username }}</span>
                <span class="meta-dot">·</span>
                <span class="meta-date">{{ formatDate(heroPosts[0].publishedAt || heroPosts[0].createdAt) }}</span>
              </div>
            </div>
          </router-link>

          <!-- Remaining posts as list/grid -->
          <div
            class="feature-rest"
            :class="series.postListMode === 'grid' ? 'post-grid' : 'post-list'"
          >
            <router-link
              v-for="p in heroPosts.slice(1)"
              :key="p.id"
              :to="'/posts/' + p.id"
              class="post-item"
            >
              <div v-if="getThumb(p) && series.postListMode === 'grid'" class="post-item-thumb">
                <img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" />
              </div>
              <div class="post-item-body">
                <h3 class="post-item-title">{{ p.title }}</h3>
                <p v-if="series.postListMode === 'list'" class="post-item-excerpt">{{ getExcerpt(p, 100) }}</p>
                <div class="post-item-meta">
                  <span>{{ p.author?.displayName || p.author?.username }}</span>
                  <span class="meta-dot">·</span>
                  <span>{{ formatDate(p.publishedAt || p.createdAt) }}</span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </template>

      <!-- Magazine Layout: 5 visual grid hero -->
      <template v-else-if="series.layoutMode === 'magazine'">
        <div class="layout-magazine" v-if="heroPosts.length">
          <router-link :to="'/posts/' + heroPosts[0].id" class="magazine-main">
            <div class="magazine-main-img" v-if="getThumb(heroPosts[0])">
              <img :src="avatarSrc(getThumb(heroPosts[0]) || '')" alt="" loading="lazy" />
            </div>
            <div class="magazine-main-overlay">
              <h2 class="magazine-main-title">{{ heroPosts[0].title }}</h2>
              <div class="magazine-main-meta">
                {{ heroPosts[0].author?.displayName || heroPosts[0].author?.username }}
                · {{ formatDate(heroPosts[0].publishedAt || heroPosts[0].createdAt) }}
              </div>
            </div>
          </router-link>
          <div class="magazine-side">
            <router-link
              v-for="p in heroPosts.slice(1, 5)"
              :key="p.id"
              :to="'/posts/' + p.id"
              class="magazine-side-item"
            >
              <div class="magazine-side-img" v-if="getThumb(p)">
                <img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" />
              </div>
              <div class="magazine-side-body">
                <h3 class="magazine-side-title">{{ p.title }}</h3>
                <span class="magazine-side-meta">{{ formatDate(p.publishedAt || p.createdAt) }}</span>
              </div>
            </router-link>
          </div>
        </div>
        <div class="post-grid magazine-extra" v-if="heroPosts.length > 5">
          <router-link
            v-for="p in heroPosts.slice(5)"
            :key="p.id"
            :to="'/posts/' + p.id"
            class="post-item"
          >
            <div v-if="getThumb(p)" class="post-item-thumb">
              <img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" />
            </div>
            <div class="post-item-body">
              <h3 class="post-item-title">{{ p.title }}</h3>
              <div class="post-item-meta">{{ formatDate(p.publishedAt || p.createdAt) }}</div>
            </div>
          </router-link>
        </div>
      </template>

      <!-- Newspaper Layout: dense 8+ grid -->
      <template v-else-if="series.layoutMode === 'newspaper'">
        <div class="layout-newspaper">
          <router-link
            v-for="p in heroPosts"
            :key="p.id"
            :to="'/posts/' + p.id"
            class="newspaper-item"
          >
            <div v-if="getThumb(p)" class="newspaper-thumb">
              <img :src="avatarSrc(getThumb(p) || '')" alt="" loading="lazy" />
            </div>
            <div class="newspaper-body">
              <h3 class="newspaper-title">{{ p.title }}</h3>
              <div class="newspaper-meta">
                {{ p.author?.displayName || p.author?.username }} · {{ formatDate(p.publishedAt || p.createdAt) }}
              </div>
            </div>
          </router-link>
        </div>
      </template>

      <!-- Load More (All view only) -->
      <div v-if="activeSectionId === null && hasMore && !loadingPosts" class="load-more-wrap">
        <button type="button" class="btn-load-more" :style="accentBg" @click="loadMore">
          Load more posts
        </button>
      </div>
    </div>

    <!-- Followers Modal (Teleport renders to body regardless of where in the tree) -->
    <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="followersModalOpen" class="followers-modal-backdrop" @click.self="closeFollowersModal">
        <div class="followers-modal" role="dialog" aria-modal="true" aria-label="Series followers">
          <div class="followers-modal-header">
            <h3 class="followers-modal-title">
              <i class="pi pi-users"></i>
              Followers <span class="followers-modal-count">({{ followerCount }})</span>
            </h3>
            <button type="button" class="followers-modal-close" @click="closeFollowersModal">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="followers-modal-body">
            <div v-if="followersLoading" class="followers-loading">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <div v-else-if="!followersList.length" class="followers-empty">
              No followers yet.
            </div>
            <ul v-else class="followers-list">
              <li v-for="u in followersList" :key="u.id" class="followers-item">
                <router-link :to="'/u/' + u.username" class="followers-item-link" @click="closeFollowersModal">
                  <img
                    v-if="u.avatarUrl"
                    :src="avatarSrc(u.avatarUrl)"
                    :alt="u.username"
                    class="followers-avatar"
                  />
                  <span v-else class="followers-avatar followers-avatar--fallback">
                    {{ (u.displayName || u.username)[0].toUpperCase() }}
                  </span>
                  <div class="followers-user-info">
                    <span class="followers-display-name">{{ u.displayName || u.username }}</span>
                    <span class="followers-username">@{{ u.username }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
            <button
              v-if="followersHasMore && !followersLoading"
              type="button"
              class="followers-load-more"
              @click="loadMoreFollowers"
            >
              Load more
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </Teleport>
  </div>

  <!-- Loading skeleton -->
  <div v-else-if="loadingPage" class="page-loading">
    <div class="page-loading-inner">
      <div class="skeleton-hero"></div>
      <div class="skeleton-content">
        <div class="skeleton-line" style="width:60%;height:24px;"></div>
        <div class="skeleton-line" style="width:90%"></div>
        <div class="skeleton-line" style="width:70%"></div>
      </div>
    </div>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="page-error">
    <i class="pi pi-exclamation-circle" style="font-size:2rem;color:var(--text-tertiary)"></i>
    <p>{{ error }}</p>
    <router-link to="/series" class="btn-back">Back to Series</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { api, avatarSrc, apiBaseUrl } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { SeriesInfo } from '@/stores/series'
import { applyOgMeta, clearOgMeta } from '@/utils/ogMeta'

const route = useRoute()
const auth = useAuthStore()

const showSubmittedBanner = ref(route.query.submitted === '1')
if (showSubmittedBanner.value) {
  setTimeout(() => { showSubmittedBanner.value = false }, 6000)
}

const series = ref<(SeriesInfo & { owner?: any; members?: any[] }) | null>(null)
const posts = ref<any[]>([])
const loadingPage = ref(true)
const loadingPosts = ref(false)
const error = ref('')
const isFollowing = ref(false)
const followerCount = ref(0)
const isMember = ref(false)
const memberRole = ref<string | null>(null)
const followLoading = ref(false)
const hasMore = ref(false)
const offset = ref(0)
const LIMIT = 30

// Members (owner + contributors shown in header)
const seriesMembers = computed<{ role: string; user: any }[]>(() => {
  const s = series.value
  if (!s) return []
  const owner = s.owner ? [{ role: 'OWNER', user: s.owner }] : []
  const others = (s.members ?? []).filter((m: any) => m.user?.id !== s.owner?.id)
  return [...owner, ...others]
})

// Followers modal
const followersModalOpen = ref(false)
const followersList = ref<any[]>([])
const followersLoading = ref(false)
const followersOffset = ref(0)
const followersHasMore = ref(false)
const FOLLOWERS_LIMIT = 30

async function openFollowersModal() {
  followersModalOpen.value = true
  if (followersList.value.length === 0) await fetchFollowers(true)
}
function closeFollowersModal() { followersModalOpen.value = false }

async function fetchFollowers(reset = false) {
  const slug = route.params.slug as string
  followersLoading.value = true
  try {
    const off = reset ? 0 : followersOffset.value
    const { data } = await api.get<{ followers: any[]; total: number }>(
      `/series/${slug}/followers`,
      { params: { limit: String(FOLLOWERS_LIMIT), offset: String(off) }, cache: false },
    )
    if (reset) {
      followersList.value = data.followers
      followersOffset.value = data.followers.length
    } else {
      followersList.value.push(...data.followers)
      followersOffset.value += data.followers.length
    }
    followersHasMore.value = followersOffset.value < data.total
  } finally {
    followersLoading.value = false
  }
}
function loadMoreFollowers() { fetchFollowers(false) }

// Sections
const sections = ref<any[]>([])
const activeSectionId = ref<string | null>(null)
const loadingSection = ref(false)
const sectionPostsCache = reactive<Record<string, any[]>>({})
const sectionPosts = computed(() =>
  activeSectionId.value ? (sectionPostsCache[activeSectionId.value] ?? []) : []
)
const activeSection = computed(() =>
  activeSectionId.value ? sections.value.find((s) => s.id === activeSectionId.value) ?? null : null
)

async function loadSections() {
  const slug = route.params.slug as string
  try {
    const { data } = await api.get<any[]>(`/series/${slug}/sections`, { cache: false })
    sections.value = Array.isArray(data) ? data : []
  } catch {
    sections.value = []
  }
}

async function selectSection(sectionId: string | null) {
  activeSectionId.value = sectionId
  if (!sectionId) return
  if (sectionPostsCache[sectionId]) return
  loadingSection.value = true
  try {
    const slug = route.params.slug as string
    const { data } = await api.get(`/series/${slug}/sections/${sectionId}/posts`, { cache: false })
    sectionPostsCache[sectionId] = data.posts ?? []
  } catch {
    sectionPostsCache[sectionId] = []
  } finally {
    loadingSection.value = false
  }
}

const heroPosts = computed(() => posts.value)
const accentColor = computed(() => series.value?.accentColor || null)
const accentBg = computed(() =>
  accentColor.value ? { background: accentColor.value, color: '#fff' } : {}
)

const pageStyle = computed(() => {
  const s = series.value
  if (!s) return {}
  return {
    '--series-accent': s.accentColor || 'var(--accent-primary)',
    '--series-bg': s.bgColor || 'var(--bg-primary)',
    fontFamily: s.fontFamily || undefined,
  }
})

// Apply bgColor + bgImage to the entire viewport (body) while on this page
watchEffect(() => {
  const s = series.value
  const color = s?.bgColor || ''
  document.body.style.backgroundColor = color
  document.documentElement.style.backgroundColor = color

  if (s?.bgImageMimeType) {
    const base = apiBaseUrl.replace(/\/$/, '')
    const url = `${base}/series/${encodeURIComponent(s.slug)}/images/bg-image`
    document.body.style.backgroundImage = `url('${url}')`
    document.body.style.backgroundSize = 'cover'
    document.body.style.backgroundPosition = 'center'
    document.body.style.backgroundAttachment = 'fixed'
    document.body.style.backgroundRepeat = 'no-repeat'
  } else {
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundAttachment = ''
    document.body.style.backgroundRepeat = ''
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeFollowersModal()
}
onMounted(() => { window.addEventListener('keydown', onKeydown) })
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.backgroundColor = ''
  document.documentElement.style.backgroundColor = ''
  document.body.style.backgroundImage = ''
  document.body.style.backgroundSize = ''
  document.body.style.backgroundPosition = ''
  document.body.style.backgroundAttachment = ''
  document.body.style.backgroundRepeat = ''
  clearOgMeta()
})

const heroStyle = computed(() => {
  if (!series.value?.coverMimeType && series.value?.coverBgColor) {
    return { background: series.value.coverBgColor }
  }
  return {}
})

const navLinks = computed<{ label: string; url: string }[]>(() => {
  const nl = series.value?.navLinks
  if (!Array.isArray(nl)) return []
  return nl.filter((l: any) => l?.label && l?.url)
})

function imageUrl(type: 'logo' | 'wordmark' | 'cover' | 'social-preview') {
  const slug = route.params.slug as string
  const base = apiBaseUrl.replace(/\/$/, '')
  return `${base}/series/${encodeURIComponent(slug)}/images/${type}`
}

function getThumb(p: any): string | null {
  if (p.imageUrls?.length) return p.imageUrls[0]
  if (p.linkPreview?.image) return p.linkPreview.image
  return null
}

function getExcerpt(p: any, max = 180): string {
  const text = (p.renderedHTML || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}

function formatDate(d?: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

async function loadSeries() {
  const slug = route.params.slug as string
  loadingPage.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/series/${slug}`, { cache: false })
    series.value = data
    isFollowing.value = data.isFollowing ?? false
    followerCount.value = data.followerCount ?? 0
    isMember.value = data.isMember ?? false
    memberRole.value = data.memberRole ?? null

    // Set OG / social preview meta tags
    const base = apiBaseUrl.replace(/\/$/, '')
    const ogImage = data.socialPreviewMimeType
      ? `${base}/series/${encodeURIComponent(slug)}/images/social-preview`
      : data.coverMimeType
        ? `${base}/series/${encodeURIComponent(slug)}/images/cover`
        : ''
    applyOgMeta({
      title: data.name,
      description: data.description || data.tagline || '',
      image: ogImage,
      url: window.location.href,
      type: 'website',
    })
    await Promise.all([loadPosts(true), loadSections()])
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Series not found'
  } finally {
    loadingPage.value = false
  }
}

async function loadPosts(reset = false) {
  const slug = route.params.slug as string
  loadingPosts.value = true
  try {
    const { data } = await api.get<any[]>(`/series/${slug}/posts`, {
      params: { limit: String(LIMIT), offset: String(reset ? 0 : offset.value) },
      cache: false,
    })
    if (reset) {
      posts.value = data
      offset.value = data.length
    } else {
      posts.value.push(...data)
      offset.value += data.length
    }
    hasMore.value = data.length === LIMIT
  } catch {
    // ignore
  } finally {
    loadingPosts.value = false
  }
}

function loadMore() { loadPosts(false) }

async function toggleFollow() {
  if (!auth.isLoggedIn) return
  followLoading.value = true
  const was = isFollowing.value
  isFollowing.value = !was
  followerCount.value += was ? -1 : 1
  try {
    const slug = route.params.slug as string
    if (was) {
      await api.delete(`/series/${slug}/follow`, { cache: false })
    } else {
      await api.post(`/series/${slug}/follow`, {}, { cache: false })
    }
  } catch {
    isFollowing.value = was
    followerCount.value += was ? 1 : -1
  } finally {
    followLoading.value = false
  }
}

onMounted(loadSeries)
watch(() => route.params.slug, loadSeries)
</script>

<style scoped>
.series-page {
  --series-accent: var(--accent-primary);
  --series-bg: var(--bg-primary);
  min-height: 100vh;
  background: transparent;
}

/* ─── Submitted banner ─── */
.submitted-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: #17bf63;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 100;
}
.submitted-banner .pi { font-size: 1.1rem; flex-shrink: 0; }
.submitted-banner-close {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.25rem;
}

/* ─── Hero ─── */
.series-hero {
  position: relative;
  padding: 3rem 1.5rem 2rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--series-accent) 10%, var(--bg-secondary));
  min-height: 220px;
  display: flex;
  align-items: flex-end;
  margin: 1.25rem 1.5rem 0;
  border-radius: 1.25rem;
}

.series-hero-inner {
  position: relative;
  z-index: 2;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
}

.series-hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* Gradient scrim so text stays legible over dark cover photos */
.series-hero--has-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.60) 0%,
    rgba(0, 0, 0, 0.28) 50%,
    rgba(0, 0, 0, 0.04) 100%
  );
  pointer-events: none;
  border-radius: inherit;
}

.series-identity { margin-bottom: 0.75rem; }

.series-wordmark {
  max-height: 60px;
  max-width: 280px;
  object-fit: contain;
}

.series-name-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.series-logo-wrap, .series-logo-fallback {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
}

.series-logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: contain;
}

.series-logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--series-accent);
  color: #fff;
}

.series-name {
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 900;
  color: var(--text-primary);
  margin: 0;
}

.series-tagline {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0 0 1.25rem;
  max-width: 560px;
}

.series-actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.series-member-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border-radius: 24px;
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(255,255,255,0.15);
  color: var(--text-primary);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.25);
}

.btn-follow {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  border-radius: 24px;
  font-size: 0.9375rem;
  font-weight: 700;
  border: 2px solid var(--series-accent);
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
  background: var(--series-accent);
  color: #fff;
}

.btn-follow.following {
  background: transparent;
  color: var(--series-accent);
}

.btn-follow:disabled { opacity: 0.6; cursor: not-allowed; }

.follower-count-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem 0.625rem;
  border-radius: 20px;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
}
.follower-count-btn:hover {
  background: rgba(255,255,255,0.12);
  color: var(--text-primary);
}

/* Members row */
.series-members-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.series-member-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: 0.25rem 0.625rem 0.25rem 0.25rem;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  transition: background 0.15s;
  backdrop-filter: blur(4px);
}
.series-member-chip:hover { background: rgba(255,255,255,0.22); }
.series-member-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.series-member-avatar--fallback {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--series-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}
.series-member-name { white-space: nowrap; }
.series-member-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--series-accent);
  color: #fff;
  border-radius: 10px;
  padding: 0.1rem 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.btn-settings {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s;
}

.btn-settings:hover {
  border-color: var(--series-accent);
  color: var(--series-accent);
}

/* ─── Nav ─── */
.series-nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.series-nav-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--series-accent);
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: border-color 0.15s;
}

.series-nav-link:hover { border-color: var(--series-accent); }

/* ─── Content ─── */
/* ─── Section Tabs ─── */
.section-tabs-bar {
  display: flex; align-items: center; gap: 0;
  margin: 0.5rem 1.5rem 0;
  border-radius: 1.25rem;
  padding: 0 0.5rem;
  overflow-x: auto; scrollbar-width: none;
  background: color-mix(in srgb, var(--bg-card) 75%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.section-tabs-bar::-webkit-scrollbar { display: none; }

.section-tab {
  padding: 0.5rem 1.1rem;
  font-size: 0.9375rem; font-weight: 600; font-family: inherit;
  color: var(--text-tertiary); background: none; border: none;
  border-radius: 2rem;
  margin: 0.375rem 0.125rem;
  cursor: pointer; white-space: nowrap;
  transition: color 0.15s, background 0.15s;
}
.section-tab:hover { color: var(--text-primary); background: color-mix(in srgb, var(--s-accent) 8%, transparent); }
.section-tab.active {
  color: var(--s-accent);
  background: color-mix(in srgb, var(--s-accent) 14%, transparent);
}

.series-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.series-about {
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  background: color-mix(in srgb, var(--bg-card) 75%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
}

.series-description {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0;
  max-width: 720px;
}

/* ─── Feature Layout ─── */
.layout-feature { display: flex; flex-direction: column; gap: 2rem; }

.feature-hero-card {
  display: flex;
  gap: 1.5rem;
  text-decoration: none;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  transition: box-shadow 0.2s;
}

.feature-hero-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

.feature-hero-img-wrap {
  flex-shrink: 0;
  width: 280px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
}

.feature-hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.feature-hero-body { display: flex; flex-direction: column; gap: 0.625rem; }

.feature-hero-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.25;
}

.feature-hero-excerpt {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feature-hero-meta {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  display: flex;
  gap: 0.375rem;
  align-items: center;
  margin-top: auto;
}

/* ─── Post Grid / List ─── */
.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.post-list { display: flex; flex-direction: column; gap: 0.625rem; }

.post-item {
  display: flex;
  gap: 0.75rem;
  text-decoration: none;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.post-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

.post-list .post-item {
  padding: 0.875rem 1rem;
  align-items: flex-start;
}

.post-grid .post-item {
  flex-direction: column;
  padding: 0;
}

.post-item-thumb {
  width: 100%;
  height: 140px;
  overflow: hidden;
  flex-shrink: 0;
}

.post-list .post-item-thumb {
  width: 80px;
  height: 80px;
  border-radius: 6px;
}

.post-item-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.post-item-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  flex: 1;
}

.post-list .post-item-body { padding: 0; }

.post-item-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-item:hover .post-item-title { color: var(--series-accent); }

.post-item-excerpt {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-item-meta {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-top: auto;
}

.meta-dot { opacity: 0.5; }

/* ─── Magazine Layout ─── */
.layout-magazine {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1rem;
  margin-bottom: 2rem;
}

.magazine-main {
  position: relative;
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  min-height: 360px;
  text-decoration: none;
  display: block;
}

.magazine-main-img { width: 100%; height: 100%; position: absolute; inset: 0; }
.magazine-main-img img { width: 100%; height: 100%; object-fit: cover; }

.magazine-main-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem;
}

.magazine-main-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.375rem;
  line-height: 1.25;
}

.magazine-main-meta {
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.75);
}

.magazine-side { display: flex; flex-direction: column; gap: 0.625rem; }

.magazine-side-item {
  display: flex;
  gap: 0.75rem;
  text-decoration: none;
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  transition: box-shadow 0.15s;
  flex: 1;
}

.magazine-side-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

.magazine-side-img {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.magazine-side-img img { width: 100%; height: 100%; object-fit: cover; }

.magazine-side-body { display: flex; flex-direction: column; gap: 0.25rem; }

.magazine-side-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.magazine-side-item:hover .magazine-side-title { color: var(--series-accent); }

.magazine-side-meta { font-size: 0.75rem; color: var(--text-tertiary); margin-top: auto; }

.magazine-extra { margin-top: 1.5rem; }

/* ─── Newspaper Layout ─── */
.layout-newspaper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.newspaper-item {
  text-decoration: none;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s;
}

.newspaper-item:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }

.newspaper-thumb { height: 110px; overflow: hidden; }
.newspaper-thumb img { width: 100%; height: 100%; object-fit: cover; }

.newspaper-body { padding: 0.625rem 0.75rem; flex: 1; }

.newspaper-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.newspaper-item:hover .newspaper-title { color: var(--series-accent); }

.newspaper-meta { font-size: 0.6875rem; color: var(--text-tertiary); }

/* ─── Load More ─── */
.load-more-wrap { text-align: center; margin-top: 2rem; }

.btn-load-more {
  padding: 0.75rem 2.5rem;
  border-radius: 24px;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-family: inherit;
  background: var(--series-accent);
  color: #fff;
  transition: opacity 0.15s;
}

.btn-load-more:hover { opacity: 0.9; }

/* ─── Loading ─── */
.posts-loading, .page-loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.5rem;
  color: var(--text-tertiary);
}

.skeleton-hero {
  height: 220px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg, 12px);
  animation: shimmer 1.5s infinite;
}

.skeleton-content { padding: 2rem 0; display: flex; flex-direction: column; gap: 0.875rem; }

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: var(--bg-secondary);
  animation: shimmer 1.5s infinite;
}

/* ─── Error ─── */
.page-error {
  text-align: center;
  padding: 4rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.page-error p { color: var(--text-secondary); }

.btn-back {
  padding: 0.625rem 1.5rem;
  background: var(--accent-primary);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@media (max-width: 900px) {
  .layout-magazine { grid-template-columns: 1fr; }
  .magazine-main { min-height: 260px; }
  .feature-hero-card { flex-direction: column; }
  .feature-hero-img-wrap { width: 100%; height: 200px; }
}

@media (max-width: 640px) {
  .series-hero { padding: 2rem 1rem 1.5rem; margin: 0.75rem 0.75rem 0; border-radius: 1rem; }
  .section-tabs-bar { margin: 0.375rem 0.75rem 0; border-radius: 1rem; padding: 0 1rem; }
  .series-content { padding: 1.5rem 1rem; }
  .series-name { font-size: 1.75rem; }
  .layout-newspaper { grid-template-columns: repeat(2, 1fr); }
}

/* ─── Followers Modal ─── */
.followers-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.followers-modal {
  background: var(--bg-primary, #fff);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.followers-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.125rem 1.25rem;
  border-bottom: 1px solid var(--border-light, #eee);
  flex-shrink: 0;
}
.followers-modal-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
}
.followers-modal-count { color: var(--text-tertiary); font-weight: 500; }
.followers-modal-close {
  width: 32px; height: 32px;
  border: none; background: none; cursor: pointer;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  transition: background 0.15s;
}
.followers-modal-close:hover { background: var(--bg-secondary, #f5f5f5); }
.followers-modal-body {
  overflow-y: auto;
  flex: 1;
  padding: 0.5rem 0;
}
.followers-loading, .followers-empty {
  padding: 2.5rem 1.25rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.9375rem;
}
.followers-list { list-style: none; margin: 0; padding: 0; }
.followers-item-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  transition: background 0.1s;
}
.followers-item-link:hover { background: var(--bg-secondary, #f5f5f5); }
.followers-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.followers-avatar--fallback {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--series-accent, #6366f1);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 700;
  flex-shrink: 0;
}
.followers-user-info { display: flex; flex-direction: column; gap: 0.1rem; }
.followers-display-name { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
.followers-username { font-size: 0.8125rem; color: var(--text-tertiary); }
.followers-load-more {
  display: block; width: calc(100% - 2.5rem);
  margin: 0.75rem 1.25rem;
  padding: 0.5rem;
  border: 1px solid var(--border-light, #eee);
  background: none; border-radius: 8px;
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer; color: var(--text-secondary);
  transition: background 0.15s;
}
.followers-load-more:hover { background: var(--bg-secondary, #f5f5f5); }

/* Modal transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
