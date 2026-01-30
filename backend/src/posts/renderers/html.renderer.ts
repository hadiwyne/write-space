import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string, options?: object) => string };

@Injectable()
export class HtmlRenderer {
  render(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
    });
  }
}
