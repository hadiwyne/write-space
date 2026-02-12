<template>
  <div class="customization-page">
    <h1>Customization</h1>
    <p class="intro">Change how WriteSpace looks for you.</p>

    <section class="theme-section templates-section">
      <h2 class="section-title">Theme templates</h2>

      <h3 class="subsection-title">Light</h3>
      <div class="templates-grid">
        <button
          v-for="t in theme.lightTemplatesList"
          :key="t.id"
          type="button"
          class="template-card"
          :aria-label="`Apply ${t.name} theme`"
          @click="applyTemplateAndClearDirty(t.id)"
        >
          <span class="template-preview" :style="previewStyle(t.palette)"></span>
          <span class="template-name">{{ t.name }}</span>
        </button>
      </div>

      <h3 class="subsection-title">Dark</h3>
      <div class="templates-grid">
        <button
          v-for="t in theme.darkTemplatesList"
          :key="t.id"
          type="button"
          class="template-card"
          :aria-label="`Apply ${t.name} theme`"
          @click="applyTemplateAndClearDirty(t.id)"
        >
          <span class="template-preview" :style="previewStyle(t.palette)"></span>
          <span class="template-name">{{ t.name }}</span>
        </button>
      </div>

      <template v-if="theme.userTemplates.length">
        <h3 class="subsection-title">Your saved themes</h3>
        <div class="templates-grid">
          <div
            v-for="t in theme.userTemplates"
            :key="t.id"
            class="template-card-wrap"
          >
            <button
              type="button"
              class="template-card"
              :aria-label="`Apply ${t.name} theme`"
              @click="applyTemplateAndClearDirty(t.id)"
            >
              <span class="template-preview" :style="previewStyle(t.palette)"></span>
              <span class="template-name">{{ t.name }}</span>
            </button>
            <button
              type="button"
              class="template-delete"
              :aria-label="`Delete ${t.name} theme`"
              title="Delete theme"
              @click.stop="onDeleteUserTheme(t.id)"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </template>
    </section>

    <section v-for="(keys, group) in theme.THEME_KEYS" :key="group" class="theme-section">
      <h2 class="section-title">{{ sectionTitles[group] }}</h2>
      <div class="color-grid">
        <div v-for="key in keys" :key="key" class="color-row">
          <label :for="`color-${key}`" class="color-label">{{ colorLabels[key] }}</label>
          <div class="color-input-wrap">
            <input
              :id="`color-${key}`"
              type="color"
              :value="theme.get(key)"
              class="color-picker color-picker-desktop"
              :aria-label="colorLabels[key]"
              @input="onColorInput(key, $event)"
            />
            <button
              type="button"
              class="color-adjust-btn"
              :aria-label="`Adjust ${colorLabels[key]} with sliders`"
              :title="`Adjust ${colorLabels[key]}`"
              :style="{ backgroundColor: theme.get(key) }"
              @click="openColorEditor(key)"
            >
              <span class="color-adjust-btn-label">Adjust</span>
            </button>
            <input
              :id="`hex-${key}`"
              type="text"
              :value="theme.get(key)"
              class="color-hex"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              inputmode="text"
              :aria-label="`${colorLabels[key]} hex code`"
              :placeholder="theme.get(key)"
              @input="onHexInput(key, $event)"
            />
            <button
              type="button"
              class="btn-icon-small"
              :aria-label="`Randomize ${colorLabels[key]}`"
              title="Randomize"
              @click="randomizeOne(key)"
            >
              <i class="pi pi-play" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="btn-icon-small"
              :aria-label="`Reset ${colorLabels[key]} to default`"
              title="Reset to default"
              @click="resetOne(key)"
            >
              <i class="pi pi-undo" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="actions">
      <button type="button" class="btn btn-primary" @click="randomizeAll">Randomize</button>
      <button type="button" class="btn btn-outline" :disabled="!userHasEdited" @click="openSaveModal">Save theme</button>
      <button type="button" class="btn btn-outline" @click="resetAndClearDirty">Reset to default</button>
    </div>

    <Teleport to="body">
      <div v-if="showSaveModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="save-theme-title" @click.self="closeSaveModal">
        <div class="modal save-theme-modal">
          <h2 id="save-theme-title" class="modal-heading">Save theme</h2>
          <p class="modal-hint">Give your theme a name. It will appear in the theme templates above.</p>
          <div class="save-theme-preview" :style="previewStyle(theme.getCurrentPalette())"></div>
          <input
            v-model="saveThemeName"
            type="text"
            class="save-theme-input"
            placeholder="Theme name"
            maxlength="50"
            @keydown.enter.prevent="confirmSaveTheme"
          />
          <p v-if="saveThemeError" class="save-theme-error" role="alert">{{ saveThemeError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeSaveModal">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="!saveThemeName.trim()" @click="confirmSaveTheme">Save</button>
          </div>
        </div>
      </div>

      <div
        v-if="editingColorKey !== null"
        class="modal-backdrop color-editor-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`color-editor-title-${editingColorKey}`"
        @click.self="closeColorEditor"
      >
        <div class="modal color-editor-modal">
          <h2 :id="`color-editor-title-${editingColorKey}`" class="modal-heading">
            {{ editingColorKey ? colorLabels[editingColorKey] : 'Adjust color' }}
          </h2>
          <p class="modal-hint">Use sliders or enter a hex code.</p>
          <div class="color-editor-preview" :style="{ backgroundColor: editingHex }"></div>
          <div class="color-editor-hex-wrap">
            <label :for="`color-editor-hex-${editingColorKey}`" class="sr-only">Hex code</label>
            <input
              :id="`color-editor-hex-${editingColorKey}`"
              v-model="editingHex"
              type="text"
              class="color-editor-hex"
              spellcheck="false"
              autocapitalize="off"
              inputmode="text"
              maxlength="7"
              placeholder="#000000"
              @input="onEditorHexInput"
            />
          </div>
          <div class="color-editor-sliders">
            <div class="color-editor-slider-row">
              <label :for="`color-editor-h-${editingColorKey}`" class="color-editor-slider-label">Hue</label>
              <input
                :id="`color-editor-h-${editingColorKey}`"
                v-model.number="editingHsl.h"
                type="range"
                min="0"
                max="360"
                class="color-editor-range color-editor-range-hue"
                @input="syncHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingHsl.h) }}°</span>
            </div>
            <div class="color-editor-slider-row">
              <label :for="`color-editor-s-${editingColorKey}`" class="color-editor-slider-label">Saturation</label>
              <input
                :id="`color-editor-s-${editingColorKey}`"
                v-model.number="editingHsl.s"
                type="range"
                min="0"
                max="100"
                class="color-editor-range"
                @input="syncHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingHsl.s) }}%</span>
            </div>
            <div class="color-editor-slider-row">
              <label :for="`color-editor-l-${editingColorKey}`" class="color-editor-slider-label">Lightness</label>
              <input
                :id="`color-editor-l-${editingColorKey}`"
                v-model.number="editingHsl.l"
                type="range"
                min="0"
                max="100"
                class="color-editor-range"
                @input="syncHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingHsl.l) }}%</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeColorEditor">Done</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ThemeKey, ThemeTemplate } from '@/stores/theme'

const theme = useThemeStore()
const userHasEdited = ref(false)
const showSaveModal = ref(false)
const saveThemeName = ref('')
const saveThemeError = ref('')

const editingColorKey = ref<ThemeKey | null>(null)
const editingHex = ref('#000000')
const editingHsl = ref({ h: 0, s: 0, l: 0 })

const allKeys = ([] as ThemeKey[]).concat(
  ...(Object.values(theme.THEME_KEYS) as readonly ThemeKey[][])
)

function applyTemplateAndClearDirty(id: string) {
  theme.applyTemplate(id)
  userHasEdited.value = false
}

async function onDeleteUserTheme(id: string) {
  try {
    await theme.deleteUserTheme(id)
  } catch {
    // Could show a toast on failure
  }
}

function resetAndClearDirty() {
  theme.reset()
  userHasEdited.value = false
}

onMounted(() => {
  theme.fetchUserThemes()
})

function openSaveModal() {
  saveThemeName.value = ''
  saveThemeError.value = ''
  showSaveModal.value = true
}

function closeSaveModal() {
  showSaveModal.value = false
  saveThemeName.value = ''
  saveThemeError.value = ''
}

async function confirmSaveTheme() {
  const name = saveThemeName.value.trim()
  if (!name) return
  saveThemeError.value = ''
  try {
    await theme.saveUserTheme(name)
    closeSaveModal()
    userHasEdited.value = false
  } catch {
    saveThemeError.value = 'Failed to save theme. Please try again.'
  }
}

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')
}

