/** Extract unique @usernames from content (letters, numbers, underscore only). */
export function extractMentionedUsernames(content: string): string[] {
  if (!content || typeof content !== 'string') return [];
  const matches = content.matchAll(/@([a-zA-Z0-9_]+)/g);
  const set = new Set<string>();
  for (const m of matches) set.add(m[1]);
  return [...set];
}
