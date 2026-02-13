<template>
  <div class="settings-page">
    <h1>Settings</h1>
    <form @submit.prevent="saveProfile" class="form">
      <div class="form-group avatar-section">
        <label>Avatar</label>
        <div class="avatar-row">
          <div
            v-if="avatarPreview || auth.user?.avatarUrl"
            class="avatar-preview-clip"
            :class="avatarShapeClass(auth.user?.avatarShape)"
          >
            <img :src="avatarPreview || avatarSrc(auth.user?.avatarUrl, auth.avatarVersion)" alt="" class="avatar-preview-img" />
          </div>
          <span
            v-else
            class="avatar-placeholder"
            :class="avatarShapeClass(auth.user?.avatarShape)"
          >{{ (auth.user?.displayName || auth.user?.username || '?')[0] }}</span>
          <div class="avatar-actions">
            <AvatarUploadCrop
              :current-preview-url="avatarPreview || avatarSrc(auth.user?.avatarUrl, auth.avatarVersion) || null"
              @crop="onAvatarCrop"
            />
            <p class="hint">JPEG, PNG, GIF or WebP. Max 5MB.</p>
            <label class="avatar-shape-label">Avatar shape</label>
            <div class="avatar-shape-options" role="group" aria-label="Avatar shape">
              <label class="avatar-shape-option">
                <input type="radio" value="circle" :checked="avatarShape === 'circle'" @change="avatarShape = 'circle'" />
                <span>Circle</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="rounded" :checked="avatarShape === 'rounded'" @change="avatarShape = 'rounded'" />
                <span>Rounded square</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="square" :checked="avatarShape === 'square'" @change="avatarShape = 'square'" />
                <span>Square</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="squircle" :checked="avatarShape === 'squircle'" @change="avatarShape = 'squircle'" />
                <span>Squircle</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="hexagon" :checked="avatarShape === 'hexagon'" @change="avatarShape = 'hexagon'" />
                <span>Hexagon</span>
              </label>
            </div>
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
import { avatarShapeClass } from '@/utils/avatar'

const auth = useAuthStore()
const displayName = ref('')
const bio = ref('')
const profileHTML = ref('')
const avatarShape = ref<'circle' | 'rounded' | 'square' | 'squircle' | 'hexagon'>('circle')
const avatarPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const error = ref('')
const success = ref('')
const saving = ref(false)

onMounted(() => {
  if (auth.user) {
    displayName.value = auth.user.displayName || ''
    bio.value = (auth.user as { bio?: string }).bio || ''
    const s = (auth.user as { avatarShape?: string | null }).avatarShape
    avatarShape.value = ['square', 'rounded', 'squircle', 'hexagon'].includes(s || '') ? (s as typeof avatarShape.value) : 'circle'
  }
  auth.fetchUser().then(() => {
    if (auth.user) {
      displayName.value = auth.user.displayName || ''
      bio.value = (auth.user as { bio?: string }).bio || ''
      const s = (auth.user as { avatarShape?: string | null }).avatarShape
      avatarShape.value = ['square', 'rounded', 'squircle', 'hexagon'].includes(s || '') ? (s as typeof avatarShape.value) : 'circle'
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
      auth.bumpAvatarVersion()
      selectedFile.value = null
      if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = null
    }
    await api.patch('/users/me', {
      displayName: displayName.value || undefined,
      bio: bio.value || undefined,
      profileHTML: profileHTML.value || undefined,
      avatarShape: avatarShape.value,
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
/* Preview: container shapes, image fills it (no background so no black/gray around image) */
.avatar-preview-clip {
  width: 64px;
  height: 64px;
  overflow: hidden;
  background: none;
  flex-shrink: 0;
  display: block;
}
.avatar-preview-clip .avatar-preview-img {
  width: 100%;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  border-radius: 0;
}
.avatar-placeholder { width: 64px; height: 64px; object-fit: cover; background: var(--gray-200); display: inline-block; line-height: 64px; font-size: 1.5rem; text-align: center; flex-shrink: 0; }
.avatar-shape-circle.avatar-placeholder { border-radius: 50%; }
.avatar-shape-rounded.avatar-placeholder { border-radius: 12%; }
.avatar-shape-square.avatar-placeholder { border-radius: 0; }
.avatar-shape-squircle.avatar-placeholder { border-radius: 25%; }
.avatar-shape-hexagon.avatar-placeholder { border-radius: 0; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
.avatar-shape-label { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--gray-600); margin: 0.75rem 0 0.35rem; }
.avatar-shape-options { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; }
.avatar-shape-option { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.9375rem; cursor: pointer; }
.avatar-shape-option input { cursor: pointer; }
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