function randomizeOne(key: ThemeKey) {
  theme.set(key, randomHex())
  userHasEdited.value = true
}

function randomizeAll() {
  for (const key of allKeys) theme.set(key, randomHex())
  userHasEdited.value = true
}

const sectionTitles: Record<string, string> = {
  backgrounds: 'Backgrounds',
  text: 'Text',
  accents: 'Accent colors',
  borders: 'Borders',
  actions: 'Actions & highlights',
  navigation: 'Navigation',
}

const colorLabels: Record<ThemeKey, string> = {
  'bg-primary': 'Page background',
  'bg-secondary': 'Secondary background',
  'bg-card': 'Cards & panels',
  'text-primary': 'Primary text',
  'text-secondary': 'Secondary text',
  'text-tertiary': 'Tertiary / muted text',
  'accent-primary': 'Primary accent (buttons, links)',
  'accent-secondary': 'Secondary accent',
  'accent-tertiary': 'Tertiary accent',
  'accent-green': 'Success / green accent',
  'accent-burgundy': 'Burgundy / danger accent',
  'border-light': 'Light borders',
  'border-medium': 'Medium borders',
  'like-color': 'Like / heart color',
  'nav-bg': 'Nav bar background',
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) / 255
  const g = ((n >> 8) & 0xff) / 255
  const b = (n & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  const r = Math.round(f(0) * 255)
  const g = Math.round(f(8) * 255)
  const b = Math.round(f(4) * 255)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function openColorEditor(key: ThemeKey) {
  editingColorKey.value = key
  const hex = theme.get(key)
  editingHex.value = hex
  editingHsl.value = hexToHsl(hex)
}

function closeColorEditor() {
  editingColorKey.value = null
}

function syncHexFromHsl() {
  const { h, s, l } = editingHsl.value
  const hex = hslToHex(h, s, l)
  editingHex.value = hex
  if (editingColorKey.value) {
    theme.set(editingColorKey.value, hex)
    userHasEdited.value = true
  }
}

function onEditorHexInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) {
    const hex = '#' + raw
    editingHex.value = hex
    editingHsl.value = hexToHsl(hex)
    if (editingColorKey.value) {
      theme.set(editingColorKey.value, hex)
      userHasEdited.value = true
    }
  }
}

