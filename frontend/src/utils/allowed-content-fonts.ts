/**
 * Allowed font families for post content (allowlist for safe display).
 * Must match backend allowlist. Use distinctive, varied fonts (serif, sans, display, mono).
 */
export const ALLOWED_CONTENT_FONT_FAMILIES = new Set([
  // Serif (classic, readable)
  'Georgia',
  'Times New Roman',
  'Lora',
  'Merriweather',
  'Source Serif 4',
  'PT Serif',
  'Libre Baskerville',
  'Crimson Text',
  'Playfair Display',
  // Sans-serif (modern, clean)
  'Arial',
  'Helvetica',
  'Verdana',
  'Inter',
  'Open Sans',
  'Roboto',
  'Nunito',
  'Manrope',
  'Trebuchet MS',
  'Tahoma',
  // Display / personality
  'Bebas Neue',
  'Oswald',
  'Dancing Script',
  'Pacifico',
  'Lobster',
  // Monospace
  'Courier New',
  'JetBrains Mono',
  'Source Code Pro',
  // System / fallback
  'Palatino Linotype',
  'Lucida Sans Unicode',
])

export const CONTENT_FONT_FAMILY_OPTIONS = [...ALLOWED_CONTENT_FONT_FAMILIES]

export function getAllowedContentFontFamily(font: string | null | undefined): string | undefined {
  if (font == null || font.trim() === '') return undefined
  const trimmed = font.trim()
  return ALLOWED_CONTENT_FONT_FAMILIES.has(trimmed) ? trimmed : undefined
}

/** CSS-safe font-family value (quoted if contains space). */
export function fontFamilyCss(font: string): string {
  return font.includes(' ') ? `"${font}"` : font
}

/** Extract allowlisted font family names from HTML (e.g. from style="font-family: Manrope"). */
export function extractContentFontFamiliesFromHtml(html: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const styleRegex = /style\s*=\s*["']([^"']*)["']/gi
  const fontRegex = /font-family\s*:\s*([^;]+)/gi
  let styleMatch: RegExpExecArray | null
  while ((styleMatch = styleRegex.exec(html)) !== null) {
    const styleContent = styleMatch[1]
    let fontMatch: RegExpExecArray | null
    fontRegex.lastIndex = 0
    while ((fontMatch = fontRegex.exec(styleContent)) !== null) {
      const raw = fontMatch[1].split(',')[0].trim().replace(/^["']|["']$/g, '')
      if (raw && ALLOWED_CONTENT_FONT_FAMILIES.has(raw) && !seen.has(raw)) {
        seen.add(raw)
        out.push(raw)
      }
    }
  }
  return out
}
