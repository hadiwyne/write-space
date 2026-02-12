<template>
  <div class="customization-page">
    <h1>Customization</h1>
    <p class="intro">Change how WriteSpace looks for you.</p>

    <section class="theme-section templates-section">
      <h2 class="section-title">Theme templates</h2>
      <div class="templates-grid">
        <button
          v-for="t in theme.templatesList"
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
              class="color-picker"
              :aria-label="colorLabels[key]"
              @input="onColorInput(key, $event)"
            />
            <input
              type="text"
              :value="theme.get(key)"
              class="color-hex"
              spellcheck="false"
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
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeSaveModal">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="!saveThemeName.trim()" @click="confirmSaveTheme">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ThemeKey, ThemeTemplate } from '@/stores/theme'

const theme = useThemeStore()
const userHasEdited = ref(false)
const showSaveModal = ref(false)
const saveThemeName = ref('')

const allKeys = ([] as ThemeKey[]).concat(
  ...(Object.values(theme.THEME_KEYS) as readonly ThemeKey[][])
)

function applyTemplateAndClearDirty(id: string) {
  theme.applyTemplate(id)
  userHasEdited.value = false
}

function resetAndClearDirty() {
  theme.reset()
  userHasEdited.value = false
}

function openSaveModal() {
  saveThemeName.value = ''
  showSaveModal.value = true
}

function closeSaveModal() {
  showSaveModal.value = false
  saveThemeName.value = ''
}

function confirmSaveTheme() {
  const name = saveThemeName.value.trim()
  if (!name) return
  theme.saveUserTheme(name)
  closeSaveModal()
  userHasEdited.value = false
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
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
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
.color-input-wrap { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.color-picker {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
}
.color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
.color-picker::-webkit-color-swatch { border: none; border-radius: 4px; }
.color-hex {
  width: 6rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
}
.color-hex:focus { outline: none; border-color: var(--accent-primary); }
.btn-icon-small {
  width: 2rem;
  height: 2rem;
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
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
</style>
