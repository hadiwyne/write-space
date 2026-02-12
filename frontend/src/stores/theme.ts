import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'writespace-theme'
const USER_TEMPLATES_KEY = 'writespace-user-themes'

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

export type ThemeTemplate = Record<ThemeKey, string>
export type UserSavedTheme = { id: string; name: string; palette: ThemeTemplate }

function loadUserTemplates(): UserSavedTheme[] {
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is UserSavedTheme =>
        t != null &&
        typeof t === 'object' &&
        typeof (t as UserSavedTheme).id === 'string' &&
        typeof (t as UserSavedTheme).name === 'string' &&
        typeof (t as UserSavedTheme).palette === 'object'
    )
  } catch {
    return []
  }
}

function saveUserTemplates(templates: UserSavedTheme[]) {
  try {
    localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(templates))
  } catch {
    // ignore
  }
}

export const THEME_TEMPLATES: Record<string, { name: string; palette: ThemeTemplate }> = {
  default: {
    name: 'Default',
    palette: { ...THEME_DEFAULTS },
  },
  ocean: {
    name: 'Ocean',
    palette: {
      'bg-primary': '#E8EEF2',
      'bg-secondary': '#F0F5F8',
      'bg-card': '#FFFFFF',
      'text-primary': '#1A2A3A',
      'text-secondary': '#3D5A6C',
      'text-tertiary': '#6B8A9E',
      'accent-primary': '#0E4C6B',
      'accent-secondary': '#4A90A4',
      'accent-tertiary': '#7BB8C9',
      'accent-green': '#2D6A4F',
      'accent-burgundy': '#8B3A4A',
      'border-light': '#C5D4E0',
      'border-medium': '#A8BCC9',
      'like-color': '#E63946',
      'nav-bg': '#F0F5F8',
    },
  },
  rose: {
    name: 'Rose',
    palette: {
      'bg-primary': '#FDF2F4',
      'bg-secondary': '#FAEBED',
      'bg-card': '#FFFFFF',
      'text-primary': '#3D2C2E',
      'text-secondary': '#6B5355',
      'text-tertiary': '#9A8587',
      'accent-primary': '#BE4A5C',
      'accent-secondary': '#D47A87',
      'accent-tertiary': '#E8A8B3',
      'accent-green': '#4A7C59',
      'accent-burgundy': '#8B3A4A',
      'border-light': '#E8D4D8',
      'border-medium': '#D4B8BE',
      'like-color': '#C73E54',
      'nav-bg': '#FAEBED',
    },
  },
  dark: {
    name: 'Dark',
    palette: {
      'bg-primary': '#1A1A1A',
      'bg-secondary': '#252525',
      'bg-card': '#2D2D2D',
      'text-primary': '#E8E8E8',
      'text-secondary': '#B0B0B0',
      'text-tertiary': '#808080',
      'accent-primary': '#D4A84B',
      'accent-secondary': '#C19A6B',
      'accent-tertiary': '#E8C97A',
      'accent-green': '#5A9A6A',
      'accent-burgundy': '#C86B7A',
      'border-light': '#404040',
      'border-medium': '#505050',
      'like-color': '#E85A6B',
      'nav-bg': '#252525',
    },
  },
  forest: {
    name: 'Forest',
    palette: {
      'bg-primary': '#E8EDE6',
      'bg-secondary': '#F0F4EE',
      'bg-card': '#FFFFFF',
      'text-primary': '#1E2E1E',
      'text-secondary': '#3D4A3D',
      'text-tertiary': '#5C6B5C',
      'accent-primary': '#2D5A2D',
      'accent-secondary': '#4A7C4A',
      'accent-tertiary': '#6B9A6B',
      'accent-green': '#2D6A4F',
      'accent-burgundy': '#6B3A4A',
      'border-light': '#C5D4C0',
      'border-medium': '#A8B8A4',
      'like-color': '#C73E54',
      'nav-bg': '#F0F4EE',
    },
  },
  sunset: {
    name: 'Sunset',
    palette: {
      'bg-primary': '#F5EDE8',
      'bg-secondary': '#FAF2EB',
      'bg-card': '#FFFFFF',
      'text-primary': '#2C1810',
      'text-secondary': '#5C4A3D',
      'text-tertiary': '#8C7A6B',
      'accent-primary': '#C45C2C',
      'accent-secondary': '#D4845C',
      'accent-tertiary': '#E8A87A',
      'accent-green': '#4A7C59',
      'accent-burgundy': '#8B3A4A',
      'border-light': '#E5D4C8',
      'border-medium': '#D4C4AC',
      'like-color': '#DC143C',
      'nav-bg': '#FAF2EB',
    },
  },
  slate: {
    name: 'Slate',
    palette: {
      'bg-primary': '#E8EAED',
      'bg-secondary': '#EEF0F2',
      'bg-card': '#FFFFFF',
      'text-primary': '#1A2530',
      'text-secondary': '#3D4A5C',
      'text-tertiary': '#6B7A8E',
      'accent-primary': '#3D5A80',
      'accent-secondary': '#5C7A9E',
      'accent-tertiary': '#8AA8C4',
      'accent-green': '#3D6A5C',
      'accent-burgundy': '#6B3A4A',
      'border-light': '#C5CCD4',
      'border-medium': '#A8B4C0',
      'like-color': '#C73E54',
      'nav-bg': '#EEF0F2',
    },
  },
  lavender: {
    name: 'Lavender',
    palette: {
      'bg-primary': '#EDE8F0',
      'bg-secondary': '#F2EBF5',
      'bg-card': '#FFFFFF',
      'text-primary': '#2E1E3A',
      'text-secondary': '#4A3D5C',
      'text-tertiary': '#6B5C7A',
      'accent-primary': '#5C4A8B',
      'accent-secondary': '#7A6BA8',
      'accent-tertiary': '#9A8AC4',
      'accent-green': '#4A7C59',
      'accent-burgundy': '#8B4A6B',
      'border-light': '#D4C8E0',
      'border-medium': '#B8A8CC',
      'like-color': '#C73E54',
      'nav-bg': '#F2EBF5',
    },
  },
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

const allKeys = Object.keys(THEME_DEFAULTS) as ThemeKey[]

export const useThemeStore = defineStore('theme', () => {
  const overrides = ref<Partial<Record<ThemeKey, string>>>(loadFromStorage())
  const userTemplates = ref<UserSavedTheme[]>(loadUserTemplates())

  const templatesList = computed(() => {
    const builtIn = Object.entries(THEME_TEMPLATES).map(([id, t]) => ({
      id,
      name: t.name,
      palette: t.palette,
      isUser: false,
    }))
    const user = userTemplates.value.map((t) => ({
      id: t.id,
      name: t.name,
      palette: t.palette,
      isUser: true,
    }))
    return [...builtIn, ...user]
  })

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

  function getCurrentPalette(): ThemeTemplate {
    const out = { ...THEME_DEFAULTS }
    for (const key of allKeys) {
      if (overrides.value[key] != null) out[key] = overrides.value[key]!
    }
    return out
  }

  function applyTemplate(templateId: string) {
    const builtIn = THEME_TEMPLATES[templateId]
    if (builtIn) {
      overrides.value = { ...builtIn.palette }
    } else {
      const user = userTemplates.value.find((t) => t.id === templateId)
      if (user) overrides.value = { ...user.palette }
      else return
    }
    applyToDocument(overrides.value)
    saveToStorage(overrides.value)
  }

  function saveUserTheme(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const palette = getCurrentPalette()
    const id = 'user-' + Math.random().toString(36).slice(2, 11)
    const newTheme: UserSavedTheme = { id, name: trimmed, palette }
    userTemplates.value = [...userTemplates.value, newTheme]
    saveUserTemplates(userTemplates.value)
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
    THEME_TEMPLATES,
    templatesList,
    userTemplates,
    init,
    set,
    reset,
    applyTemplate,
    saveUserTheme,
    getCurrentPalette,
    get,
  }
})
