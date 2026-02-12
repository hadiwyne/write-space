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
          <div class="dropdown-wrap" ref="visibilityDropdownRef">
            <button type="button" class="dropdown-trigger" :aria-expanded="visibilityDropdownOpen" @click="visibilityDropdownOpen = !visibilityDropdownOpen">
              <i :class="visibilityIcon" aria-hidden="true"></i>
              <span>{{ visibilityLabel }}</span>
              <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
            </button>
            <Transition name="dropdown">
              <div v-if="visibilityDropdownOpen" class="dropdown-panel" role="menu">
                <button type="button" class="dropdown-option" role="menuitem" :class="{ active: visibility === 'PUBLIC' }" @click="visibility = 'PUBLIC'; visibilityDropdownOpen = false">
                  <i class="pi pi-globe" aria-hidden="true"></i> Public
                </button>
                <button type="button" class="dropdown-option" role="menuitem" :class="{ active: visibility === 'FOLLOWERS_ONLY' }" @click="visibility = 'FOLLOWERS_ONLY'; visibilityDropdownOpen = false">
                  <i class="pi pi-users" aria-hidden="true"></i> Followers
                </button>
              </div>
            </Transition>
          </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
const visibilityDropdownOpen = ref(false)
const visibilityDropdownRef = ref<HTMLElement | null>(null)

const tags = computed(() => tagsStr.value.split(',').map((t) => t.trim()).filter(Boolean))
const visibilityLabel = computed(() => (visibility.value === 'PUBLIC' ? 'Public' : 'Followers'))
const visibilityIcon = computed(() => (visibility.value === 'PUBLIC' ? 'pi pi-globe' : 'pi pi-users'))

function onEditDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (visibilityDropdownRef.value && !visibilityDropdownRef.value.contains(target)) visibilityDropdownOpen.value = false
}

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
onMounted(() => document.addEventListener('click', onEditDocumentClick))
onUnmounted(() => document.removeEventListener('click', onEditDocumentClick))

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
.edit-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 1rem; }
.form { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.title-input { width: 100%; min-width: 0; font-size: clamp(1.125rem, 4vw, 1.25rem); padding: 0.5rem 0; border: none; border-bottom: 1px solid var(--gray-200); }
.editor { width: 100%; min-width: 0; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-family: inherit; resize: vertical; box-sizing: border-box; }
.tags-input { width: 100%; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); }
.visibility-row { display: flex; align-items: center; gap: 0.75rem; }
.dropdown-wrap { position: relative; }
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.dropdown-trigger:hover { border-color: var(--border-medium); }
.dropdown-trigger:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.dropdown-chevron { font-size: 0.75rem; color: var(--text-tertiary); margin-left: 0.25rem; }
.dropdown-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 12rem;
  max-width: min(20rem, calc(100vw - 2rem));
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}
.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.dropdown-option:hover { background: var(--bg-primary); }
.dropdown-option.active {
  background: rgba(139, 69, 19, 0.08);
  color: var(--accent-primary);
  font-weight: 600;
}
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.actions { margin-top: 0.5rem; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-primary { background: var(--primary); color: #fff; }
</style>
