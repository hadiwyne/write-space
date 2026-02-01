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
          v-for="p in collection.items"
          :key="(p as { id: string }).id"
          :post="p"
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

const route = useRoute()
const collection = ref<Record<string, unknown> | null>(null)
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
.collection-header { margin-bottom: 1.5rem; }
.collection-header h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
.description { color: var(--gray-700); margin: 0 0 0.5rem; }
.owner { font-size: 0.9375rem; color: var(--primary); text-decoration: none; }
.owner:hover { text-decoration: underline; }
.post-list { display: flex; flex-direction: column; gap: 1rem; }
.loading, .empty, .error { color: var(--gray-700); padding: 1rem 0; }
</style>
