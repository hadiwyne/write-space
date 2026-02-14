<template>
  <div class="write-page">
    <h1>New post</h1>
    <form @submit.prevent="publish" class="form">
      <div class="form-group">
        <input
          :value="title"
          type="text"
          placeholder="Title"
          required
          class="title-input"
          @input="onTitleInput"
        />
        <p v-if="titleWarningReason" class="title-warning">{{ titleWarningMessage }}</p>
      </div>
      <div class="form-group editor-toolbar">
        <div class="dropdown-wrap" ref="formatDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="formatDropdownOpen" @click="formatDropdownOpen = !formatDropdownOpen">
            <i :class="contentTypeIcon" aria-hidden="true"></i>
            <span>{{ contentTypeLabel }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="formatDropdownOpen" class="dropdown-panel" role="menu">
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: contentType === 'MARKDOWN' }" @click="contentType = 'MARKDOWN'; formatDropdownOpen = false">
                <i class="pi pi-file-edit" aria-hidden="true"></i> Markdown
              </button>
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: contentType === 'HTML' }" @click="contentType = 'HTML'; formatDropdownOpen = false">
                <i class="pi pi-code" aria-hidden="true"></i> HTML
              </button>
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: contentType === 'WYSIWYG' }" @click="contentType = 'WYSIWYG'; formatDropdownOpen = false">
                <i class="pi pi-align-left" aria-hidden="true"></i> Rich text
              </button>
            </div>
          </Transition>
        </div>
        <input ref="wordInputRef" type="file" accept=".docx" class="hidden" @change="onWordUpload" />
        <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageUpload" />
        <button type="button" class="btn btn-sm btn-outline" @click="wordInputRef?.click()">Import Word</button>
        <button
          v-if="contentType !== 'WYSIWYG'"
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="imageCountInContent >= MAX_IMAGES_PER_POST"
          :title="imageCountInContent >= MAX_IMAGES_PER_POST ? 'Maximum 5 images per post' : undefined"
          @click="imageInputRef?.click()"
        >
          Insert media
        </button>
        <button v-if="draftId" type="button" class="btn btn-sm btn-outline" @click="loadVersions">Version history</button>
        <span v-if="lastSavedAt" class="saved-hint">Saved {{ lastSavedAt }}</span>
      </div>
      <p class="upload-hint">Max 5 MB per image. Up to 5 images per post.</p>
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
          <RichTextEditor
            v-if="contentType === 'WYSIWYG'"
            ref="richEditorRef"
            v-model="content"
            :can-add-image="imageCountInContent < MAX_IMAGES_PER_POST"
            @image-upload="onRichEditorImageUpload"
          />
          <textarea
            v-else
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
      <div class="form-group visibility-row">
        <div class="dropdown-wrap" ref="visibilityDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="visibilityDropdownOpen" @click="visibilityDropdownOpen = !visibilityDropdownOpen">
            <i :class="visibilityIcon" aria-hidden="true"></i>
            <span>{{ visibilityLabel }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="visibilityDropdownOpen" class="dropdown-panel" role="menu">
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: visibility === 'PUBLIC' }" @click="visibility = 'PUBLIC'; visibilityDropdownOpen = false">
                <i class="pi pi-globe" aria-hidden="true"></i> Public
              </button>
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: visibility === 'FOLLOWERS_ONLY' }" @click="visibility = 'FOLLOWERS_ONLY'; visibilityDropdownOpen = false">
                <i class="pi pi-users" aria-hidden="true"></i> Followers
              </button>
            </div>
          </Transition>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div v-if="conflictDraft" class="conflict-banner">
        <p>This draft was updated elsewhere. Choose:</p>
        <button type="button" class="btn btn-sm btn-outline" @click="useMine">Keep my version</button>
        <button type="button" class="btn btn-sm btn-outline" @click="useServer">Use server version</button>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-outline" @click="() => saveDraft()" :disabled="savingDraft">Save draft</button>
        <button type="submit" class="btn btn-primary btn-publish" :disabled="loading">
          <i v-if="loading" class="pi pi-spin pi-spinner publish-spinner" aria-hidden="true"></i>
          <span>{{ loading ? 'Publishing' : 'Publish' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import { renderPreview, type ContentType } from '@/utils/preview'
import RichTextEditor from '@/components/RichTextEditor.vue'

const MAX_IMAGES_PER_POST = 5
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_TITLE_WORDS = 20
const MAX_TITLE_CHARS = 120

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).filter(Boolean).length : 0
}

