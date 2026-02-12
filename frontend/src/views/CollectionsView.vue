<template>
  <div class="collections-page">
    <h1>Collections</h1>
    <p class="intro">Group posts into collections (series, reading lists, etc.).</p>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else class="toolbar">
      <button type="button" class="btn btn-primary" @click="showCreate = true">New collection</button>
    </div>
    <div v-if="collections.length === 0 && !loading" class="empty">No collections yet. Create one to get started.</div>
    <ul v-else class="collection-list">
      <li v-for="c in collections" :key="collectionKey(c)" class="collection-item">
        <router-link :to="collectionLink(c)" class="collection-link">
          <span class="collection-title">{{ c.title }}</span>
          <span class="collection-count">{{ itemCount(c) }} posts</span>
        </router-link>
      </li>
    </ul>
    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <div class="modal">
        <h2>New collection</h2>
        <form @submit.prevent="createCollection">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newTitle" type="text" required placeholder="e.g. My short stories" />
          </div>
          <div class="form-group">
            <label>Description (optional)</label>
            <textarea v-model="newDesc" rows="2" placeholder="Brief description"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showCreate = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="creating">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'

const router = useRouter()
const collections = ref<Record<string, unknown>[]>([])
const loading = ref(true)

function collectionKey(c: Record<string, unknown>) {
  return String((c as { id?: string }).id ?? '')
}

function itemCount(c: Record<string, unknown>) {
  return (c as { _count?: { items: number } })._count?.items ?? 0
}
const showCreate = ref(false)
const newTitle = ref('')
const newDesc = ref('')
const creating = ref(false)

function collectionLink(c: Record<string, unknown>) {
  const slug = c.slug || c.id
  return `/collections/${slug}`
}

onMounted(async () => {
  try {
    const { data } = await api.get('/collections/me')
    collections.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
})

async function createCollection() {
  if (!newTitle.value.trim() || creating.value) return
  creating.value = true
  try {
    const { data } = await api.post('/collections', { title: newTitle.value.trim(), description: newDesc.value.trim() || undefined })
    collections.value = [data, ...collections.value]
    showCreate.value = false
    newTitle.value = ''
    newDesc.value = ''
    router.push(collectionLink(data))
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.collections-page { padding: 0; }
.collections-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 0.5rem; }
.intro { color: var(--gray-700); margin: 0 0 1rem; font-size: 0.9375rem; }
.toolbar { margin-bottom: 1rem; }
.collection-list { list-style: none; margin: 0; padding: 0; }
.collection-item { margin-bottom: 0.5rem; }
.collection-link { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--gray-50); border-radius: var(--radius); text-decoration: none; color: inherit; min-width: 0; }
.collection-link:hover { background: var(--gray-100); }
.collection-title { font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.collection-count { font-size: 0.875rem; color: var(--gray-600); flex-shrink: 0; margin-left: 0.5rem; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: #fff; padding: 1.5rem; border-radius: var(--radius); min-width: 20rem; max-width: min(28rem, calc(100vw - 2rem)); width: 100%; }
.modal h2 { margin: 0 0 1rem; font-size: 1.25rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.875rem; margin-bottom: 0.25rem; }
.form-group input, .form-group textarea { width: 100%; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; flex-wrap: wrap; }
@media (max-width: 480px) {
  .modal { padding: 1rem; min-width: 0; }
  .collection-link { padding: 0.625rem 0.75rem; }
}
.btn-ghost { background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
</style>
