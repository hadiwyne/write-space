import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Tracks which posts the current user has liked during the session.
 * Persists across navigation so the heart stays red even when the feed refetches
 * and the API doesn't return liked status in the response.
 */
export const useLikedPostsStore = defineStore('likedPosts', () => {
  const liked = ref<Set<string>>(new Set())

  function setLiked(postId: string, isLiked: boolean) {
    if (isLiked) {
      liked.value = new Set([...liked.value, postId])
    } else {
      const next = new Set(liked.value)
      next.delete(postId)
      liked.value = next
    }
  }

  function has(postId: string) {
    return liked.value.has(postId)
  }

  function clear() {
    liked.value = new Set()
  }

  return { liked, setLiked, has, clear }
})
