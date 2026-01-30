<template>
  <div class="write-page">
    <h1>New post</h1>
    <form @submit.prevent="publish" class="form">
      <div class="form-group">
        <input v-model="title" type="text" placeholder="Title" required class="title-input" />
      </div>
      <div class="form-group editor-toolbar">
        <select v-model="contentType" class="format-select">
          <option value="MARKDOWN">Markdown</option>
          <option value="HTML">HTML</option>
          <option value="WYSIWYG">Rich text (HTML)</option>
        </select>
        <input ref="wordInputRef" type="file" accept=".docx" class="hidden" @change="onWordUpload" />
        <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageUpload" />
        <button type="button" class="btn btn-sm btn-outline" @click="wordInputRef?.click()">Import Word</button>
        <button type="button" class="btn btn-sm btn-outline" @click="imageInputRef?.click()">Insert image</button>
        <button v-if="draftId" type="button" class="btn btn-sm btn-outline" @click="loadVersions">Version history</button>
        <span v-if="lastSavedAt" class="saved-hint">Saved {{ lastSavedAt }}</span>
      </div>
      <div v-if="versionsOpen" class="versions-panel">
        <p v-if="versionsLoading">Loading…</p>
        <template v-else-if="versions.length">
          <p class="versions-title">Past versions (restore to load that content)</p>
          <ul class="versions-list">
            <li v-for="v in versions" :key="v.id" class="versions-item">
              <span>v{{ v.version }} – {{ formatDate(v.lastSavedAt) }}</span>
              <button type="button" class="btn btn-sm btn-outline" @click="restoreVersion(v.id)">Restore</button>
            </li>
          </ul>
        </template>
        <p v-else>No past versions.</p>
        <button type="button" class="btn btn-sm btn-ghost" @click="versionsOpen = false">Close</button>
      </div>
      <div class="form-group editor-row">
        <div class="editor-pane">
          <textarea
            ref="editorRef"
            v-model="content"
            placeholder="Write your story…"
            class="editor"
            rows="20"
          ></textarea>
        </div>
        <div class="preview-pane">
          <div class="preview-label">Preview</div>
          <div class="preview-content" v-html="previewHtml"></div>
        </div>
      </div>
      <div class="form-group">
        <input v-model="tagsStr" type="text" placeholder="Tags (comma-separated)" class="tags-input" />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div v-if="conflictDraft" class="conflict-banner">
        <p>This draft was updated elsewhere. Choose:</p>
        <button type="button" class="btn btn-sm btn-outline" @click="useMine">Keep my version</button>
        <button type="button" class="btn btn-sm btn-outline" @click="useServer">Use server version</button>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-outline" @click="saveDraft" :disabled="savingDraft">Save draft</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">Publish</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import { renderPreview, type ContentType } from '@/utils/preview'

const router = useRouter()
const title = ref('')
const content = ref('')
const contentType = ref<ContentType>('MARKDOWN')
const tagsStr = ref('')
const error = ref('')
const loading = ref(false)
const savingDraft = ref(false)
const lastSavedAt = ref('')
const conflictDraft = ref<{ id: string; version: number; content: string; title: string | null; contentType: string } | null>(null)
const draftId = ref<string | null>(null)
const draftVersion = ref(0)
const versionsOpen = ref(false)
const versions = ref<{ id: string; version: number; lastSavedAt: string }[]>([])
const versionsLoading = ref(false)
const wordInputRef = ref<HTMLInputElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const editorRef = ref<HTMLTextAreaElement | null>(null)
const previewHtml = computed(() => renderPreview(content.value, contentType.value))

function tags(): string[] {
  return tagsStr.value.split(',').map((t) => t.trim()).filter(Boolean)
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (content.value || title.value) saveDraft(true)
  }, 3000)
}

watch([content, title], () => scheduleAutoSave())
onUnmounted(() => { if (autoSaveTimer) clearTimeout(autoSaveTimer) })

async function saveDraft(silent = false) {
  if (!silent) savingDraft.value = true
  error.value = ''
  conflictDraft.value = null
  try {
    const payload: { content: string; contentType: string; title?: string; id?: string; version?: number } = {
      content: content.value,
      contentType: contentType.value,
      title: title.value || undefined,
    }
    if (draftId.value) {
      payload.id = draftId.value
      payload.version = draftVersion.value
    }
    const { data } = await api.post('/drafts', payload)
    draftId.value = data.id
    draftVersion.value = data.version ?? 1
    lastSavedAt.value = new Date().toLocaleTimeString()
    if (!silent) alert('Draft saved')
  } catch (e: unknown) {
    const err = e as { response?: { status: number; data?: { serverDraft?: unknown } } }
    if (err.response?.status === 409 && err.response?.data?.serverDraft) {
      conflictDraft.value = err.response.data.serverDraft as typeof conflictDraft.value
    } else {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save draft'
    }
  } finally {
    savingDraft.value = false
  }
}

