<template>
  <Teleport to="body">
    <div v-if="open" class="crop-backdrop">
      <div class="crop-modal" role="dialog" aria-modal="true" aria-label="Crop image">
      <h2 class="crop-title">Crop image</h2>
      <div class="crop-area" ref="cropAreaRef">
        <img
          ref="imgRef"
          :src="imageObjectUrl || imageSrc"
          class="crop-source-img"
          crossorigin="anonymous"
          @load="onImageLoad"
          @error="loadError = true"
        />
        <div
          v-if="loaded"
          class="crop-overlay"
          @mousedown="onCropBoxMouseDown"
          @touchstart="onCropBoxTouchStart"
        >
          <div
            ref="cropBoxRef"
            class="crop-box"
            :style="cropBoxStyle"
          >
            <span class="crop-handle crop-handle-nw" @mousedown.stop="onHandleStart($event, 'nw')" @touchstart.stop.prevent="onHandleTouchStart($event, 'nw')" />
            <span class="crop-handle crop-handle-ne" @mousedown.stop="onHandleStart($event, 'ne')" @touchstart.stop.prevent="onHandleTouchStart($event, 'ne')" />
            <span class="crop-handle crop-handle-sw" @mousedown.stop="onHandleStart($event, 'sw')" @touchstart.stop.prevent="onHandleTouchStart($event, 'sw')" />
            <span class="crop-handle crop-handle-se" @mousedown.stop="onHandleStart($event, 'se')" @touchstart.stop.prevent="onHandleTouchStart($event, 'se')" />
          </div>
        </div>
      </div>
      <p v-if="loadError" class="crop-error">Could not load image. It may be from another site.</p>
      <div class="crop-actions">
        <button type="button" class="btn btn-outline" @click="$emit('close')">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="!loaded || loadError" @click="applyCrop">
          Apply crop
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  open: boolean
  imageSrc: string
}>()

function lockBodyScroll(lock: boolean) {
  const val = lock ? 'hidden' : ''
  document.documentElement.style.overflow = val
  document.body.style.overflow = val
}

const emit = defineEmits<{
  close: []
  'crop-apply': [blob: Blob]
}>()

const cropAreaRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const cropBoxRef = ref<HTMLElement | null>(null)
const loaded = ref(false)
const loadError = ref(false)
const imageObjectUrl = ref('')

const crop = ref({ x: 0, y: 0, w: 100, h: 100 })
const imgNatural = ref({ w: 0, h: 0 })
const imgDisplay = ref({ w: 0, h: 0 })

const cropBoxStyle = ref({ left: '0%', top: '0%', width: '100%', height: '100%' })

function onImageLoad() {
  loadError.value = false
  const img = imgRef.value
  if (!img) return
  imgNatural.value = { w: img.naturalWidth, h: img.naturalHeight }
  const rect = img.getBoundingClientRect()
  imgDisplay.value = { w: rect.width, h: rect.height }
  crop.value = { x: 0, y: 0, w: 100, h: 100 }
  cropBoxStyle.value = { left: '0%', top: '0%', width: '100%', height: '100%' }
  loaded.value = true
}

watch(
  () => props.open,
  (isOpen) => {
    lockBodyScroll(!!isOpen)
  },
  { immediate: true }
)
watch(
  () => [props.open, props.imageSrc],
  async () => {
    if (imageObjectUrl.value) {
      URL.revokeObjectURL(imageObjectUrl.value)
      imageObjectUrl.value = ''
    }
    if (!props.open || !props.imageSrc) {
      loaded.value = false
      loadError.value = false
      return
    }
    loadError.value = false
    if (props.imageSrc.startsWith('data:') || props.imageSrc.startsWith('blob:')) {
      imageObjectUrl.value = ''
      return
    }
    try {
      const res = await fetch(props.imageSrc, { mode: 'cors' })
      if (!res.ok) throw new Error('Fetch failed')
      const blob = await res.blob()
      imageObjectUrl.value = URL.createObjectURL(blob)
    } catch {
      imageObjectUrl.value = ''
    }
  },
  { immediate: true }
)

let dragStart = { x: 0, y: 0, cx: 0, cy: 0, cw: 0, ch: 0, mode: '' }

function onCropBoxMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.crop-handle')) return
  if (!(e.target as HTMLElement).closest('.crop-box')) return
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    cx: crop.value.x,
    cy: crop.value.y,
    cw: crop.value.w,
    ch: crop.value.h,
    mode: 'move',
  }
  const onMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - dragStart.x) / imgDisplay.value.w * 100
    const dy = (ev.clientY - dragStart.y) / imgDisplay.value.h * 100
    if (dragStart.mode === 'move') {
      crop.value = {
        ...crop.value,
        x: Math.max(0, Math.min(100 - crop.value.w, dragStart.cx + dx)),
        y: Math.max(0, Math.min(100 - crop.value.h, dragStart.cy + dy)),
      }
    } else {
      const [nx, ny, nw, nh] = resizeCrop(dragStart, ev.clientX, ev.clientY)
      crop.value = { x: nx, y: ny, w: nw, h: nh }
    }
    updateCropBoxStyle()
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function resizeCrop(
  start: { cx: number; cy: number; cw: number; ch: number; mode: string },
  clientX: number,
  clientY: number
): [number, number, number, number] {
  const dx = (clientX - dragStart.x) / imgDisplay.value.w * 100
  const dy = (clientY - dragStart.y) / imgDisplay.value.h * 100
  const MIN_SIZE = 5
  let x: number
  let y: number
  let w: number
  let h: number
  switch (start.mode) {
    case 'se': {
      // Fixed: top-left (start.cx, start.cy). Moving: bottom-right.
      w = Math.max(MIN_SIZE, Math.min(100 - start.cx, start.cw + dx))
      h = Math.max(MIN_SIZE, Math.min(100 - start.cy, start.ch + dy))
      x = start.cx
      y = start.cy
      break
    }
    case 'sw': {
      // Fixed: top-right. Moving: bottom-left. Left edge = start.cx + dx, bottom fixed.
      w = Math.max(MIN_SIZE, Math.min(start.cx + start.cw, start.cw - dx))
      x = start.cx + start.cw - w
      h = Math.max(MIN_SIZE, Math.min(100 - start.cy, start.ch + dy))
      y = start.cy
      break
    }
    case 'ne': {
      // Fixed: bottom-left. Moving: top-right. Top edge moves by dy.
      w = Math.max(MIN_SIZE, Math.min(100 - start.cx, start.cw + dx))
      x = start.cx
      h = Math.max(MIN_SIZE, Math.min(start.cy + start.ch, start.ch - dy))
      y = start.cy + start.ch - h
      break
    }
    case 'nw': {
      // Fixed: bottom-right. Moving: top-left.
      w = Math.max(MIN_SIZE, Math.min(start.cx + start.cw, start.cw - dx))
      x = start.cx + start.cw - w
      h = Math.max(MIN_SIZE, Math.min(start.cy + start.ch, start.ch - dy))
      y = start.cy + start.ch - h
      break
    }
    default:
      return [crop.value.x, crop.value.y, crop.value.w, crop.value.h]
  }
  return [x, y, w, h]
}

function onHandleStart(e: MouseEvent, mode: string) {
  e.preventDefault()
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    cx: crop.value.x,
    cy: crop.value.y,
    cw: crop.value.w,
    ch: crop.value.h,
    mode,
  }
  const onMove = (ev: MouseEvent) => {
    const [nx, ny, nw, nh] = resizeCrop(dragStart, ev.clientX, ev.clientY)
    crop.value = { x: nx, y: ny, w: nw, h: nh }
    updateCropBoxStyle()
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onHandleTouchStart(e: TouchEvent, mode: string) {
  if (!e.changedTouches?.length) return
  const t = e.changedTouches[0]
  dragStart = {
    x: t.clientX,
    y: t.clientY,
    cx: crop.value.x,
    cy: crop.value.y,
    cw: crop.value.w,
    ch: crop.value.h,
    mode,
  }
  const touchId = t.identifier
  const onTouchMove = (ev: TouchEvent) => {
    const touch = Array.from(ev.touches).find((tc) => tc.identifier === touchId)
    if (touch) {
      const [nx, ny, nw, nh] = resizeCrop(dragStart, touch.clientX, touch.clientY)
      crop.value = { x: nx, y: ny, w: nw, h: nh }
      updateCropBoxStyle()
      ev.preventDefault()
    }
  }
  const onTouchEnd = (ev: TouchEvent) => {
    if (Array.from(ev.changedTouches).some((tc) => tc.identifier === touchId)) {
      document.removeEventListener('touchmove', onTouchMove, { capture: true })
      document.removeEventListener('touchend', onTouchEnd, { capture: true })
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true })
    }
  }
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  document.addEventListener('touchend', onTouchEnd, { capture: true })
  document.addEventListener('touchcancel', onTouchEnd, { capture: true })
}

