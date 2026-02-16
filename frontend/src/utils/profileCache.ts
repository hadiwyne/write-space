/**
 * In-memory + localStorage cache for user profiles to speed up navigation.
 * Keyed by username. Shows cached profile immediately while fresh data loads.
 */

const CACHE_KEY = 'writespace_profile_cache'
const MAX_PROFILES = 30

interface CachedEntry {
  at: number
  data: unknown
}

interface CacheState {
  order: string[]
  profiles: Record<string, CachedEntry>
}

function loadState(): CacheState {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CacheState
      if (parsed.order && parsed.profiles && typeof parsed.profiles === 'object') {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return { order: [], profiles: {} }
}

function saveState(state: CacheState): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    // quota or disabled localStorage
  }
}

export function getCachedProfile(username: string): unknown | null {
  const state = loadState()
  const entry = state.profiles[username]
  if (!entry?.data) return null
  return entry.data
}

export function setCachedProfile(username: string, profile: unknown): void {
  const state = loadState()
  const had = username in state.profiles
  state.profiles[username] = { at: Date.now(), data: profile }
  if (!had) {
    state.order.push(username)
    while (state.order.length > MAX_PROFILES) {
      const oldest = state.order.shift()
      if (oldest) delete state.profiles[oldest]
    }
  }
  saveState(state)
}

/** Cache multiple profiles (e.g. from followers/following list). */
export function setCachedProfiles(profiles: unknown[]): void {
  const state = loadState()
  for (const p of profiles) {
    const username = (p as { username?: string })?.username
    if (username) {
      const had = username in state.profiles
      state.profiles[username] = { at: Date.now(), data: p }
      if (!had) state.order.push(username)
    }
  }
  while (state.order.length > MAX_PROFILES) {
    const oldest = state.order.shift()
    if (oldest) delete state.profiles[oldest]
  }
  saveState(state)
}
