import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const katex = require('katex') as { renderToString: (latex: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DOMPurify = require('isomorphic-dompurify') as { sanitize: (html: string, options?: object) => string };

/**
 * Renders LaTeX content to HTML. Supports:
 * - Display math: $$ ... $$
 * - Inline math: $ ... $
 * Non-math text is escaped and wrapped in <p>.
 */
@Injectable()
export class LatexRenderer {
  render(content: string): string {
    if (!content || !content.trim()) return '<p></p>';
    const parts: string[] = [];
    const displayRegex = /\$\$([\s\S]*?)\$\$/g;
    const inlineRegex = /\$([^$\n]+)\$/g;

    // Process display math first ($$ ... $$)
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const displayMatches: { start: number; end: number; latex: string }[] = [];
    displayRegex.lastIndex = 0;
    while ((match = displayRegex.exec(content)) !== null) {
      displayMatches.push({ start: match.index, end: match.index + match[0].length, latex: match[1].trim() });
    }

    // Process inline math ($ ... $) - only outside display blocks
    const inlineMatches: { start: number; end: number; latex: string }[] = [];
    inlineRegex.lastIndex = 0;
    while ((match = inlineRegex.exec(content)) !== null) {
      const insideDisplay = displayMatches.some((d) => match!.index > d.start && match!.index < d.end);
      if (!insideDisplay) {
        inlineMatches.push({ start: match.index, end: match.index + match[0].length, latex: match[1].trim() });
      }
    }

    // Merge and sort all math segments with text
    type Segment = { type: 'text'; start: number; end: number } | { type: 'display'; start: number; end: number; latex: string } | { type: 'inline'; start: number; end: number; latex: string };
    const segments: Segment[] = [];
    displayMatches.forEach((m) => segments.push({ type: 'display', start: m.start, end: m.end, latex: m.latex }));
    inlineMatches.forEach((m) => segments.push({ type: 'inline', start: m.start, end: m.end, latex: m.latex }));
    segments.sort((a, b) => a.start - b.start);

    let pos = 0;
    for (const seg of segments) {
      if (seg.start > pos) {
        const text = content.slice(pos, seg.start);
        parts.push(this.escapeAndWrap(text));
      }
      if (seg.type === 'display') {
        try {
          parts.push(katex.renderToString(seg.latex, { displayMode: true, throwOnError: false }));
        } catch {
          parts.push(this.escapeAndWrap(`$$${seg.latex}$$`));
        }
      } else if (seg.type === 'inline') {
        try {
          parts.push(katex.renderToString(seg.latex, { displayMode: false, throwOnError: false }));
        } catch {
          parts.push(this.escapeAndWrap(`$${seg.latex}$`));
        }
      }
      pos = seg.end;
    }
    if (pos < content.length) {
      parts.push(this.escapeAndWrap(content.slice(pos)));
    }
    if (segments.length === 0) {
      return DOMPurify.sanitize(this.escapeAndWrap(content) || '<p></p>', { ALLOWED_TAGS: ['p', 'br'] });
    }
    const html = parts.join('\n');
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'span', 'math', 'mrow', 'mi', 'mo', 'mn', 'mtext', 'mspace', 'mover', 'munder', 'msub', 'msup', 'mfrac', 'mtable', 'mtr', 'mtd', 'semantics', 'annotation', 'annotation-xml'],
      ALLOWED_ATTR: ['class', 'style', 'href', 'xmlns'],
    });
  }

  private escapeAndWrap(text: string): string {
    if (!text.trim()) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n');
  }
}
