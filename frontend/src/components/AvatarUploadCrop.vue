<template>
  <div class="avatar-upload-crop">
    <template v-if="!cropState.imageUrl">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        class="file-input"
        @change="onFileSelect"
      />
      <slot name="trigger" :open="openFileDialog">
        <button type="button" class="btn btn-outline btn-sm" @click="openFileDialog">
          {{ currentPreviewUrl ? 'Change avatar' : 'Choose image' }}
        </button>
      </slot>
      <p v-if="currentPreviewUrl" class="preview-hint">Current avatar shown. Choose image to crop a new one.</p>
    </template>

    <template v-else>
      <div class="crop-stage">
        <p class="crop-instructions">Drag to position, use the slider to zoom. The circle shows how your avatar will look.</p>
        <div
          class="crop-container"
          ref="cropContainerRef"
          @mousedown="startDrag"
          @touchstart.prevent="startDrag"
        >
          <div class="crop-circle">
            <img
              ref="cropImageRef"
              :src="cropState.imageUrl"
              alt="Crop"
              class="crop-image"
              :style="imageStyle"
              draggable="false"
              @load="onImageLoad"
            />
          </div>
        </div>
        <div class="zoom-row">
          <label class="zoom-label">Zoom</label>
          <input
            v-model.number="cropState.scale"
            type="range"
            min="0.3"
            max="3"
            step="0.05"
            class="zoom-slider"
            @input="clampScale"
          />
        </div>
        <div class="crop-actions">
          <button type="button" class="btn btn-ghost" @click="cancelCrop">Cancel</button>
          <button type="button" class="btn btn-primary" @click="applyCrop" :disabled="applying">
            {{ applying ? 'Applying…' : 'Use this crop' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted } from 'vue'

const CROP_SIZE = 280
const RADIUS = CROP_SIZE / 2
const OUTPUT_SIZE = 256

withDefaults(
  defineProps<{
    /** Current avatar URL (for showing "current" state when no crop in progress) */
    currentPreviewUrl?: string | null
  }>(),
  { currentPreviewUrl: null }
)

const emit = defineEmits<{
  crop: [file: File]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const cropContainerRef = ref<HTMLElement | null>(null)
const cropImageRef = ref<HTMLImageElement | null>(null)
const applying = ref(false)

interface CropState {
  imageUrl: string
  naturalWidth: number
  naturalHeight: number
  scale: number
  panX: number
  panY: number
  isDragging: boolean
  dragStartX: number
  dragStartY: number
  dragStartPanX: number
  dragStartPanY: number
}

const cropState = reactive<CropState>({
  imageUrl: '',
  naturalWidth: 0,
  naturalHeight: 0,
  scale: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartPanX: 0,
  dragStartPanY: 0,
})

const imageStyle = computed(() => {
  const s = cropState
  const w = s.naturalWidth * s.scale
  const h = s.naturalHeight * s.scale
  const left = RADIUS - w / 2 + s.panX
  const top = RADIUS - h / 2 + s.panY
  return {
    width: `${w}px`,
    height: `${h}px`,
    left: `${left}px`,
    top: `${top}px`,
  }
})

function openFileDialog() {
  fileInputRef.value?.click()
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    alert('Image must be under 2MB')
    return
  }
  if (cropState.imageUrl) URL.revokeObjectURL(cropState.imageUrl)
  cropState.imageUrl = URL.createObjectURL(file)
  cropState.scale = 1
  cropState.panX = 0
  cropState.panY = 0
  cropState.naturalWidth = 0
  cropState.naturalHeight = 0
  input.value = ''
}

function onImageLoad() {
  const img = cropImageRef.value
  if (!img) return
  cropState.naturalWidth = img.naturalWidth
  cropState.naturalHeight = img.naturalHeight
  const fit = Math.min(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
  cropState.scale = Math.min(fit, 1.2)
}

function clampScale() {
  cropState.scale = Math.max(0.3, Math.min(3, cropState.scale))
}

function startDrag(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  cropState.isDragging = true
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX
  const y = 'touches' in e ? e.touches[0].clientY : e.clientY
  cropState.dragStartX = x
  cropState.dragStartY = y
  cropState.dragStartPanX = cropState.panX
  cropState.dragStartPanY = cropState.panY
  if ('touches' in e) {
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false })
    window.addEventListener('touchend', endDrag)
  } else {
    window.addEventListener('mousemove', onDrag as (e: MouseEvent) => void)
    window.addEventListener('mouseup', endDrag)
  }
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!cropState.isDragging) return
  e.preventDefault()
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX
  const y = 'touches' in e ? e.touches[0].clientY : e.clientY
  cropState.panX = cropState.dragStartPanX + (x - cropState.dragStartX)
  cropState.panY = cropState.dragStartPanY + (y - cropState.dragStartY)
}

