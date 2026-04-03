import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, apiBaseUrl } from '@/api/client'

export interface SeriesInfo {
  id: string
  ownerId: string
  name: string
  slug: string
  tagline?: string | null
  description?: string | null
  logoMimeType?: string | null
  wordmarkMimeType?: string | null
  coverMimeType?: string | null
  socialPreviewMimeType?: string | null
  coverBgColor?: string | null
  accentColor?: string | null
  bgColor?: string | null
  bgImageMimeType?: string | null
  coverFocalY?: number | null
  fontFamily?: string | null
  layoutMode: string
  postListMode: string
  showTopPosts: boolean
  navLinks?: any[] | null
  pinnedPostIds: string[]
  showTagline: boolean
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'
  followerCount: number
  postCount: number
  isFollowing: boolean
  isMember?: boolean
  memberRole?: 'OWNER' | 'EDITOR' | 'CONTRIBUTOR' | null
  createdAt: string
  updatedAt: string
}

export interface SeriesMember {
  id?: string
  role: 'OWNER' | 'EDITOR' | 'CONTRIBUTOR'
  joinedAt: string
  user: {
    id: string
    username: string
    displayName?: string | null
    avatarUrl?: string | null
    avatarShape?: string | null
    avatarFrame?: any
    badgeUrl?: string | null
  }
}

export function seriesImageUrl(slug: string, type: 'logo' | 'wordmark' | 'cover' | 'social-preview'): string {
  const base = apiBaseUrl.replace(/\/$/, '')
  return `${base}/series/${encodeURIComponent(slug)}/images/${type}`
}

export const useSeriesStore = defineStore('series', () => {
  /** Series the current user belongs to (for write view dropdown) */
  const mySeries = ref<SeriesInfo[]>([])
  const mySeriesLoaded = ref(false)

  async function fetchMySeries() {
    try {
      const { data } = await api.get<SeriesInfo[]>('/series/my', { cache: false })
      mySeries.value = data
      mySeriesLoaded.value = true
    } catch {
      mySeries.value = []
    }
  }

  async function createSeries(payload: {
    name: string
    slug?: string
    tagline?: string
    description?: string
    visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'
  }): Promise<SeriesInfo> {
    const { data } = await api.post<SeriesInfo>('/series', payload, { cache: false })
    mySeries.value.unshift(data)
    return data
  }

  async function updateSeries(slug: string, payload: Partial<SeriesInfo>): Promise<SeriesInfo> {
    const { data } = await api.patch<SeriesInfo>(`/series/${slug}`, payload, { cache: false })
    const idx = mySeries.value.findIndex((s) => s.slug === slug)
    if (idx !== -1) mySeries.value[idx] = { ...mySeries.value[idx], ...data }
    return data
  }

  async function deleteSeries(slug: string) {
    await api.delete(`/series/${slug}`, { cache: false })
    mySeries.value = mySeries.value.filter((s) => s.slug !== slug)
  }

  async function followSeries(slug: string) {
    await api.post(`/series/${slug}/follow`, {}, { cache: false })
  }

  async function unfollowSeries(slug: string) {
    await api.delete(`/series/${slug}/follow`, { cache: false })
  }

  async function uploadImage(
    slug: string,
    type: 'logo' | 'wordmark' | 'cover' | 'social-preview',
    file: File,
    onProgress?: (pct: number) => void,
  ) {
    const form = new FormData()
    form.append('image', file)
    await api.post(`/series/${slug}/images/${type}`, form, {
      cache: false,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
    })
  }

  async function deleteImage(slug: string, type: 'logo' | 'wordmark' | 'cover' | 'social-preview') {
    await api.delete(`/series/${slug}/images/${type}`, { cache: false })
  }

  function reset() {
    mySeries.value = []
    mySeriesLoaded.value = false
  }

  return {
    mySeries,
    mySeriesLoaded,
    fetchMySeries,
    createSeries,
    updateSeries,
    deleteSeries,
    followSeries,
    unfollowSeries,
    uploadImage,
    deleteImage,
    reset,
  }
})
