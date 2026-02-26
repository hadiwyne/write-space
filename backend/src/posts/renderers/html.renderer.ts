import { Injectable } from '@nestjs/common';
import * as sanitizeHtmlModule from 'sanitize-html';

const sanitizeHtml =
  (typeof (sanitizeHtmlModule as unknown as { default?: unknown }).default === 'function'
    ? (sanitizeHtmlModule as unknown as { default: (dirty: string, options?: object) => string }).default
    : sanitizeHtmlModule) as (dirty: string, options?: object) => string;

@Injectable()
export class HtmlRenderer {
  render(content: string): string {
    return sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'mark', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div', 'code', 'pre', 'hr'],
      allowedAttributes: {
        a: ['href', 'class', 'style', 'target', 'rel'],
        img: ['src', 'alt', 'class', 'style'],
        p: ['class', 'style', 'data-text-align'], span: ['class', 'style', 'data-text-align'], div: ['class', 'style', 'data-text-align'],
        strong: ['class'], em: ['class'], u: ['class'], s: ['class'], mark: ['class'], blockquote: ['class'],
        h1: ['class'], h2: ['class'], h3: ['class'], h4: ['class'], h5: ['class'], h6: ['class'],
        ul: ['class'], ol: ['class'], li: ['class'], code: ['class'], pre: ['class'], hr: ['class'],
      },
    });
  }
}
