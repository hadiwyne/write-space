<template>
  <div class="settings-page">
    <h1>Settings</h1>
    <form @submit.prevent="saveProfile" class="form">
      <div class="form-group avatar-section">
        <label>Avatar</label>
        <div class="avatar-row">
          <AvatarFrame :frame="avatarFrame" :shape-class="avatarShapeClass(auth.user?.avatarShape)">
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
          </AvatarFrame>
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
            </div>
            <label class="avatar-shape-label">Avatar frame</label>
            <div class="frame-type-options">
              <label class="avatar-shape-option">
                <input type="radio" value="none" :checked="frameBorderType === 'none'" @change="frameBorderType = 'none'" />
                <span>None</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="gradient" :checked="frameBorderType === 'gradient'" @change="frameBorderType = 'gradient'" />
                <span>Gradient</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="glow" :checked="frameBorderType === 'glow'" @change="frameBorderType = 'glow'" />
                <span>Glow</span>
              </label>
              <label class="avatar-shape-option">
                <input type="radio" value="preset" :checked="frameBorderType === 'preset'" @change="frameBorderType = 'preset'" />
                <span>Preset</span>
              </label>
            </div>
            <template v-if="frameBorderType === 'gradient'">
              <div class="frame-colors">
                <label class="frame-label">Colors (2–4)</label>
                <div class="color-row">
                  <input v-for="(_, i) in gradientColors" :key="i" v-model="gradientColors[i]" type="color" class="color-input" />
                </div>
              </div>
              <div class="frame-row">
                <label class="frame-label">Angle</label>
                <input v-model.number="gradientAngle" type="range" min="0" max="360" class="frame-slider" />
                <span class="frame-value">{{ gradientAngle }}°</span>
              </div>
              <label class="frame-check"><input v-model="gradientConic" type="checkbox" /> Circular (conic)</label>
              <label class="frame-check"><input v-model="gradientAnimated" type="checkbox" /> Animated</label>
              <div v-if="gradientAnimated" class="frame-row">
                <label class="frame-label">Speed</label>
                <input v-model.number="gradientSpeed" type="range" min="0.2" max="3" step="0.1" class="frame-slider" />
              </div>
            </template>
            <template v-if="frameBorderType === 'glow'">
              <div class="frame-row">
                <label class="frame-label">Color</label>
                <input v-model="glowColor" type="color" class="color-input-inline" />
              </div>
              <div class="frame-row">
                <label class="frame-label">Intensity</label>
                <input v-model.number="glowIntensity" type="range" min="0" max="1" step="0.1" class="frame-slider" />
              </div>
              <label class="frame-check"><input v-model="glowPulse" type="checkbox" /> Pulse</label>
            </template>
            <template v-if="frameBorderType === 'preset'">
              <select v-model="presetName" class="frame-select">
                <option value="gamer">Gamer (RGB ring)</option>
                <option value="soft">Soft (pastel halo)</option>
                <option value="premium">Premium (gold)</option>
                <option value="fire">Fire</option>
              </select>
            </template>
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api, avatarSrc } from '@/api/client'
import AvatarUploadCrop from '@/components/AvatarUploadCrop.vue'
import AvatarFrame from '@/components/AvatarFrame.vue'
import { avatarShapeClass } from '@/utils/avatar'
import type { AvatarFrame as AvatarFrameType } from '@/types/avatarFrame'

const auth = useAuthStore()
const displayName = ref('')
const bio = ref('')
const profileHTML = ref('')
const avatarShape = ref<'circle' | 'rounded' | 'square' | 'squircle'>('circle')
const avatarPreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const error = ref('')
const success = ref('')
const saving = ref(false)

const frameBorderType = ref<'none' | 'gradient' | 'glow' | 'preset'>('none')
const gradientColors = ref(['#ff7a18', '#ff0066', '#7a00ff'])
const gradientAngle = ref(90)
const gradientConic = ref(false)
const gradientAnimated = ref(true)
const gradientSpeed = ref(1)
const glowColor = ref('#ff00cc')
const glowIntensity = ref(0.5)
const glowPulse = ref(false)
const presetName = ref<'gamer' | 'soft' | 'premium' | 'fire'>('gamer')

