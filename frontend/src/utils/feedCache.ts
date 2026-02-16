/**
 * Cache for feed list per tab (Latest, Popular, Friends) so switching tabs
 * shows cached list immediately while fresh data loads.
 */

const CACHE_KEY = 'writespace_feed_cache'
const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

interface CachedFeed {
  at: number
  posts: unknown[]
}

function storageKey(sort: string, tag: string): string {
  const t = tag.trim()
  return t ? `${sort}|${t}` : sort
}

function loadAll(): Record<string, CachedFeed> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, CachedFeed>
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    // ignore
  }
  return {}
}

function saveAll(state: Record<string, CachedFeed>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

/** Get cached feed list for this tab if still fresh. */
export function getCachedFeed(sort: string, tagFilter: string): unknown[] | null {
  const key = storageKey(sort, tagFilter)
  const state = loadAll()
  const entry = state[key]
  if (!entry?.posts || !Array.isArray(entry.posts)) return null
  if (Date.now() - entry.at > MAX_AGE_MS) return null
  return entry.posts
}

/** Store feed list for this tab. */
export function setCachedFeed(sort: string, tagFilter: string, posts: unknown[]): void {
  const key = storageKey(sort, tagFilter)
  const state = loadAll()
  state[key] = { at: Date.now(), posts }
  saveAll(state)
}
