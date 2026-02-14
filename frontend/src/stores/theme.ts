import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '@/api/client'

const STORAGE_KEY = 'writespace-theme'
const STORAGE_BG_IMAGE = 'writespace-theme-bg-image'
const STORAGE_BG_OPTIONS = 'writespace-theme-bg-options'
const STORAGE_UI_THEME = 'writespace-ui-theme'

export type UiThemeId = 'default' | 'dark-void'

function loadUiThemeFromStorage(): UiThemeId {
  try {
    const v = localStorage.getItem(STORAGE_UI_THEME)
    if (v === 'dark-void' || v === 'default') return v
  } catch {
    // ignore
  }
  return 'default'
}

function saveUiThemeToStorage(id: UiThemeId) {
  try {
    localStorage.setItem(STORAGE_UI_THEME, id)
  } catch {
    // ignore
  }
}

export type BgImagePosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top left'
  | 'top right'
  | 'bottom left'
  | 'bottom right'

export type BgImageSize = 'cover' | 'contain' | 'zoom'

/** Normalized 0–1: the region of the image to show (x,y = top-left, width/height = size). When set, only this region is displayed, scaled to cover. */
export interface BgImageCrop {
  x: number
  y: number
  width: number
  height: number
}

export interface BgImageOptions {
  position: BgImagePosition
  size: BgImageSize
  sizeZoom: number
  repeat: 'no-repeat' | 'repeat'
  /** When set, only this cropped region of the image is shown (scaled to cover the viewport). */
  crop: BgImageCrop | null
}

const DEFAULT_BG_OPTIONS: BgImageOptions = {
  position: 'center',
  size: 'cover',
  sizeZoom: 100,
  repeat: 'no-repeat',
  crop: null,
}

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

export const THEME_TEMPLATES: Record<string, { name: string; palette: ThemeTemplate; dark?: boolean }> = {
  default: {
    name: 'Default',
    palette: { ...THEME_DEFAULTS },
    dark: false,
  },
  ocean: {
    name: 'Ocean',
    dark: false,
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
    dark: false,
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
    dark: true,
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
  midnight: {
    name: 'Midnight',
    dark: true,
    palette: {
      'bg-primary': '#141C24',
      'bg-secondary': '#1E2A36',
      'bg-card': '#263340',
      'text-primary': '#E8ECF0',
      'text-secondary': '#A8B8C8',
      'text-tertiary': '#6B8298',
      'accent-primary': '#4A90B8',
      'accent-secondary': '#6AA8D4',
      'accent-tertiary': '#8AC4E8',
      'accent-green': '#4A9A6A',
      'accent-burgundy': '#B86B7A',
      'border-light': '#354556',
      'border-medium': '#455A6E',
      'like-color': '#E85A6B',
      'nav-bg': '#1E2A36',
    },
  },
  pine: {
    name: 'Pine',
    dark: true,
    palette: {
      'bg-primary': '#141C18',
      'bg-secondary': '#1E2A24',
      'bg-card': '#26342E',
      'text-primary': '#E8F0EC',
      'text-secondary': '#A8B8B0',
      'text-tertiary': '#6B8278',
      'accent-primary': '#4A9A6A',
      'accent-secondary': '#6AB88A',
      'accent-tertiary': '#8AD4AA',
      'accent-green': '#5AAA72',
      'accent-burgundy': '#B87A6B',
      'border-light': '#354A42',
      'border-medium': '#455E54',
      'like-color': '#E86A6B',
      'nav-bg': '#1E2A24',
    },
  },
  obsidian: {
    name: 'Obsidian',
    dark: true,
    palette: {
      'bg-primary': '#0D0D0F',
      'bg-secondary': '#161619',
      'bg-card': '#1E1E22',
      'text-primary': '#E6E6E8',
      'text-secondary': '#9898A0',
      'text-tertiary': '#686870',
      'accent-primary': '#A88B4C',
      'accent-secondary': '#B8A06A',
      'accent-tertiary': '#D4C490',
      'accent-green': '#5A9A6A',
      'accent-burgundy': '#B86B7A',
      'border-light': '#2E2E34',
      'border-medium': '#404048',
      'like-color': '#E85A6B',
      'nav-bg': '#161619',
    },
  },
  eclipse: {
    name: 'Eclipse',
    dark: true,
    palette: {
      'bg-primary': '#12121A',
      'bg-secondary': '#1A1A26',
      'bg-card': '#242432',
      'text-primary': '#E8E8F0',
      'text-secondary': '#A0A0B0',
      'text-tertiary': '#707084',
      'accent-primary': '#7A6BB8',
      'accent-secondary': '#9080C8',
      'accent-tertiary': '#A898D8',
      'accent-green': '#5A9A7A',
      'accent-burgundy': '#B87A8A',
      'border-light': '#36364A',
      'border-medium': '#48485C',
      'like-color': '#E86A7A',
      'nav-bg': '#1A1A26',
    },
  },
  ember: {
    name: 'Ember',
    dark: true,
    palette: {
      'bg-primary': '#1A1410',
      'bg-secondary': '#261C16',
      'bg-card': '#32281E',
      'text-primary': '#F0E8E0',
      'text-secondary': '#B0A098',
      'text-tertiary': '#807068',
      'accent-primary': '#C86A3A',
      'accent-secondary': '#D48A5A',
      'accent-tertiary': '#E8AA82',
      'accent-green': '#5A9A6A',
      'accent-burgundy': '#B86B6A',
      'border-light': '#403830',
      'border-medium': '#524A42',
      'like-color': '#E85A5A',
      'nav-bg': '#261C16',
    },
  },
  violet: {
    name: 'Violet',
    dark: true,
    palette: {
      'bg-primary': '#16121E',
      'bg-secondary': '#1E1A28',
      'bg-card': '#282432',
      'text-primary': '#ECE8F0',
      'text-secondary': '#A89AB0',
      'text-tertiary': '#786A88',
      'accent-primary': '#8A6AB8',
      'accent-secondary': '#A080C8',
      'accent-tertiary': '#B898D8',
      'accent-green': '#5A9A7A',
      'accent-burgundy': '#B87A92',
      'border-light': '#3A3648',
      'border-medium': '#4C4858',
      'like-color': '#E86A88',
      'nav-bg': '#1E1A28',
    },
  },
  forest: {
    name: 'Forest',
    dark: false,
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
    dark: false,
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
    dark: false,
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
    dark: false,
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
    const value = overrides[key]
    if (value != null) root.style.setProperty(varName, value)
    else root.style.removeProperty(varName)
  }
}

function loadBgImageFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_BG_IMAGE)
    if (!raw || typeof raw !== 'string') return null
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return null
  } catch {
    return null
  }
}

