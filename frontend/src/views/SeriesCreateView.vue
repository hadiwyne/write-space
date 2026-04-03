<template>
  <div class="create-series">
    <div class="create-header">
      <router-link to="/series" class="back-link">
        <i class="pi pi-arrow-left"></i> Series
      </router-link>
      <h1 class="create-title">Create a New Series</h1>
      <p class="create-subtitle">
        Series are curated publications — brand them, organize posts, and invite contributors.
      </p>
    </div>

    <form class="create-form" @submit.prevent="onSubmit">
      <!-- Name -->
      <div class="field">
        <label class="field-label" for="name">Series Name <span class="required">*</span></label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="field-input"
          :class="{ error: errors.name }"
          placeholder="e.g. The Creative Mind"
          maxlength="80"
          required
          @input="onNameInput"
        />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        <span class="field-hint">{{ form.name.length }}/80 characters</span>
      </div>

      <!-- Slug -->
      <div class="field">
        <label class="field-label" for="slug">URL Slug</label>
        <div class="slug-wrap">
          <span class="slug-prefix">/series/</span>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            class="field-input slug-input"
            :class="{ error: errors.slug }"
            placeholder="the-creative-mind"
            maxlength="60"
            pattern="[a-z0-9-]+"
          />
        </div>
        <span v-if="errors.slug" class="field-error">{{ errors.slug }}</span>
      </div>

      <!-- Tagline -->
      <div class="field">
        <label class="field-label" for="tagline">Tagline</label>
        <input
          id="tagline"
          v-model="form.tagline"
          type="text"
          class="field-input"
          placeholder="A short, compelling one-liner"
          maxlength="160"
          @input="onDescriptionChange"
        />
        <span class="field-hint">{{ form.tagline.length }}/160 characters</span>
      </div>

      <!-- Description -->
      <div class="field">
        <label class="field-label" for="description">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          class="field-textarea"
          placeholder="What is this series about? Who is it for?"
          rows="4"
          @input="onDescriptionChange"
        ></textarea>
      </div>

      <!-- Visibility -->
      <div class="field">
        <label class="field-label">Visibility</label>
        <div class="visibility-options">
          <label
            v-for="opt in visibilityOptions"
            :key="opt.value"
            class="vis-option"
            :class="{ selected: form.visibility === opt.value }"
          >
            <input
              type="radio"
              :value="opt.value"
              v-model="form.visibility"
              class="vis-radio"
            />
            <i :class="opt.icon" class="vis-icon"></i>
            <div>
              <span class="vis-label">{{ opt.label }}</span>
              <span class="vis-desc">{{ opt.desc }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Accent Color Suggestion -->
      <div class="field">
        <label class="field-label">Accent Color</label>
        <div class="color-section">
          <div class="color-suggestions" v-if="suggestedPalette.length">
            <span class="suggestions-label">Suggested from your description:</span>
            <div class="palette-swatches">
              <button
                v-for="(color, i) in suggestedPalette"
                :key="i"
                type="button"
                class="swatch"
                :class="{ selected: form.accentColor === color }"
                :style="{ background: color }"
                :title="color"
                @click="form.accentColor = color"
              ></button>
            </div>
          </div>
          <div class="color-picker-row">
            <input
              type="color"
              v-model="form.accentColor"
              class="color-picker"
              title="Custom accent color"
            />
            <span class="color-value">{{ form.accentColor }}</span>
            <button
              type="button"
              class="btn-reset-color"
              @click="form.accentColor = '#6366f1'"
            >Reset</button>
          </div>
        </div>
        <span class="field-hint">Used for buttons, links, and highlights throughout your series.</span>
      </div>

      <!-- Preview -->
      <div class="preview-section">
        <span class="preview-label">Preview</span>
        <div class="preview-card" :style="{ '--preview-accent': form.accentColor }">
          <div class="preview-header" :style="{ background: form.accentColor + '22' }">
            <div class="preview-logo" :style="{ background: form.accentColor }">
              {{ form.name ? form.name[0].toUpperCase() : 'S' }}
            </div>
            <div>
              <div class="preview-name">{{ form.name || 'Series Name' }}</div>
              <div class="preview-tagline">{{ form.tagline || 'Your tagline here' }}</div>
            </div>
          </div>
          <div class="preview-body">
            <span class="preview-follow-btn" :style="{ background: form.accentColor }">Follow</span>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="form-actions">
        <router-link to="/series" class="btn-cancel">Cancel</router-link>
        <button
          type="submit"
          class="btn-submit"
          :disabled="submitting || !form.name.trim()"
          :style="form.accentColor ? { background: form.accentColor } : {}"
        >
          <i v-if="submitting" class="pi pi-spin pi-spinner"></i>
          <span>{{ submitting ? 'Creating…' : 'Create Series' }}</span>
        </button>
      </div>

      <p v-if="submitError" class="submit-error">{{ submitError }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series'

const router = useRouter()
const seriesStore = useSeriesStore()

const form = reactive({
  name: '',
  slug: '',
  tagline: '',
  description: '',
  visibility: 'PUBLIC' as 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE',
  accentColor: '#6366f1',
})

const errors = reactive({ name: '', slug: '' })
const submitting = ref(false)
const submitError = ref('')
const suggestedPalette = ref<string[]>([])

// ─── Tag-to-color mapping for NLP suggestion ─────────────────────────────────

const TOPIC_PALETTES: Record<string, string[]> = {
  poetry: ['#8b5cf6', '#a78bfa', '#7c3aed'],
  poem: ['#8b5cf6', '#a78bfa', '#7c3aed'],
  art: ['#f59e0b', '#fbbf24', '#d97706'],
  design: ['#3b82f6', '#60a5fa', '#2563eb'],
  tech: ['#10b981', '#34d399', '#059669'],
  code: ['#10b981', '#34d399', '#059669'],
  programming: ['#10b981', '#34d399', '#059669'],
  science: ['#06b6d4', '#22d3ee', '#0891b2'],
  philosophy: ['#6366f1', '#818cf8', '#4f46e5'],
  history: ['#92400e', '#b45309', '#78350f'],
  travel: ['#0ea5e9', '#38bdf8', '#0284c7'],
  food: ['#ef4444', '#f87171', '#dc2626'],
  health: ['#84cc16', '#a3e635', '#65a30d'],
  fitness: ['#f97316', '#fb923c', '#ea580c'],
  business: ['#1e40af', '#3b82f6', '#1d4ed8'],
  finance: ['#166534', '#16a34a', '#15803d'],
  music: ['#ec4899', '#f472b6', '#db2777'],
  film: ['#7c3aed', '#8b5cf6', '#6d28d9'],
  sports: ['#dc2626', '#ef4444', '#b91c1c'],
  politics: ['#1d4ed8', '#2563eb', '#1e3a8a'],
  nature: ['#16a34a', '#22c55e', '#15803d'],
  culture: ['#d97706', '#f59e0b', '#b45309'],
  relationships: ['#ec4899', '#f472b6', '#be185d'],
  mental: ['#8b5cf6', '#a78bfa', '#7c3aed'],
  personal: ['#6366f1', '#818cf8', '#4f46e5'],
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function onNameInput() {
  if (!form.slug || form.slug === slugify(form.name.slice(0, -1))) {
    form.slug = slugify(form.name)
  }
  errors.name = form.name.trim().length < 2 ? 'Name must be at least 2 characters' : ''
}

let nlpTimer: ReturnType<typeof setTimeout> | null = null

async function onDescriptionChange() {
  if (nlpTimer) clearTimeout(nlpTimer)
  nlpTimer = setTimeout(async () => {
    const text = (form.tagline + ' ' + form.description).toLowerCase()
    if (!text.trim()) { suggestedPalette.value = []; return }

    try {
      const nlp = (await import('compromise')).default
      const doc = nlp(text)
      const nouns: string[] = doc.nouns().out('array')
      const topics: string[] = [...nouns].map((w: string) => w.toLowerCase())

      const found = new Set<string>()
      for (const topic of topics) {
        for (const key of Object.keys(TOPIC_PALETTES)) {
          if (topic.includes(key) || key.includes(topic)) {
            for (const c of TOPIC_PALETTES[key]) found.add(c)
            break
          }
        }
        if (found.size >= 5) break
      }

      if (found.size === 0) {
        // Fallback: keyword scan
        for (const key of Object.keys(TOPIC_PALETTES)) {
          if (text.includes(key)) {
            for (const c of TOPIC_PALETTES[key]) found.add(c)
            if (found.size >= 3) break
          }
        }
      }

      suggestedPalette.value = Array.from(found).slice(0, 6)
      if (suggestedPalette.value.length && !form.accentColor) {
        form.accentColor = suggestedPalette.value[0]
      }
    } catch {
      suggestedPalette.value = []
    }
  }, 500)
}

const visibilityOptions = [
  { value: 'PUBLIC', label: 'Public', desc: 'Anyone can view and discover this series', icon: 'pi pi-globe' },
  { value: 'FOLLOWERS_ONLY', label: 'Followers only', desc: 'Only your followers can view this series', icon: 'pi pi-users' },
  { value: 'PRIVATE', label: 'Private', desc: 'Only members can view this series', icon: 'pi pi-lock' },
]

function validate(): boolean {
  errors.name = ''
  errors.slug = ''
  if (form.name.trim().length < 2) { errors.name = 'Name must be at least 2 characters'; return false }
  if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) { errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'; return false }
  return true
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    const series = await seriesStore.createSeries({
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim() || undefined,
      visibility: form.visibility,
    })

    // Apply accent color if set
    if (form.accentColor && form.accentColor !== '#6366f1') {
      await seriesStore.updateSeries(series.slug, { accentColor: form.accentColor })
    }

    await router.push(`/series/${series.slug}/settings`)
  } catch (err: any) {
    submitError.value = err?.response?.data?.message || 'Failed to create series. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-series {
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color 0.15s;
}

.back-link:hover { color: var(--accent-primary); }

.create-header { margin-bottom: 2rem; }

.create-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.create-subtitle {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Fields ─── */
.field { display: flex; flex-direction: column; gap: 0.375rem; }

.field-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.required { color: #ef4444; }

.field-input,
.field-textarea {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus,
.field-textarea:focus {
  border-color: var(--accent-primary);
}

.field-input.error,
.field-textarea.error { border-color: #ef4444; }

.field-textarea { resize: vertical; min-height: 100px; }

.field-hint { font-size: 0.8125rem; color: var(--text-tertiary); }

.field-error { font-size: 0.8125rem; color: #ef4444; }

/* ─── Slug ─── */
.slug-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: var(--bg-card);
  transition: border-color 0.15s;
}

.slug-wrap:focus-within { border-color: var(--accent-primary); }

.slug-prefix {
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  white-space: nowrap;
}

.slug-input {
  border: none;
  border-radius: 0;
  flex: 1;
  background: transparent;
}

.slug-input:focus { border-color: transparent; }

/* ─── Visibility ─── */
.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.vis-option {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: border-color 0.15s;
}

.vis-option.selected {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 6%, var(--bg-card));
}

.vis-radio { display: none; }

.vis-icon {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

.vis-option.selected .vis-icon { color: var(--accent-primary); }

.vis-label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.vis-desc {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

/* ─── Color ─── */
.color-section { display: flex; flex-direction: column; gap: 0.75rem; }

.color-suggestions { display: flex; flex-direction: column; gap: 0.5rem; }

.suggestions-label { font-size: 0.8125rem; color: var(--text-secondary); }

.palette-swatches { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.swatch:hover { transform: scale(1.15); }
.swatch.selected { border-color: var(--text-primary); transform: scale(1.1); }

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 48px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-card);
}

.color-value {
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  color: var(--text-secondary);
}

.btn-reset-color {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  text-decoration: underline;
}

/* ─── Preview ─── */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  max-width: 360px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
}

.preview-logo {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

.preview-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-tagline {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

.preview-body {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-light);
}

.preview-follow-btn {
  display: inline-block;
  padding: 0.375rem 1rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
}

/* ─── Actions ─── */
.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s;
}

.btn-cancel:hover { border-color: var(--text-secondary); }

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  background: var(--accent-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-submit:hover:not(:disabled) { opacity: 0.9; }
.btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

.submit-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 640px) {
  .create-series { padding: 1rem; }
  .create-title { font-size: 1.5rem; }
  .form-actions { flex-direction: column; }
  .btn-cancel, .btn-submit { width: 100%; justify-content: center; }
}
</style>
