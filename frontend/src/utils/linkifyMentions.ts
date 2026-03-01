/** Escape HTML for safe insertion. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Replace @username in HTML with profile links. Use for post renderedHTML.
 * Only replaces in text (avoids matching inside tag attributes by using a simple regex;
 * usernames are [a-zA-Z0-9_]+ so we don't match emails).
 */
export function linkifyMentionsInHtml(html: string): string {
  if (!html) return ''
  return html.replace(/@([a-zA-Z0-9_]+)/g, (_, username) => {
    return `<a href="/u/${escapeHtml(username)}" class="mention-link">@${escapeHtml(username)}</a>`
  })
}

/**
 * Escape text and replace @username with profile links. Use for plain-text comment content.
 */
export function linkifyMentionsInText(text: string): string {
  if (!text) return ''
  const escaped = escapeHtml(text)
  return escaped.replace(/@([a-zA-Z0-9_]+)/g, (_, username) => {
    return `<a href="/u/${username}" class="mention-link">@${username}</a>`
  })
}