function saveBgImageToStorage(url: string | null) {
  try {
    if (url == null || url === '') localStorage.removeItem(STORAGE_BG_IMAGE)
    else localStorage.setItem(STORAGE_BG_IMAGE, url)
  } catch {
    // ignore
  }
}

function loadBgOptionsFromStorage(): BgImageOptions {
  try {
    const raw = localStorage.getItem(STORAGE_BG_OPTIONS)
    if (!raw) return { ...DEFAULT_BG_OPTIONS }
    const parsed = JSON.parse(raw) as Partial<BgImageOptions>
    const crop = parsed.crop
    const validCrop: BgImageCrop | null =
      crop && typeof crop.x === 'number' && typeof crop.y === 'number' && typeof crop.width === 'number' && typeof crop.height === 'number'
      && crop.width > 0.05 && crop.height > 0.05 && crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= 1.01 && crop.y + crop.height <= 1.01
        ? { x: crop.x, y: crop.y, width: crop.width, height: crop.height }
        : null
    return {
      position: validPosition(parsed.position) ? parsed.position! : DEFAULT_BG_OPTIONS.position,
      size: validSize(parsed.size) ? parsed.size! : DEFAULT_BG_OPTIONS.size,
      sizeZoom: typeof parsed.sizeZoom === 'number' && parsed.sizeZoom >= 80 && parsed.sizeZoom <= 250
        ? Math.round(parsed.sizeZoom)
        : DEFAULT_BG_OPTIONS.sizeZoom,
      repeat: parsed.repeat === 'repeat' ? 'repeat' : 'no-repeat',
      crop: validCrop,
    }
  } catch {
    return { ...DEFAULT_BG_OPTIONS }
  }
}

const POSITIONS: BgImagePosition[] = [
  'top left',
  'top',
  'top right',
  'left',
  'center',
  'right',
  'bottom left',
  'bottom',
  'bottom right',
]

function validPosition(p: unknown): p is BgImagePosition {
  return typeof p === 'string' && (POSITIONS as string[]).includes(p)
}

function validSize(s: unknown): s is BgImageSize {
  return s === 'cover' || s === 'contain' || s === 'zoom'
}

function saveBgOptionsToStorage(opts: BgImageOptions) {
  try {
    localStorage.setItem(STORAGE_BG_OPTIONS, JSON.stringify(opts))
  } catch {
    // ignore
  }
}

