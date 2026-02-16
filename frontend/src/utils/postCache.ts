/**
 * In-memory + localStorage cache for posts to speed up navigation (feed ↔ post).
 * Shows cached post immediately while fresh data loads.
 */

const CACHE_KEY = 'writespace_post_cache'
const MAX_POSTS = 25

interface CachedEntry {
  at: number
  data: unknown
}

interface CacheState {
  order: string[]
  posts: Record<string, CachedEntry>
}

function loadState(): CacheState {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CacheState
      if (parsed.order && parsed.posts && typeof parsed.posts === 'object') {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return { order: [], posts: {} }
}

function saveState(state: CacheState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    // quota or disabled localStorage
  }
}

export function getCachedPost(id: string): unknown | null {
  const state = loadState()
  const entry = state.posts[id]
  if (!entry?.data) return null
  return entry.data
}

export function setCachedPost(id: string, post: unknown): void {
  const state = loadState()
  const had = id in state.posts
  state.posts[id] = { at: Date.now(), data: post }
  if (!had) {
    state.order.push(id)
    while (state.order.length > MAX_POSTS) {
      const oldest = state.order.shift()
      if (oldest) delete state.posts[oldest]
    }
  }
  saveState(state)
}

/** Cache multiple posts (e.g. from feed). */
export function setCachedPosts(posts: unknown[]): void {
  const state = loadState()
  for (const p of posts) {
    const id = (p as { id?: string })?.id
    if (id) {
      const had = id in state.posts
      state.posts[id] = { at: Date.now(), data: p }
      if (!had) state.order.push(id)
    }
  }
  while (state.order.length > MAX_POSTS) {
    const oldest = state.order.shift()
    if (oldest) delete state.posts[oldest]
  }
  saveState(state)
}