function truncateToWords(s: string, maxWords: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, maxWords).join(' ')
}

function truncateToChars(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s
  return s.slice(0, maxChars)
}

const router = useRouter()
const title = ref('')
const titleWarningReason = ref<'words' | 'chars' | null>(null)
const titleWarningMessage = computed(() => {
  if (titleWarningReason.value === 'words') return 'Maximum 20 words for title.'
  if (titleWarningReason.value === 'chars') return 'Maximum 120 characters for title.'
  return ''
})

function onTitleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value
  // Only truncate when a limit is exceeded so we don't strip spaces between words
  let truncated = raw
  if (countWords(raw) > MAX_TITLE_WORDS) truncated = truncateToWords(raw, MAX_TITLE_WORDS)
  if (truncated.length > MAX_TITLE_CHARS) truncated = truncateToChars(truncated, MAX_TITLE_CHARS)
  const overWords = countWords(raw) > MAX_TITLE_WORDS
  const overChars = raw.length > MAX_TITLE_CHARS
  title.value = truncated
  if (raw !== truncated) target.value = truncated
  if (overChars) titleWarningReason.value = 'chars'
  else if (overWords) titleWarningReason.value = 'words'
  else titleWarningReason.value = null
}
const content = ref('')
const contentType = ref<ContentType>('MARKDOWN')
const tagsStr = ref('')
const visibility = ref<'PUBLIC' | 'FOLLOWERS_ONLY'>('PUBLIC')
const formatDropdownOpen = ref(false)
const visibilityDropdownOpen = ref(false)
const formatDropdownRef = ref<HTMLElement | null>(null)
const visibilityDropdownRef = ref<HTMLElement | null>(null)

const contentTypeLabel = computed(() => {
  if (contentType.value === 'MARKDOWN') return 'Markdown'
  if (contentType.value === 'HTML') return 'HTML'
  return 'Rich text'
})
const contentTypeIcon = computed(() => {
  if (contentType.value === 'MARKDOWN') return 'pi pi-file-edit'
  if (contentType.value === 'HTML') return 'pi pi-code'
  return 'pi pi-align-left'
})
const visibilityLabel = computed(() => (visibility.value === 'PUBLIC' ? 'Public' : 'Followers'))
const visibilityIcon = computed(() => (visibility.value === 'PUBLIC' ? 'pi pi-globe' : 'pi pi-users'))

function onWritePageDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (formatDropdownRef.value && !formatDropdownRef.value.contains(target)) formatDropdownOpen.value = false
  if (visibilityDropdownRef.value && !visibilityDropdownRef.value.contains(target)) visibilityDropdownOpen.value = false
}
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
const richEditorRef = ref<InstanceType<typeof RichTextEditor> | null>(null)
const previewHtml = computed(() => renderPreview(content.value, contentType.value))