function applyBgImageToDocument(url: string | null, options?: BgImageOptions) {
  const root = document.documentElement
  const body = document.body
  if (!body) return
  const opts = options ?? DEFAULT_BG_OPTIONS
  if (url) {
    const escaped = url.replace(/"/g, '%22').replace(/'/g, "%27")
    root.style.setProperty('--bg-image', `url("${escaped}")`)
    body.style.backgroundImage = `url("${escaped}")`
    body.style.backgroundRepeat = opts.repeat
    body.style.backgroundAttachment = 'fixed'
    if (opts.crop) {
      const c = opts.crop
      body.style.backgroundSize = `${100 / c.width}% ${100 / c.height}%`
      body.style.backgroundPosition = `${(-c.x * 100) / c.width}% ${(-c.y * 100) / c.height}%`
    } else {
      body.style.backgroundPosition = opts.position
      if (opts.size === 'zoom') {
        body.style.backgroundSize = `${opts.sizeZoom}%`
      } else {
        body.style.backgroundSize = opts.size
      }
    }
  } else {
    root.style.removeProperty('--bg-image')
    body.style.backgroundImage = ''
    body.style.backgroundSize = ''
    body.style.backgroundPosition = ''
    body.style.backgroundRepeat = ''
    body.style.backgroundAttachment = ''
  }
}

const allKeys = Object.keys(THEME_DEFAULTS) as ThemeKey[]

const UI_THEME_CLASS = 'ui-theme-dark-void'

function applyUiThemeToDocument(uiTheme: UiThemeId) {
  const root = document.documentElement
  if (uiTheme === 'dark-void') root.classList.add(UI_THEME_CLASS)
  else root.classList.remove(UI_THEME_CLASS)
}

export const useThemeStore = defineStore('theme', () => {
  const overrides = ref<Partial<Record<ThemeKey, string>>>(loadFromStorage())
  const bgImageUrl = ref<string | null>(loadBgImageFromStorage())
  const bgImageOptions = ref<BgImageOptions>(loadBgOptionsFromStorage())
  const userTemplates = ref<UserSavedTheme[]>([])
  const uiTheme = ref<UiThemeId>(loadUiThemeFromStorage())
  const isDarkVoid = computed(() => uiTheme.value === 'dark-void')

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

  const lightTemplatesList = computed(() =>
    Object.entries(THEME_TEMPLATES)
      .filter(([, t]) => !t.dark)
      .map(([id, t]) => ({ id, name: t.name, palette: t.palette, isUser: false as const }))
  )

  const darkTemplatesList = computed(() =>
    Object.entries(THEME_TEMPLATES)
      .filter(([, t]) => t.dark)
      .map(([id, t]) => ({ id, name: t.name, palette: t.palette, isUser: false as const }))
  )

  function setUiTheme(id: UiThemeId) {
    uiTheme.value = id
    saveUiThemeToStorage(id)
    applyUiThemeToDocument(id)
  }

  function init() {
    applyToDocument(overrides.value)
    applyBgImageToDocument(bgImageUrl.value, bgImageOptions.value)
    applyUiThemeToDocument(uiTheme.value)
  }

  function setBgImage(url: string | null) {
    bgImageUrl.value = url
    applyBgImageToDocument(url, bgImageOptions.value)
    saveBgImageToStorage(url)
  }

  function setBgImageOptions(options: Partial<BgImageOptions>) {
    const next = { ...bgImageOptions.value, ...options }
    if (next.sizeZoom < 80) next.sizeZoom = 80
    if (next.sizeZoom > 250) next.sizeZoom = 250
    bgImageOptions.value = next
    saveBgOptionsToStorage(next)
    if (bgImageUrl.value) applyBgImageToDocument(bgImageUrl.value, next)
  }

  function clearBgImage() {
    bgImageUrl.value = null
    bgImageOptions.value = { ...DEFAULT_BG_OPTIONS }
    saveBgImageToStorage(null)
    saveBgOptionsToStorage(DEFAULT_BG_OPTIONS)
    applyBgImageToDocument(null)
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
    clearBgImage()
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

  async function fetchUserThemes() {
    try {
      const { data } = await api.get<{ id: string; name: string; palette: Record<string, string> }[]>('/themes')
      userTemplates.value = Array.isArray(data)
        ? data.map((t) => ({ id: t.id, name: t.name, palette: t.palette as ThemeTemplate }))
        : []
    } catch {
      userTemplates.value = []
    }
  }

  function clearUserThemes() {
    userTemplates.value = []
  }

  async function saveUserTheme(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const palette = getCurrentPalette()
    try {
      const { data } = await api.post<{ id: string; name: string; palette: Record<string, string> }>('/themes', {
        name: trimmed,
        palette,
      })
      userTemplates.value = [
        ...userTemplates.value,
        { id: data.id, name: data.name, palette: data.palette as ThemeTemplate },
      ]
    } catch {
      throw new Error('Failed to save theme')
    }
  }

  async function deleteUserTheme(id: string) {
    try {
      await api.delete(`/themes/${id}`)
      userTemplates.value = userTemplates.value.filter((t) => t.id !== id)
    } catch {
      throw new Error('Failed to delete theme')
    }
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
    bgImageUrl,
    bgImageOptions,
    uiTheme,
    isDarkVoid,
    setUiTheme,
    setBgImageOptions,
    defaults: THEME_DEFAULTS,
    THEME_KEYS,
    THEME_TEMPLATES,
    templatesList,
    lightTemplatesList,
    darkTemplatesList,
    userTemplates,
    init,
    set,
    reset,
    setBgImage,
    clearBgImage,
    applyTemplate,
    fetchUserThemes,
    clearUserThemes,
    saveUserTheme,
    deleteUserTheme,
    getCurrentPalette,
    get,
  }
})
