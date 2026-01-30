<template>
  <div class="edit-page">
    <div v-if="loading">Loading…</div>
    <template v-else-if="post">
      <h1>Edit post</h1>
      <form @submit.prevent="save" class="form">
        <div class="form-group">
          <input v-model="title" type="text" placeholder="Title" required class="title-input" />
        </div>
        <div class="form-group">
          <textarea v-model="content" placeholder="Content" class="editor" rows="16"></textarea>
        </div>
        <div class="form-group">
          <input v-model="tagsStr" type="text" placeholder="Tags (comma-separated)" class="tags-input" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">Save</button>
        </div>
      </form>
    </template>
    <div v-else>Post not found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api/client'

const route = useRoute()
const router = useRouter()
const post = ref<{ id: string; title: string; content: string; tags: string[] } | null>(null)
const title = ref('')
const content = ref('')
const tagsStr = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const tags = computed(() => tagsStr.value.split(',').map((t) => t.trim()).filter(Boolean))

onMounted(async () => {
  const id = route.params.id as string
  try {
    const { data } = await api.get(`/posts/${id}`)
    post.value = data
    title.value = data.title
    content.value = data.content
    tagsStr.value = (data.tags || []).join(', ')
  } catch {
    post.value = null
  } finally {
    loading.value = false
  }
})

async function save() {
  if (!post.value) return
  error.value = ''
  saving.value = true
  try {
    await api.patch(`/posts/${post.value.id}`, {
      title: title.value,
      content: content.value,
      tags: tags.value,
    })
    router.push(`/posts/${post.value.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.edit-page { padding: 0; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.title-input { width: 100%; font-size: 1.25rem; padding: 0.5rem 0; border: none; border-bottom: 1px solid var(--gray-200); }
.editor { width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-family: inherit; resize: vertical; }
.tags-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.actions { margin-top: 0.5rem; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-primary { background: var(--primary); color: #fff; }
</style>