function countImagesInContent(text: string, type: ContentType): number {
  if (!text) return 0
  if (type === 'MARKDOWN') return (text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length
  return (text.match(/<img\s/gi) || []).length
}
const imageCountInContent = computed(() => countImagesInContent(content.value, contentType.value))

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
onMounted(() => document.addEventListener('click', onWritePageDocumentClick))
onUnmounted(() => {
  document.removeEventListener('click', onWritePageDocumentClick)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

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
      conflictDraft.value = err.response.data.serverDraft as unknown as typeof conflictDraft.value
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
      visibility: visibility.value,
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

function getUploadErrorMessage(err: unknown): string {
  const msg = err && typeof err === 'object' && 'response' in err
    ? (err.response as { data?: { message?: string | string[] } })?.data?.message
    : undefined
  if (Array.isArray(msg)) return msg[0] ?? 'Failed to upload image'
  if (typeof msg === 'string') return msg
  return 'Failed to upload image'
}

async function onImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  if (imageCountInContent.value >= MAX_IMAGES_PER_POST) {
    error.value = 'Maximum 5 images per post.'
    return
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    error.value = 'Image must be 5 MB or smaller.'
    return
  }
  error.value = ''
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
  } catch (err) {
    error.value = getUploadErrorMessage(err)
  }
}

async function onRichEditorImageUpload(file: File) {
  if (imageCountInContent.value >= MAX_IMAGES_PER_POST) {
    error.value = 'Maximum 5 images per post.'
    return
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    error.value = 'Image must be 5 MB or smaller.'
    return
  }
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post<{ url: string }>('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    richEditorRef.value?.addImage(data.url)
  } catch (err) {
    error.value = getUploadErrorMessage(err)
  }
}
</script>

<style scoped>
.write-page { padding: 0; max-width: 720px; margin: 0 auto; width: 100%; }
.write-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 1.25rem; font-weight: 700; }
.form { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
.form-group:first-of-type { margin-bottom: 0.25rem; }
.title-input { width: 100%; min-width: 0; font-size: clamp(1.125rem, 4vw, 1.5rem); padding: 0.5rem 0; border: none; border-bottom: 1px solid var(--gray-200); background: transparent; }
.title-warning { font-size: 0.8125rem; color: var(--accent-burgundy, #6b2c3e); margin: 0.25rem 0 0; }
.editor-toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.dropdown-wrap { position: relative; }
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.dropdown-trigger:hover {
  border-color: var(--border-medium);
}
.dropdown-trigger:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.dropdown-chevron { font-size: 0.75rem; color: var(--text-tertiary); margin-left: 0.25rem; }
.dropdown-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 12rem;
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}
.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.dropdown-option:hover {
  background: var(--bg-primary);
}
.dropdown-option.active {
  background: rgba(139, 69, 19, 0.08);
  color: var(--accent-primary);
  font-weight: 600;
}
.dropdown-option .pi { color: inherit; }
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.hidden { display: none; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.saved-hint { font-size: 0.75rem; color: var(--gray-700); }
.editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; min-height: 420px; }
@media (max-width: 768px) { .editor-row { grid-template-columns: 1fr; min-height: 340px; } }
.editor-pane { min-height: 0; min-width: 0; }
.editor { width: 100%; height: 100%; min-height: 380px; padding: 1rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-family: inherit; resize: vertical; box-sizing: border-box; font-size: 0.9375rem; line-height: 1.6; }
@media (max-width: 480px) {
  .editor-toolbar { gap: 0.5rem; }
  .editor { min-height: 280px; padding: 0.5rem; }
}
.preview-pane { border: 1px solid var(--gray-200); border-radius: var(--radius); background: var(--gray-50); overflow: auto; min-height: 0; }
.preview-label { font-size: 0.75rem; color: var(--gray-700); padding: 0.25rem 0.5rem; border-bottom: 1px solid var(--gray-200); }
.preview-content { padding: 0.75rem; font-size: 0.9375rem; line-height: 1.6; }
.preview-content :deep(img) { max-width: 100%; }
.tags-input { width: 100%; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); }
.visibility-row { display: flex; align-items: center; gap: 0.75rem; }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.conflict-banner { padding: 0.75rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--radius); }
.conflict-banner p { margin: 0 0 0.5rem; font-size: 0.875rem; }
.versions-panel { padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: var(--radius); background: var(--gray-50); margin-top: 0.5rem; }
.versions-title { font-size: 0.875rem; margin: 0 0 0.5rem; }
.versions-list { list-style: none; margin: 0; padding: 0; }
.versions-item { display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0; font-size: 0.875rem; }
.btn-ghost { background: transparent; border: none; color: var(--gray-700); cursor: pointer; }
.upload-hint { font-size: 0.8125rem; color: var(--gray-600); margin: -0.5rem 0 0; }
.actions { display: flex; gap: 0.75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light, #e5e7eb); align-items: center; flex-wrap: wrap; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; font-weight: 600; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-publish { display: inline-flex; align-items: center; gap: 0.5rem; }
.btn-publish:disabled { opacity: 0.8; cursor: not-allowed; }
.publish-spinner { font-size: 1.125rem; }
.btn-outline { background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
</style>
