<template>
  <div class="customization-page">
    <h1>Customization</h1>
    <p class="intro">Change how WriteSpace looks for you.</p>

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
              class="btn-reset-one"
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
      <button type="button" class="btn btn-outline" @click="theme.reset()">Reset to default</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import type { ThemeKey } from '@/stores/theme'

const theme = useThemeStore()

const sectionTitles: Record<string, string> = {
  backgrounds: 'Backgrounds',
  text: 'Text',
  accents: 'Accent colors',
  borders: 'Borders',
  actions: 'Actions & highlights',
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
}

function onColorInput(key: ThemeKey, e: Event) {
  const target = (e.target as HTMLInputElement)
  if (target?.value) theme.set(key, target.value)
}

function onHexInput(key: ThemeKey, e: Event) {
  const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(value)) theme.set(key, `#${value}`)
}

function resetOne(key: ThemeKey) {
  theme.set(key, theme.defaults[key])
}
</script>

<style scoped>
.customization-page { padding: 0; max-width: 640px; }
.customization-page h1 { font-size: clamp(1.5rem, 4vw, 2rem); margin: 0 0 0.5rem; color: var(--text-primary); }
.intro { color: var(--text-secondary); font-size: 0.9375rem; margin: 0 0 2rem; }
.theme-section { margin-bottom: 2rem; }
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
.btn-reset-one {
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
.btn-reset-one:hover { color: var(--accent-primary); background: rgba(139, 69, 19, 0.08); }
.btn-reset-one .pi { font-size: 0.875rem; }
.actions { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-light); }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-outline { background: transparent; border: 2px solid var(--border-medium); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
</style>