function useMine() {
  conflictDraft.value = null
  saveDraft()
}

function useServer() {
  if (!conflictDraft.value) return
  title.value = conflictDraft.value.title || ''
  content.value = conflictDraft.value.content
  contentType.value = conflictDraft.value.contentType as ContentType
  draftVersion.value = conflictDraft.value.version
  conflictDraft.value = null
}

async function publish() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/posts', {
      title: title.value,
      content: content.value,
      contentType: contentType.value,
      tags: tags(),
      isPublished: true,
    })
    router.push(`/posts/${data.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish'
  } finally {
    loading.value = false
  }
}

async function onWordUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<{ html: string }>('/documents/parse-docx', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    content.value = (content.value ? content.value + '\n\n' : '') + data.html
    contentType.value = 'HTML'
  } catch {
    error.value = 'Failed to parse Word document'
  }
}

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

async function loadVersions() {
  if (!draftId.value) return
  versionsOpen.value = true
  versionsLoading.value = true
  try {
    const { data } = await api.get<{ versions: { id: string; version: number; lastSavedAt: string }[] }>(`/drafts/${draftId.value}/versions`)
    versions.value = data.versions || []
  } catch {
    versions.value = []
  } finally {
    versionsLoading.value = false
  }
}

async function restoreVersion(versionId: string) {
  if (!draftId.value) return
  try {
    const { data } = await api.post(`/drafts/${draftId.value}/restore/${versionId}`)
    title.value = data.title || ''
    content.value = data.content
    contentType.value = data.contentType as ContentType
    draftVersion.value = data.version ?? draftVersion.value
    versionsOpen.value = false
  } catch {
    error.value = 'Failed to restore version'
  }
}

async function onImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post<{ url: string }>('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const insert = contentType.value === 'MARKDOWN' ? `![image](${data.url})` : `<img src="${data.url}" alt="uploaded" />`
    const el = editorRef.value
    if (el) {
      const start = el.selectionStart
      const end = el.selectionEnd
      const before = content.value.slice(0, start)
      const after = content.value.slice(end)
      content.value = before + insert + after
      nextTick(() => { el.selectionStart = el.selectionEnd = start + insert.length })
    } else {
      content.value += insert
    }
  } catch {
    error.value = 'Failed to upload image'
  }
}
</script>

<style scoped>
.write-page { padding: 0; }
.write-page h1 { font-size: 1.5rem; margin: 0 0 1rem; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.title-input { width: 100%; font-size: 1.5rem; padding: 0.5rem 0; border: none; border-bottom: 1px solid var(--gray-200); background: transparent; }
.format-select { padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius); width: auto; }
.editor-toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.hidden { display: none; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.saved-hint { font-size: 0.75rem; color: var(--gray-700); }
.editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; min-height: 400px; }
@media (max-width: 768px) { .editor-row { grid-template-columns: 1fr; } }
.editor-pane { min-height: 0; }
.editor { width: 100%; height: 100%; min-height: 360px; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-family: inherit; resize: vertical; }
.preview-pane { border: 1px solid var(--gray-200); border-radius: var(--radius); background: var(--gray-50); overflow: auto; min-height: 0; }
.preview-label { font-size: 0.75rem; color: var(--gray-700); padding: 0.25rem 0.5rem; border-bottom: 1px solid var(--gray-200); }
.preview-content { padding: 0.75rem; font-size: 0.9375rem; line-height: 1.6; }
.preview-content :deep(img) { max-width: 100%; }
.tags-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.conflict-banner { padding: 0.75rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--radius); }
.conflict-banner p { margin: 0 0 0.5rem; font-size: 0.875rem; }
.versions-panel { padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: var(--radius); background: var(--gray-50); margin-top: 0.5rem; }
.versions-title { font-size: 0.875rem; margin: 0 0 0.5rem; }
.versions-list { list-style: none; margin: 0; padding: 0; }
.versions-item { display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0; font-size: 0.875rem; }
.btn-ghost { background: transparent; border: none; color: var(--gray-700); cursor: pointer; }
.actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-outline { background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
</style>
