/** Constructs an absolute URL from a potentially relative API path */
export function absoluteUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return window.location.origin + (path.startsWith('/') ? path : '/' + path)
}

const OG_PROPERTIES = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']

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

export interface OgMeta {
  title: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export function applyOgMeta(meta: OgMeta) {
  const { title, description = '', image = '', url = window.location.href, type = 'website' } = meta

  document.title = title

  setTag('og:title', title)
  setTag('og:type', type)
  setTag('og:url', url)
  if (description) setTag('og:description', description)
  if (image) setTag('og:image', absoluteUrl(image))

  setTag('twitter:card', image ? 'summary_large_image' : 'summary')
  setTag('twitter:title', title)
  if (description) setTag('twitter:description', description)
  if (image) setTag('twitter:image', absoluteUrl(image))
}

export function clearOgMeta(originalTitle = 'WriteSpace') {
  document.title = originalTitle
  for (const property of OG_PROPERTIES) {
    const attr = property.startsWith('twitter:') ? 'name' : 'property'
    document.querySelector(`meta[${attr}="${property}"]`)?.remove()
  }
}