const avatarFrame = computed<AvatarFrameType>(() => {
  if (frameBorderType.value === 'none') return null
  if (frameBorderType.value === 'gradient') {
    const colors = gradientColors.value.filter((c) => c)
    if (colors.length < 2) return null
    return {
      borderType: 'gradient',
      gradient: {
        colors,
        angle: gradientAngle.value,
        conic: gradientConic.value,
        animated: gradientAnimated.value,
        speed: gradientSpeed.value,
      },
    }
  }
  if (frameBorderType.value === 'glow') {
    return {
      borderType: 'glow',
      glow: { enabled: true, color: glowColor.value, intensity: glowIntensity.value, pulse: glowPulse.value },
    }
  }
  if (frameBorderType.value === 'preset') {
    return { borderType: 'preset', preset: presetName.value }
  }
  return null
})

function loadAvatarFrame(f: AvatarFrameType | null | undefined) {
  if (!f || typeof f !== 'object') {
    frameBorderType.value = 'none'
    return
  }
  frameBorderType.value = (f.borderType as 'none' | 'gradient' | 'glow' | 'preset') || 'none'
  if (f.gradient) {
    gradientColors.value = [...f.gradient.colors.slice(0, 4)]
    while (gradientColors.value.length < 3) gradientColors.value.push('#888')
    gradientAngle.value = f.gradient.angle ?? 90
    gradientConic.value = !!f.gradient.conic
    gradientAnimated.value = !!f.gradient.animated
    gradientSpeed.value = f.gradient.speed ?? 1
  }
  if (f.glow) {
    glowColor.value = f.glow.color ?? '#ff00cc'
    glowIntensity.value = f.glow.intensity ?? 0.5
    glowPulse.value = !!f.glow.pulse
  }
  if (f.preset) presetName.value = f.preset
}

onMounted(() => {
  if (auth.user) {
    displayName.value = auth.user.displayName || ''
    bio.value = (auth.user as { bio?: string }).bio || ''
    const s = (auth.user as { avatarShape?: string | null }).avatarShape
    avatarShape.value = ['square', 'rounded', 'squircle'].includes(s || '') ? (s as typeof avatarShape.value) : 'circle'
    loadAvatarFrame((auth.user as { avatarFrame?: AvatarFrameType }).avatarFrame)
  }
  auth.fetchUser().then(() => {
    if (auth.user) {
      displayName.value = auth.user.displayName || ''
      bio.value = (auth.user as { bio?: string }).bio || ''
      const s = (auth.user as { avatarShape?: string | null }).avatarShape
      avatarShape.value = ['square', 'rounded', 'squircle'].includes(s || '') ? (s as typeof avatarShape.value) : 'circle'
      loadAvatarFrame((auth.user as { avatarFrame?: AvatarFrameType }).avatarFrame)
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
      avatarFrame: frameBorderType.value === 'none' ? null : avatarFrame.value,
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
.avatar-shape-label { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--gray-600); margin: 0.75rem 0 0.35rem; }
.avatar-shape-options { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; }
.avatar-shape-option { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.9375rem; cursor: pointer; }
.avatar-shape-option input { cursor: pointer; }
.frame-type-options { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 0.35rem; }
.frame-colors { margin-top: 0.5rem; }
.frame-colors .frame-label { margin-bottom: 0.25rem; }
.color-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.color-input { width: 36px; height: 28px; padding: 2px; border: 1px solid var(--gray-300); border-radius: 4px; cursor: pointer; }
.frame-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
.frame-label { font-size: 0.8125rem; font-weight: 500; color: var(--gray-600); min-width: 4rem; }
.frame-slider { flex: 1; min-width: 80px; max-width: 160px; }
.frame-value { font-size: 0.8125rem; color: var(--gray-600); }
.frame-check { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.875rem; margin-top: 0.5rem; margin-right: 1rem; cursor: pointer; }
.frame-check input { cursor: pointer; }
.frame-select { padding: 0.35rem 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 0.9375rem; margin-top: 0.35rem; }
.color-input-inline { width: 36px; height: 28px; padding: 2px; border: 1px solid var(--gray-300); border-radius: 4px; cursor: pointer; }
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