function onColorInput(key: ThemeKey, e: Event) {
  const target = (e.target as HTMLInputElement)
  if (target?.value) {
    theme.set(key, target.value)
    userHasEdited.value = true
  }
}

function onHexInput(key: ThemeKey, e: Event) {
  const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(value)) {
    theme.set(key, `#${value}`)
    userHasEdited.value = true
  }
}

function resetOne(key: ThemeKey) {
  theme.set(key, theme.defaults[key])
}

function previewStyle(palette: ThemeTemplate) {
  return {
    background: `linear-gradient(135deg, ${palette['bg-primary']} 0%, ${palette['accent-primary']} 50%, ${palette['bg-card']} 100%)`,
  }
}
</script>

<style scoped>
.customization-page { padding: 0; max-width: 640px; }
.customization-page h1 { font-size: clamp(1.5rem, 4vw, 2rem); margin: 0 0 0.5rem; color: var(--text-primary); }
.intro { color: var(--text-secondary); font-size: 0.9375rem; margin: 0 0 2rem; }
.theme-section { margin-bottom: 2rem; }
.templates-section .section-title { margin-bottom: 0.75rem; }
.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 1.25rem 0 0.5rem;
}
.subsection-title:first-of-type { margin-top: 0; }
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
}
.template-card-wrap {
  position: relative;
}
.template-delete {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  z-index: 1;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: color 0.2s, background 0.2s;
}
.template-delete:hover {
  color: var(--accent-burgundy, #6b2c3e);
  background: var(--bg-secondary);
}
.template-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
}
.template-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.template-preview {
  display: block;
  height: 3rem;
  width: 100%;
  flex-shrink: 0;
}
.template-name {
  padding: 0.5rem 0.5rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}
