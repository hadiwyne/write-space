/**
 * Deterministic anonymous avatar URL for a post (by post id).
 * Used for anonymous posts and for comments by the post author on their anonymous post.
 */
const anonAvatarModules = import.meta.glob<{ default: string }>('@/assets/anonavatars/*', { eager: true })
const anonAvatarUrls = Object.values(anonAvatarModules).map((m) => m.default).filter(Boolean)

export function getAnonAvatarUrl(postId: string): string {
  if (!postId || anonAvatarUrls.length === 0) return ''
  let hash = 0
  for (let i = 0; i < postId.length; i++) hash = (hash << 5) - hash + postId.charCodeAt(i)
  const index = Math.abs(hash) % anonAvatarUrls.length
  return anonAvatarUrls[index]
}
