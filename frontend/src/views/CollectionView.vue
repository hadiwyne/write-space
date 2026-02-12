<template>
  <div class="collection-page">
    <div v-if="loading" class="loading">Loading…</div>
    <template v-else-if="collection">
      <div class="collection-header">
        <h1>{{ collection.title }}</h1>
        <p v-if="collection.description" class="description">{{ collection.description }}</p>
        <router-link v-if="collection.user" :to="`/u/${collection.user.username}`" class="owner">
          By {{ collection.user.displayName || collection.user.username }}
        </router-link>
      </div>
      <div v-if="collection.items?.length === 0" class="empty">No posts in this collection yet.</div>
      <div v-else class="post-list">
        <PostCard
          v-for="p in (collection.items ?? [])"
          :key="postKey(p)"
          :post="postAsRecord(p)"
        />
      </div>
    </template>
    <div v-else class="error">Collection not found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
import PostCard from '@/components/PostCard.vue'

function postKey(p: Record<string, unknown> | unknown) {
  return String((p as { id?: string }).id ?? '')
}

function postAsRecord(p: unknown): Record<string, unknown> {
  return p as Record<string, unknown>
}

const route = useRoute()
type CollectionWithUser = Record<string, unknown> & {
  user?: { username?: string; displayName?: string }
  items?: unknown[]
}
const collection = ref<CollectionWithUser | null>(null)
const loading = ref(true)

async function load() {
  const idOrSlug = route.params.idOrSlug as string
  if (!idOrSlug) return
  loading.value = true
  try {
    const { data } = await api.get(`/collections/${idOrSlug}`)
    collection.value = data
  } catch {
    collection.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.idOrSlug, load)
</script>

<style scoped>
.collection-page { padding: 0; }
.collection-header { margin-bottom: clamp(1rem, 3vw, 1.5rem); }
.collection-header h1 { font-size: clamp(1.25rem, 4vw, 1.75rem); margin: 0 0 0.5rem; }
.description { color: var(--gray-700); margin: 0 0 0.5rem; }
.owner { font-size: 0.9375rem; color: var(--primary); text-decoration: none; }
.owner:hover { text-decoration: underline; }
.post-list { display: flex; flex-direction: column; gap: clamp(1rem, 3vw, 1.5rem); }
.loading, .empty, .error { color: var(--gray-700); padding: 1rem 0; }
</style>
