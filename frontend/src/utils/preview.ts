import DOMPurify from 'dompurify'
import katex from 'katex'
import { marked } from 'marked'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div', 'hr']
const ALLOWED_ATTR = ['href', 'src', 'alt', 'class']

export type ContentType = 'MARKDOWN' | 'LATEX' | 'HTML' | 'WYSIWYG'

export function renderPreview(content: string, contentType: ContentType): string {
  if (!content?.trim()) return '<p class="preview-empty">Nothing to preview yet.</p>'
  try {
    switch (contentType) {
      case 'MARKDOWN': {
        const html = marked.parse(content, { async: false }) as string
        return DOMPurify.sanitize(html, { ALLOWED_TAGS: [...ALLOWED_TAGS, 'table', 'thead', 'tbody', 'tr', 'th', 'td'], ALLOWED_ATTR })
      }
      case 'LATEX':
        return renderLatexPreview(content)
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

function renderLatexPreview(content: string): string {
  let str = content
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => {
    try {
      return katex.renderToString(inner.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return escapeHtml(`$$${inner}$$`)
    }
  })
  str = str.replace(/\$([^$\n]+)\$/g, (_, inner) => {
    try {
      return katex.renderToString(inner.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return escapeHtml(`$${inner}$`)
    }
  })
  const escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br/>')
  return '<p>' + escaped + '</p>'
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
