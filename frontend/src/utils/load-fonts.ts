import { extractContentFontFamiliesFromHtml } from '@/utils/allowed-content-fonts'

/**
 * Ensure a font family is loaded (inject Google Fonts link if needed).
 * Call when applying a font so non-system fonts render correctly.
 */
const GOOGLE_FONT_IDS: Record<string, string> = {
  'Lora': 'Lora:ital,wght@0,400;0,600;0,700',
  'Merriweather': 'Merriweather:ital,wght@0,400;0,700',
  'Source Serif 4': 'Source+Serif+4:ital,wght@0,400;0,600;0,700',
  'PT Serif': 'PT+Serif:ital,wght@0,400;0,700',
  'Libre Baskerville': 'Libre+Baskerville:ital,wght@0,400;0,700',
  'Crimson Text': 'Crimson+Text:ital,wght@0,400;0,600;0,700',
  'Playfair Display': 'Playfair+Display:ital,wght@0,400;0,600;0,700',
  'Inter': 'Inter:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:ital,wght@0,400;0,600;0,700',
  'Roboto': 'Roboto:ital,wght@0,400;0,500;0,700',
  'Nunito': 'Nunito:wght@400;600;700',
  'Manrope': 'Manrope:wght@400;500;600;700',
  'Oswald': 'Oswald:wght@400;500;600;700',
  'Bebas Neue': 'Bebas+Neue',
  'Dancing Script': 'Dancing+Script:wght@400;600;700',
  'Pacifico': 'Pacifico',
  'Lobster': 'Lobster',
  'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600',
  'Source Code Pro': 'Source+Code+Pro:wght@400;500;600',
}

const loaded = new Set<string>()

export function ensureFontLoaded(fontFamily: string): void {
  const key = fontFamily.trim()
  if (!key || loaded.has(key)) return
  const id = GOOGLE_FONT_IDS[key]
  if (!id) return // system font
  loaded.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${id}&display=swap`
  document.head.appendChild(link)
}

/** Load all allowlisted content fonts that appear in the given HTML. */
export function ensureFontsInHtmlLoaded(html: string): void {
  for (const font of extractContentFontFamiliesFromHtml(html)) {
    ensureFontLoaded(font)
  }
}