.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-light);
}
.color-grid { display: flex; flex-direction: column; gap: 0.75rem; }
.color-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.color-label {
  flex: 1 1 200px;
  min-width: 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
}
.color-input-wrap { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; }
.color-picker {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
}
.color-picker-desktop { display: none; }
@media (min-width: 769px) {
  .color-picker-desktop { display: block; }
}
.color-adjust-btn {
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0 0.5rem;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.color-adjust-btn:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
@media (min-width: 769px) {
  .color-adjust-btn { min-width: 2.5rem; min-height: 2.5rem; padding: 0; }
  .color-adjust-btn-label { display: none; }
}
.color-adjust-btn-label { display: inline; }
.color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
.color-picker::-webkit-color-swatch { border: none; border-radius: 4px; }
.color-hex {
  width: 6.5rem;
  min-height: 2.75rem;
  padding: 0.5rem 0.5rem;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 769px) {
  .color-hex { min-height: auto; padding: 0.375rem 0.5rem; }
}
.color-hex:focus { outline: none; border-color: var(--accent-primary); }
.btn-icon-small {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 769px) {
  .btn-icon-small { width: 2rem; height: 2rem; min-width: 2rem; min-height: 2rem; }
}
.btn-icon-small:hover { color: var(--accent-primary); background: rgba(139, 69, 19, 0.08); }
.btn-icon-small .pi { font-size: 0.875rem; }
.actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-light);
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: inherit; border: 2px solid transparent; }
.btn-primary { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-outline { background: transparent; border-color: var(--border-medium); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline:disabled:hover { border-color: var(--border-medium); color: var(--text-secondary); }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.color-editor-backdrop { align-items: flex-end; padding: 0; }
@media (min-width: 480px) {
  .color-editor-backdrop { align-items: center; padding: 1rem; }
}
.color-editor-modal {
  width: 100%;
  max-width: 360px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0;
  background: #ffffff;
  color: #1a1a1a;
  border: 2px solid #e0e0e0;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
}
.color-editor-modal .modal-heading { color: #1a1a1a; }
.color-editor-modal .modal-hint { color: #555; }
.color-editor-modal .color-editor-slider-label { color: #1a1a1a; }
.color-editor-modal .color-editor-value { color: #555; }
.color-editor-modal .color-editor-hex {
  background: #f5f5f5;
  border-color: #ccc;
  color: #1a1a1a;
}
.color-editor-modal .color-editor-hex::placeholder { color: #888; }
.color-editor-modal .color-editor-hex:focus { border-color: #8B4513; }
.color-editor-modal .btn-primary {
  background: #8B4513;
  color: #fff;
  border-color: #8B4513;
}
.color-editor-modal .btn-primary:hover { filter: brightness(1.08); }
.color-editor-modal .color-editor-range:focus-visible { outline-color: #8B4513; }
.color-editor-modal .color-editor-range::-webkit-slider-runnable-track { background: #e0e0e0; }
.color-editor-modal .color-editor-range::-webkit-slider-thumb {
  background: #8B4513;
  border-color: #fff;
}
.color-editor-modal .color-editor-range::-moz-range-track { background: #e0e0e0; }
.color-editor-modal .color-editor-range::-moz-range-thumb {
  background: #8B4513;
  border-color: #fff;
}
.color-editor-preview {
  height: 4rem;
  border-radius: var(--radius-md);
  border: 2px solid #ccc;
  margin-bottom: 1rem;
}
.color-editor-hex-wrap { margin-bottom: 1rem; }
.color-editor-hex {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-family: ui-monospace, monospace;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}
.color-editor-hex:focus { outline: none; border-color: var(--accent-primary); }
.color-editor-sliders { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
.color-editor-slider-row {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}
.color-editor-slider-label {
  flex: 0 0 4.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
}
.color-editor-range {
  flex: 1;
  min-width: 120px;
  min-height: 44px;
  height: 2.75rem;
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}
.color-editor-range:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
.color-editor-range::-webkit-slider-runnable-track {
  height: 0.5rem;
  border-radius: 999px;
  background: var(--border-light);
}
.color-editor-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-card);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  margin-top: -0.5rem;
  cursor: pointer;
}
.color-editor-range::-moz-range-track {
  height: 0.5rem;
  border-radius: 999px;
  background: var(--border-light);
}
.color-editor-range::-moz-range-thumb {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-card);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
}
.color-editor-range-hue {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  border-radius: 999px;
  height: 0.5rem;
  align-self: center;
}
.color-editor-range-hue::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}
.color-editor-range-hue::-moz-range-track {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}
.color-editor-value {
  flex: 0 0 3rem;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(44, 24, 16, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.save-theme-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  padding: 1.5rem;
  max-width: 360px;
  width: 100%;
}
.modal-heading { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
.modal-hint { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 1rem; }
.save-theme-preview {
  height: 4rem;
  width: 100%;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  border: 2px solid var(--border-light);
}
.save-theme-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-family: inherit;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-bottom: 1rem;
}
.save-theme-input:focus { outline: none; border-color: var(--accent-primary); }
.save-theme-input::placeholder { color: var(--text-tertiary); }
.save-theme-error { font-size: 0.875rem; color: var(--accent-burgundy, #c53030); margin: 0.5rem 0 0; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
</style>
