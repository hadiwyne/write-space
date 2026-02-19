import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import * as sanitizeHtmlModule from 'sanitize-html';

const sanitizeHtml =
  (typeof (sanitizeHtmlModule as unknown as { default?: unknown }).default === 'function'
    ? (sanitizeHtmlModule as unknown as { default: (dirty: string, options?: object) => string }).default
    : sanitizeHtmlModule) as (dirty: string, options?: object) => string;

@Injectable()
export class MarkdownRenderer {
  render(content: string): string {
    const html = marked.parse(content, { async: false }) as string;
    return sanitizeHtml(html, {
      allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr'],
      allowedAttributes: {
        a: ['href', 'class', 'target'],
        img: ['src', 'alt', 'class'],
        p: ['class'], strong: ['class'], em: ['class'], b: ['class'], i: ['class'], blockquote: ['class'],
        h1: ['class'], h2: ['class'], h3: ['class'], h4: ['class'], h5: ['class'], h6: ['class'],
        ul: ['class'], ol: ['class'], li: ['class'], code: ['class'], pre: ['class'], hr: ['class'],
      },
    });
  }
}
