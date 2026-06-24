/** Constructs an absolute URL from a potentially relative API path */
export function absoluteUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return window.location.origin + (path.startsWith('/') ? path : '/' + path)
}

const OG_PROPERTIES = [
  'og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name',
  'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
]

function setTag(property: string, content: string) {
  // Handle both og: (property attr) and twitter: (name attr)
  const attr = property.startsWith('twitter:') ? 'name' : 'property'
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function truncateWords(str: string, maxWords: number): string {
  const words = str.trim().split(/\s+/)
  if (words.length <= maxWords) return str
  return words.slice(0, maxWords).join(' ') + '…'
}

export interface OgMeta {
  title: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export function applyOgMeta(meta: OgMeta) {
  const { title, description = '', image = '', url = window.location.href, type = 'website' } = meta

  const shortTitle = truncateWords(title, 5)
  const shortDesc = description.slice(0, 50)

  document.title = title

  // Standard meta description
  let descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (!descEl) {
    descEl = document.createElement('meta')
    descEl.setAttribute('name', 'description')
    document.head.appendChild(descEl)
  }
  if (shortDesc) descEl.setAttribute('content', shortDesc)

  setTag('og:site_name', 'WriteSpace')
  setTag('og:title', shortTitle)
  setTag('og:type', type)
  setTag('og:url', url)
  if (shortDesc) setTag('og:description', shortDesc)
  if (image) setTag('og:image', absoluteUrl(image))
  setTag('og:image:alt', shortTitle)

  setTag('twitter:card', image ? 'summary_large_image' : 'summary')
  setTag('twitter:site', '@WriteSpace')
  setTag('twitter:title', shortTitle)
  if (shortDesc) setTag('twitter:description', shortDesc)
  if (image) setTag('twitter:image', absoluteUrl(image))
}

export function clearOgMeta(originalTitle = 'WriteSpace') {
  document.title = originalTitle
  for (const property of OG_PROPERTIES) {
    const attr = property.startsWith('twitter:') ? 'name' : 'property'
    document.querySelector(`meta[${attr}="${property}"]`)?.remove()
  }
  // Clean up standard meta description
  document.querySelector('meta[name="description"]')?.remove()
}