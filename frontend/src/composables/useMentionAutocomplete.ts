import { ref, nextTick } from 'vue'
import { api } from '@/api/client'

export interface MentionUser {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  avatarShape?: string | null
}

/** Get mention state from content and cursor: { query, start, end } or null. */
export function getMentionState(content: string, cursor: number): { query: string; start: number; end: number } | null {
  if (cursor <= 0 || typeof content !== 'string') return null
  const before = content.slice(0, cursor)
  const lastAt = before.lastIndexOf('@')
  if (lastAt === -1) return null
  const between = content.slice(lastAt + 1, cursor)
  if (/[\s\n]/.test(between)) return null
  return { query: between, start: lastAt, end: cursor }
}

export function useMentionAutocomplete(contentRef: { value: string }, textareaRef: { value: HTMLTextAreaElement | null }) {
  const mentionOpen = ref(false)
  const mentionCandidates = ref<MentionUser[]>([])
  const mentionLoading = ref(false)
  const mentionQuery = ref('')
  const mentionStart = ref(0)
  const mentionEnd = ref(0)
  const mentionSelectedIndex = ref(0)
  let searchAbort: AbortController | null = null
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  function closeMention() {
    mentionOpen.value = false
    mentionLoading.value = false
    mentionCandidates.value = []
    mentionQuery.value = ''
    mentionSelectedIndex.value = 0
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
    if (searchAbort) {
      searchAbort.abort()
      searchAbort = null
    }
  }

  /** Normalize API user to MentionUser (handles various backend key shapes). */
  function toMentionUser(u: Record<string, unknown>): MentionUser {
    const username = u.username ?? u.user_name ?? u.userName
    return {
      id: String((u.id ?? u.user_id) ?? ''),
      username: username != null ? String(username) : '',
      displayName: (u.displayName ?? u.display_name) != null ? String(u.displayName ?? u.display_name) : null,
      avatarUrl: (u.avatarUrl ?? u.avatar_url) != null ? String(u.avatarUrl ?? u.avatar_url) : null,
      avatarShape: (u.avatarShape ?? u.avatar_shape) != null ? String(u.avatarShape ?? u.avatar_shape) : null,
    }
  }

  async function search(q: string) {
    if (!q) {
      mentionCandidates.value = []
      return
    }
    if (searchAbort) searchAbort.abort()
    searchAbort = new AbortController()
    mentionLoading.value = true
    try {
      const { data } = await api.get<unknown>('/users/search', {
        params: { q, limit: 10 },
        signal: searchAbort.signal,
      })
      const raw = Array.isArray(data) ? data : (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data) ? (data as { data: unknown[] }).data : [])
      const list = Array.isArray(raw) ? raw : []
      const normalized = list
        .map((item) => toMentionUser(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}))
        .filter((u) => u.username.length > 0)
      mentionCandidates.value = normalized
      mentionSelectedIndex.value = 0
    } catch {
      mentionCandidates.value = []
    } finally {
      mentionLoading.value = false
      searchAbort = null
    }
  }

  function updateMentionState(cursor: number) {
    const content = contentRef.value
    const state = getMentionState(content, cursor)
    if (!state || state.query === '') {
      closeMention()
      return
    }
    mentionQuery.value = state.query
    mentionStart.value = state.start
    mentionEnd.value = state.end
    if (!mentionOpen.value) mentionOpen.value = true
    mentionLoading.value = true
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => search(state.query), 200)
  }

  function selectMention(username: string) {
    const safeUsername = username != null && typeof username === 'string' ? username : ''
    if (!safeUsername) return
    const content = contentRef.value
    const before = content.slice(0, mentionStart.value)
    const after = content.slice(mentionEnd.value)
    const insert = `@${safeUsername} `
    const newContent = before + insert + after
    contentRef.value = newContent
    const newCursor = mentionStart.value + insert.length
    closeMention()
    nextTick(() => {
      const el = textareaRef.value
      if (el) {
        el.focus()
        el.setSelectionRange(newCursor, newCursor)
      }
    })
  }

  function onKeydown(e: KeyboardEvent) {
    if (!mentionOpen.value) return
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMention()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      mentionSelectedIndex.value = Math.min(mentionSelectedIndex.value + 1, mentionCandidates.value.length - 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      mentionSelectedIndex.value = Math.max(mentionSelectedIndex.value - 1, 0)
      return
    }
    if (e.key === 'Enter' && mentionCandidates.value.length > 0) {
      e.preventDefault()
      const user = mentionCandidates.value[mentionSelectedIndex.value]
      if (user?.username) selectMention(user.username)
    }
  }

  return {
    mentionOpen,
    mentionCandidates,
    mentionLoading,
    mentionQuery,
    mentionStart,
    mentionEnd,
    mentionSelectedIndex,
    updateMentionState,
    selectMention,
    closeMention,
    onKeydown,
  }
}

function nextTick(fn: () => void) {
  Promise.resolve().then(fn)
}
