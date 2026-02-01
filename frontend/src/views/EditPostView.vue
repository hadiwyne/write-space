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
        <div class="form-group visibility-row">
          <label class="visibility-label">Visibility</label>
          <select v-model="visibility" class="visibility-select">
            <option value="PUBLIC">Public – visible to everyone</option>
            <option value="FOLLOWERS_ONLY">Followers only – visible to people who follow you</option>
          </select>
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
const post = ref<{ id: string; title: string; content: string; tags: string[]; visibility?: string } | null>(null)
const title = ref('')
const visibility = ref<'PUBLIC' | 'FOLLOWERS_ONLY'>('PUBLIC')
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
    visibility.value = (data.visibility as 'PUBLIC' | 'FOLLOWERS_ONLY') || 'PUBLIC'
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
      visibility: visibility.value,
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
.visibility-row { display: flex; align-items: center; gap: 0.75rem; }
.visibility-label { font-size: 0.9375rem; }
.visibility-select { padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 0.9375rem; min-width: 18rem; }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.actions { margin-top: 0.5rem; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-primary { background: var(--primary); color: #fff; }
</style>