function onCropBoxTouchStart(e: TouchEvent) {
  if ((e.target as HTMLElement).closest('.crop-handle')) return
  if (!(e.target as HTMLElement).closest('.crop-box')) return
  if (!e.changedTouches?.length) return
  e.preventDefault()
  const t = e.changedTouches[0]
  dragStart = {
    x: t.clientX,
    y: t.clientY,
    cx: crop.value.x,
    cy: crop.value.y,
    cw: crop.value.w,
    ch: crop.value.h,
    mode: 'move',
  }
  const touchId = t.identifier
  const onTouchMove = (ev: TouchEvent) => {
    const touch = Array.from(ev.touches).find((tc) => tc.identifier === touchId)
    if (touch) {
      const dx = (touch.clientX - dragStart.x) / imgDisplay.value.w * 100
      const dy = (touch.clientY - dragStart.y) / imgDisplay.value.h * 100
      crop.value = {
        ...crop.value,
        x: Math.max(0, Math.min(100 - crop.value.w, dragStart.cx + dx)),
        y: Math.max(0, Math.min(100 - crop.value.h, dragStart.cy + dy)),
      }
      updateCropBoxStyle()
      ev.preventDefault()
    }
  }
  const onTouchEnd = (ev: TouchEvent) => {
    if (Array.from(ev.changedTouches).some((tc) => tc.identifier === touchId)) {
      document.removeEventListener('touchmove', onTouchMove, { capture: true })
      document.removeEventListener('touchend', onTouchEnd, { capture: true })
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true })
    }
  }
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  document.addEventListener('touchend', onTouchEnd, { capture: true })
  document.addEventListener('touchcancel', onTouchEnd, { capture: true })
}

function updateCropBoxStyle() {
  cropBoxStyle.value = {
    left: `${crop.value.x}%`,
    top: `${crop.value.y}%`,
    width: `${crop.value.w}%`,
    height: `${crop.value.h}%`,
  }
}

function applyCrop() {
  const img = imgRef.value
  if (!img || !loaded.value) return
  const canvas = document.createElement('canvas')
  const nw = imgNatural.value.w
  const nh = imgNatural.value.h
  const x = (crop.value.x / 100) * nw
  const y = (crop.value.y / 100) * nh
  const w = (crop.value.w / 100) * nw
  const h = (crop.value.h / 100) * nh
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
  canvas.toBlob(
    (blob) => {
      if (blob) emit('crop-apply', blob)
      emit('close')
    },
    'image/png',
    0.95
  )
}

onBeforeUnmount(() => {
  lockBodyScroll(false)
  if (imageObjectUrl.value) URL.revokeObjectURL(imageObjectUrl.value)
})
</script>

<style scoped>
.crop-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 1rem;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: none;
  overscroll-behavior: contain;
}
.crop-modal {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}
.crop-title {
  margin: 0;
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}
.crop-area {
  position: relative;
  overflow: hidden;
  max-width: 600px;
  max-height: 400px;
  margin: 1rem 1.25rem;
  background: #000;
}
.crop-source-img {
  display: block;
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
}
.crop-overlay {
  position: absolute;
  inset: 0;
  cursor: move;
}
.crop-box {
  position: absolute;
  border: 2px solid var(--bg-card);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}
.crop-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 2px;
  touch-action: none;
}
.crop-handle-nw { top: -4px; left: -4px; cursor: nwse-resize; }
.crop-handle-ne { top: -4px; right: -4px; cursor: nesw-resize; }
.crop-handle-sw { bottom: -4px; left: -4px; cursor: nesw-resize; }
.crop-handle-se { bottom: -4px; right: -4px; cursor: nwse-resize; }
.crop-error {
  margin: 0 1.25rem;
  color: var(--accent-burgundy);
  font-size: 0.875rem;
}
.crop-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-light);
}
.crop-actions .btn {
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.crop-actions .btn-outline {
  background: transparent;
  border: 2px solid var(--border-medium);
  color: var(--text-primary);
}
.crop-actions .btn-outline:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.crop-actions .btn-primary {
  background: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  color: var(--bg-card);
}
.crop-actions .btn-primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.crop-actions .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
