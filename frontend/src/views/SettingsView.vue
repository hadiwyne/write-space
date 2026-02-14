<template>
    <div class="settings-page">
      <h1>Settings</h1>
      <form @submit.prevent="saveProfile" class="form">
        <div class="form-group avatar-section">
          <label>Avatar</label>
          <div class="avatar-row">
            <div class="avatar-with-upload">
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
              <div class="avatar-upload-block">
                <AvatarUploadCrop
                  :current-preview-url="avatarPreview || avatarSrc(auth.user?.avatarUrl, auth.avatarVersion) || null"
                  @crop="onAvatarCrop"
                />
                <p class="hint">JPEG, PNG, GIF or WebP. Max 5MB.</p>
              </div>
            </div>
            <div class="avatar-actions">
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
                  <div v-for="(_, i) in gradientColors" :key="i" class="frame-color-row">
                    <span class="frame-color-label">Color {{ i + 1 }}</span>
                    <div class="color-input-wrap">
                      <input
                        :id="`frame-gradient-${i}`"
                        type="color"
                        :value="gradientColors[i]"
                        class="color-picker color-picker-desktop"
                        :aria-label="`Gradient color ${i + 1}`"
                        @input="onFrameGradientColorInput(i, $event)"
                      />
                      <button
                        type="button"
                        class="color-adjust-btn"
                        :aria-label="`Adjust color ${i + 1} with sliders`"
                        :style="{ backgroundColor: gradientColors[i] }"
                        @click="openFrameColorEditor('gradient-' + i)"
                      >
                        <span class="color-adjust-btn-label">Adjust</span>
                      </button>
                      <input
                        type="text"
                        :value="gradientColors[i]"
                        class="color-hex"
                        spellcheck="false"
                        autocapitalize="off"
                        maxlength="7"
                        :placeholder="gradientColors[i]"
                        @input="onFrameGradientHexInput(i, $event)"
                      />
                    </div>
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
                <div class="frame-glow-color-row">
                  <label class="frame-label">Color</label>
                  <div class="color-input-wrap">
                    <input
                      id="frame-glow-color"
                      type="color"
                      :value="glowColor"
                      class="color-picker color-picker-desktop"
                      aria-label="Glow color"
                      @input="onFrameGlowColorInput($event)"
                    />
                    <button
                      type="button"
                      class="color-adjust-btn"
                      aria-label="Adjust glow color with sliders"
                      :style="{ backgroundColor: glowColor }"
                      @click="openFrameColorEditor('glow')"
                    >
                      <span class="color-adjust-btn-label">Adjust</span>
                    </button>
                    <input
                      type="text"
                      :value="glowColor"
                      class="color-hex"
                      spellcheck="false"
                      autocapitalize="off"
                      maxlength="7"
                      :placeholder="glowColor"
                      @input="onFrameGlowHexInput($event)"
                    />
                  </div>
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
              <label class="avatar-shape-label">Badge</label>
              <select v-model="badge" class="frame-select">
                <option v-for="(label, key) in BADGE_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
              <label v-if="badge !== 'none'" class="avatar-shape-label">Badge position</label>
              <select v-if="badge !== 'none'" v-model="badgePosition" class="frame-select">
                <option v-for="(label, key) in BADGE_POSITION_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
              <label class="avatar-shape-label">Extra animation</label>
              <select v-model="frameAnimation" class="frame-select">
                <option v-for="(label, key) in ANIMATION_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
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
  
      <Teleport to="body">
        <div
          v-if="editingFrameColorKey !== null"
          class="modal-backdrop color-editor-backdrop"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`frame-color-editor-title-${editingFrameColorKey}`"
          @click.self="closeFrameColorEditor"
        >
          <div class="modal color-editor-modal">
            <h2 :id="`frame-color-editor-title-${editingFrameColorKey}`" class="modal-heading">
              {{ editingFrameColorKey === 'glow' ? 'Glow color' : 'Gradient color' }}
            </h2>
            <p class="modal-hint">Use sliders or enter a hex code.</p>
            <div class="color-editor-preview" :style="{ backgroundColor: editingHex }"></div>
            <div class="color-editor-hex-wrap">
              <label :for="`frame-color-editor-hex-${editingFrameColorKey}`" class="sr-only">Hex code</label>
              <input
                :id="`frame-color-editor-hex-${editingFrameColorKey}`"
                v-model="editingHex"
                type="text"
                class="color-editor-hex"
                spellcheck="false"
                autocapitalize="off"
                inputmode="text"
                maxlength="7"
                placeholder="#000000"
                @input="onFrameEditorHexInput"
              />
            </div>
            <div class="color-editor-sliders">
              <div class="color-editor-slider-row">
                <label :for="`frame-color-editor-h-${editingFrameColorKey}`" class="color-editor-slider-label">Hue</label>
                <input
                  :id="`frame-color-editor-h-${editingFrameColorKey}`"
                  v-model.number="editingHsl.h"
                  type="range"
                  min="0"
                  max="360"
                  class="color-editor-range color-editor-range-hue"
                  @input="syncFrameHexFromHsl"
                />
                <span class="color-editor-value">{{ Math.round(editingHsl.h) }}°</span>
              </div>
              <div class="color-editor-slider-row">
                <label :for="`frame-color-editor-s-${editingFrameColorKey}`" class="color-editor-slider-label">Saturation</label>
                <input
                  :id="`frame-color-editor-s-${editingFrameColorKey}`"
                  v-model.number="editingHsl.s"
                  type="range"
                  min="0"
                  max="100"
                  class="color-editor-range"
                  @input="syncFrameHexFromHsl"
                />
                <span class="color-editor-value">{{ Math.round(editingHsl.s) }}%</span>
              </div>
              <div class="color-editor-slider-row">
                <label :for="`frame-color-editor-l-${editingFrameColorKey}`" class="color-editor-slider-label">Lightness</label>
                <input
                  :id="`frame-color-editor-l-${editingFrameColorKey}`"
                  v-model.number="editingHsl.l"
                  type="range"
                  min="0"
                  max="100"
                  class="color-editor-range"
                  @input="syncFrameHexFromHsl"
                />
                <span class="color-editor-value">{{ Math.round(editingHsl.l) }}%</span>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-primary" @click="closeFrameColorEditor">Done</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { api, avatarSrc } from '@/api/client'
  import AvatarUploadCrop from '@/components/AvatarUploadCrop.vue'
  import AvatarFrame from '@/components/AvatarFrame.vue'
  import { avatarShapeClass } from '@/utils/avatar'
  import type { AvatarFrame as AvatarFrameType, AvatarBadge, AvatarBadgePosition, AvatarFrameAnimation } from '@/types/avatarFrame'
  import { BADGE_LABELS, BADGE_POSITION_LABELS, ANIMATION_LABELS } from '@/types/avatarFrame'
  
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
  const badge = ref<AvatarBadge>('none')
  const badgePosition = ref<AvatarBadgePosition>('bottom-right')
  const frameAnimation = ref<AvatarFrameAnimation>('none')
  
  const editingFrameColorKey = ref<string | null>(null)
  const editingHex = ref('#000000')
  const editingHsl = ref({ h: 0, s: 0, l: 0 })
  
  function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const n = parseInt(hex.slice(1), 16)
    if (Number.isNaN(n)) return { h: 0, s: 0, l: 0 }
    const r = (n >> 16) / 255
    const g = ((n >> 8) & 0xff) / 255
    const b = (n & 0xff) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      else if (max === g) h = ((b - r) / d + 2) / 6
      else h = ((r - g) / d + 4) / 6
    }
    return { h: h * 360, s: s * 100, l: l * 100 }
  }
  
  function hslToHex(h: number, s: number, l: number): string {
    s /= 100
    l /= 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    }
    const r = Math.round(f(0) * 255)
    const g = Math.round(f(8) * 255)
    const b = Math.round(f(4) * 255)
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  }
  
  function openFrameColorEditor(key: string) {
    editingFrameColorKey.value = key
    const hex = key === 'glow' ? glowColor.value : gradientColors.value[parseInt(key.replace('gradient-', ''), 10)] ?? '#888'
    editingHex.value = hex
    editingHsl.value = hexToHsl(hex)
  }
  
  function closeFrameColorEditor() {
    editingFrameColorKey.value = null
  }
  
  function syncFrameHexFromHsl() {
    const { h, s, l } = editingHsl.value
    const hex = hslToHex(h, s, l)
    editingHex.value = hex
    const key = editingFrameColorKey.value
    if (!key) return
    if (key === 'glow') glowColor.value = hex
    else {
      const i = parseInt(key.replace('gradient-', ''), 10)
      if (!Number.isNaN(i) && gradientColors.value[i] !== undefined) {
        const next = [...gradientColors.value]
        next[i] = hex
        gradientColors.value = next
      }
    }
  }
  
  function onFrameEditorHexInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
    if (/^[0-9A-Fa-f]{6}$/.test(raw)) {
      const hex = '#' + raw
      editingHex.value = hex
      editingHsl.value = hexToHsl(hex)
      const key = editingFrameColorKey.value
      if (key === 'glow') glowColor.value = hex
      else if (key != null) {
        const i = parseInt(key.replace('gradient-', ''), 10)
        if (!Number.isNaN(i) && gradientColors.value[i] !== undefined) {
          const next = [...gradientColors.value]
          next[i] = hex
          gradientColors.value = next
        }
      }
    }
  }
  
  function onFrameGradientColorInput(i: number, e: Event) {
    const value = (e.target as HTMLInputElement).value
    if (value && gradientColors.value[i] !== undefined) {
      const next = [...gradientColors.value]
      next[i] = value
      gradientColors.value = next
    }
  }
  
  function onFrameGradientHexInput(i: number, e: Event) {
    const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
    if (/^[0-9A-Fa-f]{6}$/.test(value) && gradientColors.value[i] !== undefined) {
      const next = [...gradientColors.value]
      next[i] = '#' + value
      gradientColors.value = next
    }
  }
  
  function onFrameGlowColorInput(e: Event) {
    const value = (e.target as HTMLInputElement).value
    if (value) glowColor.value = value
  }
  
  function onFrameGlowHexInput(e: Event) {
    const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
    if (/^[0-9A-Fa-f]{6}$/.test(value)) glowColor.value = '#' + value
  }
  
  const avatarFrame = computed<AvatarFrameType>(() => {
    const hasBorder = frameBorderType.value !== 'none'
    const hasBadge = badge.value !== 'none'
    if (!hasBorder && !hasBadge) return null
  
    let base: NonNullable<AvatarFrameType> = {
      borderType: hasBorder ? frameBorderType.value : 'none',
      ...(hasBadge && { badge: badge.value, badgePosition: badgePosition.value }),
      ...(frameAnimation.value !== 'none' && { animation: frameAnimation.value }),
    }
  
    if (frameBorderType.value === 'gradient') {
      const colors = gradientColors.value.filter((c) => c)
      if (colors.length >= 2) {
        base.gradient = {
          colors,
          angle: gradientAngle.value,
          conic: gradientConic.value,
          animated: gradientAnimated.value,
          speed: gradientSpeed.value,
        }
      }
    } else if (frameBorderType.value === 'glow') {
      base.glow = { enabled: true, color: glowColor.value, intensity: glowIntensity.value, pulse: glowPulse.value }
    } else if (frameBorderType.value === 'preset') {
      base.preset = presetName.value
    }
  
    return base
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
    if (f.badge && f.badge !== 'none') badge.value = f.badge as AvatarBadge
    else badge.value = 'none'
    if (f.badgePosition && ['top-right', 'top-left', 'bottom-left', 'bottom-right'].includes(f.badgePosition)) badgePosition.value = f.badgePosition as AvatarBadgePosition
    else badgePosition.value = 'bottom-right'
    if (f.animation && f.animation !== 'none') frameAnimation.value = f.animation as AvatarFrameAnimation
    else frameAnimation.value = 'none'
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
        avatarFrame: avatarFrame.value,
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
  .settings-page { padding: 0; max-width: 640px; margin: 0 auto; width: 100%; }
  .settings-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 1rem; }
  .form { max-width: 100%; width: 100%; min-width: 0; display: flex; flex-direction: column; gap: 1rem; }
  .form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--gray-700); margin-bottom: 0.25rem; }
  .avatar-section { }
  .avatar-row { display: flex; flex-direction: column; gap: 1rem; }
  .avatar-with-upload {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }
  .avatar-upload-block { display: flex; flex-direction: column; gap: 0.35rem; }
  .avatar-actions { width: 100%; min-width: 0; }
  @media (max-width: 480px) {
    .avatar-with-upload { flex-direction: column; align-items: flex-start; }
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
  .avatar-shape-option { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
  .avatar-shape-option input { cursor: pointer; }
  .avatar-shape-option input[type="radio"],
  .frame-type-options input[type="radio"] {
    appearance: none;
    -webkit-appearance: none;
    width: 1.125rem;
    height: 1.125rem;
    border: 2px solid var(--border-medium);
    border-radius: 2px;
    background: var(--bg-card);
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color 0.2s, background 0.2s;
  }
  .avatar-shape-option input[type="radio"]:checked,
  .frame-type-options input[type="radio"]:checked {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    box-shadow: inset 0 0 0 2px var(--bg-card);
  }
  .frame-type-options { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 0.35rem; }
  .frame-check { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-top: 0.5rem; margin-right: 1rem; cursor: pointer; }
  .frame-check input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 1.125rem;
    height: 1.125rem;
    border: 2px solid var(--border-medium);
    border-radius: 2px;
    background: var(--bg-card);
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color 0.2s, background 0.2s;
  }
  .frame-check input[type="checkbox"]:checked {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 6l3 3 5-6'/%3E%3C/svg%3E");
    background-size: 0.75rem 0.75rem;
    background-position: center;
    background-repeat: no-repeat;
  }
  .frame-colors { margin-top: 0.5rem; }
  .frame-colors .frame-label { margin-bottom: 0.25rem; }
  .frame-color-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .frame-color-label { font-size: 0.8125rem; color: var(--gray-600); min-width: 4.5rem; }
  .frame-glow-color-row { margin-top: 0.5rem; }
  .frame-glow-color-row .frame-label { margin-bottom: 0.25rem; }
  .color-input-wrap { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; }
  .color-picker {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 2px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    cursor: pointer;
  }
  .color-picker-desktop { display: none; }
  @media (min-width: 769px) {
    .color-picker-desktop { display: block; }
  }
  .color-adjust-btn {
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0 0.5rem;
    border: 2px solid var(--border-medium);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
  }
  .color-adjust-btn:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
  @media (min-width: 769px) {
    .color-adjust-btn { min-width: 2.5rem; min-height: 2.5rem; padding: 0; }
    .color-adjust-btn-label { display: none; }
  }
  .color-adjust-btn-label { display: inline; }
  .color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
  .color-picker::-webkit-color-swatch { border: none; border-radius: 4px; }
  .color-hex {
    width: 6.5rem;
    min-height: 2.75rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    font-family: ui-monospace, monospace;
    border: 2px solid var(--border-medium);
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    color: var(--text-primary);
    -webkit-tap-highlight-color: transparent;
  }
  @media (min-width: 769px) {
    .color-hex { min-height: auto; padding: 0.375rem 0.5rem; }
  }
  .color-hex:focus { outline: none; border-color: var(--accent-primary); }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .color-editor-backdrop { align-items: flex-end; padding: 0; }
  @media (min-width: 480px) {
    .color-editor-backdrop { align-items: center; padding: 1rem; }
  }
  .color-editor-modal {
    width: 100%;
    max-width: 360px;
    max-height: 90vh;
    overflow-y: auto;
    margin: 0;
    background: #ffffff;
    color: #1a1a1a;
    border: 2px solid #e0e0e0;
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    padding: 1.5rem;
  }
  .color-editor-modal .modal-heading { color: #1a1a1a; font-size: 1.25rem; margin: 0 0 0.5rem; }
  .color-editor-modal .modal-hint { color: #555; font-size: 0.875rem; margin: 0 0 1rem; }
  .color-editor-modal .color-editor-slider-label { color: #1a1a1a; }
  .color-editor-modal .color-editor-value { color: #555; }
  .color-editor-modal .color-editor-hex {
    background: #f5f5f5;
    border-color: #ccc;
    color: #1a1a1a;
  }
  .color-editor-modal .color-editor-hex::placeholder { color: #888; }
  .color-editor-modal .color-editor-hex:focus { border-color: #8B4513; }
  .color-editor-modal .btn-primary {
    background: #8B4513;
    color: #fff;
    border-color: #8B4513;
  }
  .color-editor-modal .btn-primary:hover { filter: brightness(1.08); }
  .color-editor-modal .color-editor-range:focus-visible { outline-color: #8B4513; }
  .color-editor-modal .color-editor-range::-webkit-slider-runnable-track { background: #e0e0e0; }
  .color-editor-modal .color-editor-range::-webkit-slider-thumb {
    background: #8B4513;
    border-color: #fff;
  }
  .color-editor-modal .color-editor-range::-moz-range-track { background: #e0e0e0; }
  .color-editor-modal .color-editor-range::-moz-range-thumb {
    background: #8B4513;
    border-color: #fff;
  }
  .color-editor-preview {
    height: 4rem;
    border-radius: var(--radius-md);
    border: 2px solid #ccc;
    margin-bottom: 1rem;
  }
  .color-editor-hex-wrap { margin-bottom: 1rem; }
  .color-editor-modal .color-editor-hex {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    font-family: ui-monospace, monospace;
    border: 2px solid #ccc;
    border-radius: var(--radius-sm);
  }
  .color-editor-sliders { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
  .color-editor-slider-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .color-editor-slider-label {
    flex: 0 0 4.5rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
  }
  .color-editor-range {
    flex: 1;
    min-width: 120px;
    min-height: 44px;
    height: 2.75rem;
    margin: 0;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
  }
  .color-editor-range:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
  .color-editor-range::-webkit-slider-runnable-track {
    height: 0.5rem;
    border-radius: 999px;
    background: var(--border-light);
  }
  .color-editor-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--accent-primary);
    border: 2px solid var(--bg-card);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    margin-top: -0.5rem;
    cursor: pointer;
  }
  .color-editor-range::-moz-range-track {
    height: 0.5rem;
    border-radius: 999px;
    background: var(--border-light);
  }
  .color-editor-range::-moz-range-thumb {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--accent-primary);
    border: 2px solid var(--bg-card);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    cursor: pointer;
  }
  .color-editor-range-hue {
    background: transparent;
  }
  .color-editor-range-hue::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  }
  .color-editor-range-hue::-moz-range-track {
    background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  }
  .color-editor-value {
    flex: 0 0 3rem;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
  }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(44, 24, 16, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-actions { margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem; }
  
  .frame-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
  .frame-label { font-size: 0.8125rem; font-weight: 500; color: var(--gray-600); min-width: 4rem; }
  .frame-slider { flex: 1; min-width: 80px; max-width: 160px; }
  .frame-value { font-size: 0.8125rem; color: var(--gray-600); }
  .frame-select {
    display: block;
    width: 100%;
    max-width: 20rem;
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--border-light);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 0.9375rem;
    font-family: inherit;
    cursor: pointer;
    margin-top: 0.35rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%236b635b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4.5 L6 7.5 L9 4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    padding-right: 2.25rem;
  }
  .frame-select:hover { border-color: var(--border-medium); }
  .frame-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
  }
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
  