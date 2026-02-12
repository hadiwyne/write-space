import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'writespace-theme'

export const THEME_KEYS = {
  backgrounds: ['bg-primary', 'bg-secondary', 'bg-card'] as const,
  navigation: ['nav-bg'] as const,
  text: ['text-primary', 'text-secondary', 'text-tertiary'] as const,
  accents: ['accent-primary', 'accent-secondary', 'accent-tertiary', 'accent-green', 'accent-burgundy'] as const,
  borders: ['border-light', 'border-medium'] as const,
  actions: ['like-color'] as const,
} as const

export type ThemeKey =
  | (typeof THEME_KEYS.backgrounds)[number]
  | (typeof THEME_KEYS.text)[number]
  | (typeof THEME_KEYS.accents)[number]
  | (typeof THEME_KEYS.borders)[number]
  | (typeof THEME_KEYS.actions)[number]
  | (typeof THEME_KEYS.navigation)[number]

export const THEME_DEFAULTS: Record<ThemeKey, string> = {
  'bg-primary': '#F5F1E8',
  'bg-secondary': '#FAF7F0',
  'bg-card': '#FFFFFF',
  'text-primary': '#2C1810',
  'text-secondary': '#5C4A3D',
  'text-tertiary': '#8C7A6B',
  'accent-primary': '#8B4513',
  'accent-secondary': '#C19A6B',
  'accent-tertiary': '#D4AF37',
  'accent-green': '#3D5A3C',
  'accent-burgundy': '#6B2C3E',
  'border-light': '#E5DCC8',
  'border-medium': '#D4C4AC',
  'like-color': '#DC143C',
  'nav-bg': '#FAF7F0',
}

function loadFromStorage(): Partial<Record<ThemeKey, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    const out: Partial<Record<ThemeKey, string>> = {}
    for (const key of Object.keys(THEME_DEFAULTS) as ThemeKey[]) {
      if (typeof parsed[key] === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed[key])) out[key] = parsed[key]
    }
    return out
  } catch {
    return {}
  }
}

function saveToStorage(overrides: Partial<Record<ThemeKey, string>>) {
  try {
    if (Object.keys(overrides).length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // ignore
  }
}

function applyToDocument(overrides: Partial<Record<ThemeKey, string>>) {
  const root = document.documentElement
  const allKeys = Object.keys(THEME_DEFAULTS) as ThemeKey[]
  for (const key of allKeys) {
    const varName = `--${key}`
    if (overrides[key] != null) root.style.setProperty(varName, overrides[key])
    else root.style.removeProperty(varName)
  }
}

export const useThemeStore = defineStore('theme', () => {
  const overrides = ref<Partial<Record<ThemeKey, string>>>(loadFromStorage())

  function init() {
    applyToDocument(overrides.value)
  }

  function set(key: ThemeKey, value: string) {
    overrides.value = { ...overrides.value, [key]: value }
    applyToDocument(overrides.value)
    saveToStorage(overrides.value)
  }

  function reset() {
    overrides.value = {}
    applyToDocument({})
    saveToStorage({})
  }

  function get(key: ThemeKey): string {
    return overrides.value[key] ?? THEME_DEFAULTS[key]
  }

  watch(
    overrides,
    (val) => {
      applyToDocument(val)
      saveToStorage(val)
    },
    { deep: true }
  )

  return {
    overrides,
    defaults: THEME_DEFAULTS,
    THEME_KEYS,
    init,
    set,
    reset,
    get,
  }
})
