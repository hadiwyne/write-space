import DOMPurify from 'dompurify'
import { marked } from 'marked'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'mark', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div', 'hr']
const ALLOWED_ATTR = ['href', 'src', 'alt', 'class', 'style', 'target', 'rel']

export type ContentType = 'MARKDOWN' | 'HTML' | 'WYSIWYG'

export function renderPreview(content: string, contentType: ContentType): string {
  if (!content?.trim()) return '<p class="preview-empty">Nothing to preview yet.</p>'
  try {
    switch (contentType) {
      case 'MARKDOWN': {
        const html = marked.parse(content, { async: false }) as string
        return DOMPurify.sanitize(html, { ALLOWED_TAGS: [...ALLOWED_TAGS, 'table', 'thead', 'tbody', 'tr', 'th', 'td'], ALLOWED_ATTR })
      }
      case 'HTML':
      case 'WYSIWYG':
        return DOMPurify.sanitize(content, { ALLOWED_TAGS, ALLOWED_ATTR })
      default:
        return DOMPurify.sanitize(content, { ALLOWED_TAGS, ALLOWED_ATTR })
    }
  } catch {
    return '<p class="preview-error">Preview error.</p>'
  }
}

