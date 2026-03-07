<template>
  <div class="drafts-page">
    <h1>Drafts</h1>
    <p class="intro">Continue writing or delete drafts. Opening a draft loads it in the editor.</p>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="drafts.length === 0" class="empty">No drafts.</div>
    <ul v-else class="draft-list">
      <li v-for="d in drafts" :key="d.id" class="draft-item">
        <router-link :to="draftLink(d)" class="draft-link">
          <span class="draft-title">{{ draftTitle(d) }}</span>
          <span class="draft-preview">{{ draftPreview(d) }}</span>
          <span class="draft-meta">Saved {{ formatDate(d.lastSavedAt) }}</span>
        </router-link>
        <button
          type="button"
          class="draft-delete"
          aria-label="Delete draft"
          v-tooltip.bottom="'Delete draft'"
          @click.stop="confirmDelete(d.id)"
        >
          <i class="pi pi-trash" aria-hidden="true"></i>
        </button>
      </li>
    </ul>

    <ConfirmModal
      :open="deleteConfirmOpen"
      title="Delete draft?"
      message="This draft will be permanently deleted. This cannot be undone."
      confirm-label="Delete"
      cancel-label="Cancel"
      variant="danger"
      @confirm="onDeleteConfirm"
      @cancel="deleteConfirmOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import ConfirmModal from '@/components/ConfirmModal.vue'

interface Draft {
  id: string
  title: string | null
  content: string
  contentType: string
  lastSavedAt: string
}

const drafts = ref<Draft[]>([])
const loading = ref(true)
const deleteConfirmOpen = ref(false)
const deleteConfirmId = ref<string | null>(null)

onMounted(async () => {
  try {
    const { data } = await api.get<Draft[]>('/drafts', { params: { limit: 50 } })
    drafts.value = Array.isArray(data) ? data : []
  } catch {
    drafts.value = []
  } finally {
    loading.value = false
  }
})

function draftTitle(d: Draft): string {
  const t = d.title?.trim()
  if (t) return t
  const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const preview = strip(d.content).slice(0, 50)
  return preview ? preview + (strip(d.content).length > 50 ? '…' : '') : 'Untitled'
}

function draftPreview(d: Draft): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const text = strip(d.content)
  if (!text) return ''
  return text.length <= 80 ? text : text.slice(0, 80) + '…'
}

function draftLink(d: Draft): { path: string; query: { draft: string } } {
  return { path: '/write', query: { draft: d.id } }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

function confirmDelete(id: string) {
  deleteConfirmId.value = id
  deleteConfirmOpen.value = true
}

async function onDeleteConfirm() {
  const id = deleteConfirmId.value
  deleteConfirmOpen.value = false
  deleteConfirmId.value = null
  if (!id) return
  try {
    await api.delete(`/drafts/${id}`)
    drafts.value = drafts.value.filter((d) => d.id !== id)
  } catch {
    // ignore
  }
}
</script>

<style scoped>
.drafts-page { padding: 0; }
.drafts-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 0.5rem; }
.intro { color: var(--gray-700); font-size: 0.9375rem; margin: 0 0 1.5rem; }
.loading, .empty { padding: 1rem 0; color: var(--gray-700); }
.draft-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.draft-item { display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border-color, #e5e7eb); border-radius: 8px; overflow: hidden; }
.draft-link { flex: 1; padding: 0.75rem 1rem; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.draft-link:hover { background: var(--gray-100, #f3f4f6); }
.draft-title { font-weight: 600; color: var(--text-primary, #111); }
.draft-preview { font-size: 0.875rem; color: var(--gray-700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.draft-meta { font-size: 0.8125rem; color: var(--gray-500); }
.draft-delete { flex-shrink: 0; padding: 0.5rem; border: none; background: none; color: var(--gray-500); cursor: pointer; border-radius: 4px; }
.draft-delete:hover { background: var(--red-100, #fee2e2); color: var(--red-700, #b91c1c); }
</style>
