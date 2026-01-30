import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string, options?: object) => string };

@Injectable()
export class HtmlRenderer {
  render(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'mark', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'span', 'div', 'code', 'pre', 'hr'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'data-text-align'],
    });
  }
}