function endDrag() {
  if (!cropState.isDragging) return
  cropState.isDragging = false
  window.removeEventListener('mousemove', onDrag as (e: MouseEvent) => void)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onTouchMove, { capture: true })
  window.removeEventListener('touchend', endDrag)
}

function onTouchMove(e: TouchEvent) {
  onDrag(e)
  if (cropState.isDragging) e.preventDefault()
}

function cancelCrop() {
  if (cropState.imageUrl) {
    URL.revokeObjectURL(cropState.imageUrl)
    cropState.imageUrl = ''
  }
}

function getCroppedBlob(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = cropImageRef.value
    if (!img || !cropState.naturalWidth) {
      reject(new Error('Image not ready'))
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }
    const { scale, panX, panY } = cropState
    const nw = cropState.naturalWidth
    const nh = cropState.naturalHeight
    const canvasScale = (OUTPUT_SIZE / 2 / RADIUS) * scale
    const imgCenterX = nw / 2 - panX / scale
    const imgCenterY = nh / 2 - panY / scale
    const drawX = OUTPUT_SIZE / 2 - imgCenterX * canvasScale
    const drawY = OUTPUT_SIZE / 2 - imgCenterY * canvasScale
    const drawW = nw * canvasScale
    const drawH = nh * canvasScale

    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, 0, 0, nw, nh, drawX, drawY, drawW, drawH)

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      'image/jpeg',
      0.92
    )
  })
}

async function applyCrop() {
  applying.value = true
  try {
    const blob = await getCroppedBlob()
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    emit('crop', file)
    cancelCrop()
  } catch (e) {
    console.error(e)
    alert('Failed to crop image')
  } finally {
    applying.value = false
  }
}

onUnmounted(() => {
  if (cropState.imageUrl) URL.revokeObjectURL(cropState.imageUrl)
  window.removeEventListener('mousemove', onDrag as (e: MouseEvent) => void)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onTouchMove, { capture: true })
  window.removeEventListener('touchend', endDrag)
})
</script>

<style scoped>
.avatar-upload-crop { }
.file-input { display: none; }
.btn { padding: 0.5rem 1rem; border-radius: var(--radius); border: none; cursor: pointer; font-size: 0.9375rem; }
.btn-outline { background: transparent; border: 1px solid var(--gray-300); color: var(--gray-700); }
.btn-outline:hover { background: var(--gray-100); }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-ghost { background: transparent; color: var(--gray-700); }
.btn-ghost:hover { background: var(--gray-100); }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.preview-hint { font-size: 0.8125rem; color: var(--gray-700); margin: 0.5rem 0 0; }

.crop-stage { margin-top: 0.5rem; }
.crop-instructions { font-size: 0.8125rem; color: var(--gray-700); margin: 0 0 0.75rem; }
.crop-container {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: var(--gray-200);
  cursor: move;
  user-select: none;
  touch-action: none;
}
.crop-circle { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%; }
.crop-image {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  user-select: none;
}
.zoom-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; }
.zoom-label { font-size: 0.875rem; color: var(--gray-700); min-width: 2.5rem; }
.zoom-slider { flex: 1; max-width: 200px; height: 6px; accent-color: var(--primary); }
.crop-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
</style>
