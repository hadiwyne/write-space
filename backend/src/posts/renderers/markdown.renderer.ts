import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string, options?: object) => string };

@Injectable()
export class MarkdownRenderer {
  render(content: string): string {
    const html = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target'],
    });
  }
}
