<template>
  <div class="settings-page">
    <h1>Settings</h1>
    <form @submit.prevent="saveProfile" class="form">
      <div class="form-group avatar-section">
        <label>Avatar</label>
        <div class="avatar-row">
          <img
            v-if="avatarPreview || auth.user?.avatarUrl"
            :src="avatarPreview || avatarSrc(auth.user?.avatarUrl)"
            alt=""
            class="avatar-preview"
          />
          <span v-else class="avatar-placeholder">{{ (auth.user?.displayName || auth.user?.username || '?')[0] }}</span>
          <div class="avatar-actions">
            <AvatarUploadCrop
              :current-preview-url="avatarPreview || avatarSrc(auth.user?.avatarUrl) || null"
              @crop="onAvatarCrop"
            />
            <p class="hint">JPEG, PNG, GIF or WebP. Max 2MB. Crop to a circle before saving.</p>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="displayName">Display name</label>
        <input id="displayName" v-model="displayName" type="text" placeholder="Display name" class="input" />
      </div>
      <div class="form-group">
        <label for="bio">Bio</label>
        <textarea id="bio" v-model="bio" placeholder="Short bio" class="textarea" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label for="profileHTML">Custom profile HTML</label>
        <textarea id="profileHTML" v-model="profileHTML" placeholder="Optional HTML for your profile (safe tags only)" class="textarea" rows="6"></textarea>
        <p class="hint">Supports: p, headings, lists, links, images. Max 10,000 characters.</p>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">Save profile</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api, avatarSrc } from '@/api/client'
import AvatarUploadCrop from '@/components/AvatarUploadCrop.vue'

const auth = useAuthStore()
const displayName = ref('')
const bio = ref('')
const profileHTML = ref('')
const avatarPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const error = ref('')
const success = ref('')
const saving = ref(false)


onMounted(() => {
  if (auth.user) {
    displayName.value = auth.user.displayName || ''
    bio.value = (auth.user as { bio?: string }).bio || ''
  }
  auth.fetchUser().then(() => {
    if (auth.user) {
      displayName.value = auth.user.displayName || ''
      bio.value = (auth.user as { bio?: string }).bio || ''
    }
  })
})

function onAvatarCrop(file: File) {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  selectedFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  error.value = ''
}

async function saveProfile() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('avatar', selectedFile.value)
      const { data } = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      auth.user = { ...auth.user, ...data }
      selectedFile.value = null
      if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = null
    }
    await api.patch('/users/me', {
      displayName: displayName.value || undefined,
      bio: bio.value || undefined,
      profileHTML: profileHTML.value || undefined,
    })
    await auth.fetchUser()
    success.value = 'Profile saved.'
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page { padding: 0; }
.settings-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 1rem; }
.form { max-width: 400px; width: 100%; min-width: 0; display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--gray-700); margin-bottom: 0.25rem; }
.avatar-section { }
.avatar-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
@media (max-width: 480px) {
  .avatar-row { flex-direction: column; align-items: flex-start; }
  .avatar-actions { width: 100%; }
}
.avatar-preview, .avatar-placeholder { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; background: var(--gray-200); display: inline-block; line-height: 64px; font-size: 1.5rem; text-align: center; flex-shrink: 0; }
.avatar-actions { }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.btn-outline { background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
.hint { font-size: 0.75rem; color: var(--gray-700); margin: 0.25rem 0 0; }
.input, .textarea { width: 100%; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 1rem; }
.textarea { resize: vertical; font-family: inherit; }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.success { color: #16a34a; font-size: 0.875rem; margin: 0; }
.btn-primary { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; background: var(--primary); color: #fff; }
</style>
