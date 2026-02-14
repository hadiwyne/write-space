<template>
  <div class="customization-page">
    <h1>Customization</h1>
    <p class="intro">Change how WriteSpace looks for you.</p>

    <section class="theme-section ui-theme-section">
      <h2 class="section-title">Interface theme</h2>
      <p class="section-hint">Change the </p>
      <div class="ui-theme-options" role="group" aria-label="Interface theme">
        <label class="ui-theme-option">
          <input type="radio" value="default" :checked="theme.uiTheme === 'default'" @change="theme.setUiTheme('default')" />
          <span>Default</span>
        </label>
        <label class="ui-theme-option">
          <input type="radio" value="dark-void" :checked="theme.uiTheme === 'dark-void'" @change="theme.setUiTheme('dark-void')" />
          <span>Dark Void</span>
        </label>
      </div>
    </section>

    <section class="theme-section templates-section">
      <h2 class="section-title">Theme templates</h2>

      <h3 class="subsection-title">Light</h3>
      <div class="templates-grid">
        <button
          v-for="t in theme.lightTemplatesList"
          :key="t.id"
          type="button"
          class="template-card"
          :aria-label="`Apply ${t.name} theme`"
          @click="applyTemplateAndClearDirty(t.id)"
        >
          <span class="template-preview" :style="previewStyle(t.palette)"></span>
          <span class="template-name">{{ t.name }}</span>
        </button>
      </div>

      <h3 class="subsection-title">Dark</h3>
      <div class="templates-grid">
        <button
          v-for="t in theme.darkTemplatesList"
          :key="t.id"
          type="button"
          class="template-card"
          :aria-label="`Apply ${t.name} theme`"
          @click="applyTemplateAndClearDirty(t.id)"
        >
          <span class="template-preview" :style="previewStyle(t.palette)"></span>
          <span class="template-name">{{ t.name }}</span>
        </button>
      </div>

      <template v-if="theme.userTemplates.length">
        <h3 class="subsection-title">Your saved themes</h3>
        <div class="templates-grid">
          <div
            v-for="t in theme.userTemplates"
            :key="t.id"
            class="template-card-wrap"
          >
            <button
              type="button"
              class="template-card"
              :aria-label="`Apply ${t.name} theme`"
              @click="applyTemplateAndClearDirty(t.id)"
            >
              <span class="template-preview" :style="previewStyle(t.palette)"></span>
              <span class="template-name">{{ t.name }}</span>
            </button>
            <button
              type="button"
              class="template-delete"
              :aria-label="`Delete ${t.name} theme`"
              title="Delete theme"
              @click.stop="onDeleteUserTheme(t.id)"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </template>
    </section>

    <section class="theme-section bg-image-section">
      <h2 class="section-title">Page background image</h2>
      <p class="section-hint">Use your own image as the page background instead of a solid colour. Upload a file or paste an image URL.</p>
      <div v-if="theme.bgImageUrl" class="bg-image-preview-wrap">
        <div
          class="bg-image-preview"
          :style="bgPreviewStyle()"
        ></div>
        <div class="bg-image-arrange">
          <p class="bg-arrange-label">Arrange position</p>
          <div class="bg-position-grid" role="group" aria-label="Background position">
            <button
              v-for="pos in bgPositionOptions"
              :key="pos"
              type="button"
              class="bg-position-btn"
              :class="{ active: theme.bgImageOptions.position === pos }"
              :title="pos"
              :aria-label="`Position: ${pos}`"
              :aria-pressed="theme.bgImageOptions.position === pos"
              @click="theme.setBgImageOptions({ position: pos })"
            >
              <span class="bg-position-dot" :class="pos.replace(/\s/g, '-')"></span>
            </button>
          </div>
          <p class="bg-arrange-label">Size & fit</p>
          <div class="bg-size-options" role="group" aria-label="Background size">
            <label class="bg-size-option">
              <input type="radio" :checked="theme.bgImageOptions.size === 'cover'" @change="theme.setBgImageOptions({ size: 'cover' })" />
              <span>Cover</span>
            </label>
            <label class="bg-size-option">
              <input type="radio" :checked="theme.bgImageOptions.size === 'contain'" @change="theme.setBgImageOptions({ size: 'contain' })" />
              <span>Contain</span>
            </label>
            <label class="bg-size-option">
              <input type="radio" :checked="theme.bgImageOptions.size === 'zoom'" @change="theme.setBgImageOptions({ size: 'zoom' })" />
              <span>Zoom</span>
            </label>
          </div>
          <div v-if="theme.bgImageOptions.size === 'zoom'" class="bg-zoom-row">
            <label :for="'bg-zoom-slider'" class="bg-zoom-label">{{ theme.bgImageOptions.sizeZoom }}%</label>
            <input
              :id="'bg-zoom-slider'"
              type="range"
              min="80"
              max="250"
              :value="theme.bgImageOptions.sizeZoom"
              class="bg-zoom-slider"
              @input="onBgZoomInput"
            />
          </div>
          <p class="bg-arrange-label">Repeat</p>
          <div class="bg-repeat-options" role="group" aria-label="Background repeat">
            <label class="bg-size-option">
              <input type="radio" :checked="theme.bgImageOptions.repeat === 'no-repeat'" @change="theme.setBgImageOptions({ repeat: 'no-repeat' })" />
              <span>No repeat</span>
            </label>
            <label class="bg-size-option">
              <input type="radio" :checked="theme.bgImageOptions.repeat === 'repeat'" @change="theme.setBgImageOptions({ repeat: 'repeat' })" />
              <span>Tile</span>
            </label>
          </div>
          <p class="bg-arrange-label">Crop</p>
          <p class="bg-crop-hint">Select only the part of the image you want as your wallpaper. The cropped area will fill your screen.</p>
          <div class="bg-crop-actions">
            <button type="button" class="btn btn-outline" @click="openCropModal">Crop wallpaper</button>
            <button
              v-if="theme.bgImageOptions.crop"
              type="button"
              class="btn btn-outline"
              @click="theme.setBgImageOptions({ crop: null })"
            >Use full image</button>
          </div>
          <p v-if="theme.bgImageOptions.crop" class="bg-crop-active">A crop is applied. Open “Crop wallpaper” to change it.</p>
        </div>
        <div class="bg-image-actions">
          <button type="button" class="btn btn-outline" @click="theme.clearBgImage()">Remove background image</button>
        </div>
      </div>
      <div v-else class="bg-image-upload">
        <input
          ref="bgFileInputRef"
          type="file"
          accept="image/*"
          class="bg-image-file-input"
          aria-label="Choose image file"
          @change="onBgImageFileChange"
        />
        <button type="button" class="btn btn-outline" @click="triggerBgImageFileInput">Upload image</button>
        <span class="bg-image-or">or</span>
        <div class="bg-image-url-wrap">
          <input
            v-model="bgImageUrlInput"
            type="url"
            class="bg-image-url-input"
            placeholder="https://example.com/image.jpg"
            aria-label="Image URL"
            @keydown.enter.prevent="applyBgImageUrl"
          />
          <button type="button" class="btn btn-outline" :disabled="!bgImageUrlInput.trim()" @click="applyBgImageUrl">Use URL</button>
        </div>
      </div>
    </section>

    <section v-for="(keys, group) in theme.THEME_KEYS" :key="group" class="theme-section">
      <h2 class="section-title">{{ sectionTitles[group] }}</h2>
      <div class="color-grid">
        <div v-for="key in keys" :key="key" class="color-row">
          <label :for="`color-${key}`" class="color-label">{{ colorLabels[key] }}</label>
          <div class="color-input-wrap">
            <input
              :id="`color-${key}`"
              type="color"
              :value="theme.get(key)"
              class="color-picker color-picker-desktop"
              :aria-label="colorLabels[key]"
              @input="onColorInput(key, $event)"
            />
            <button
              type="button"
              class="color-adjust-btn"
              :aria-label="`Adjust ${colorLabels[key]} with sliders`"
              :title="`Adjust ${colorLabels[key]}`"
              :style="{ backgroundColor: theme.get(key) }"
              @click="openColorEditor(key)"
            >
              <span class="color-adjust-btn-label">Adjust</span>
            </button>
            <input
              :id="`hex-${key}`"
              type="text"
              :value="theme.get(key)"
              class="color-hex"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              inputmode="text"
              :aria-label="`${colorLabels[key]} hex code`"
              :placeholder="theme.get(key)"
              @input="onHexInput(key, $event)"
            />
            <button
              type="button"
              class="btn-icon-small"
              :aria-label="`Randomize ${colorLabels[key]}`"
              title="Randomize"
              @click="randomizeOne(key)"
            >
              <i class="pi pi-play" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="btn-icon-small"
              :aria-label="`Reset ${colorLabels[key]} to default`"
              title="Reset to default"
              @click="resetOne(key)"
            >
              <i class="pi pi-undo" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="actions">
      <div class="actions-group">
        <button type="button" class="btn btn-primary" @click="randomizeAll">Randomize</button>
        <button type="button" class="btn btn-outline" @click="resetAndClearDirty">Reset to default</button>
      </div>
      <button type="button" class="btn btn-outline" :disabled="!userHasEdited" @click="openSaveModal">Save theme</button>
    </div>

    <Teleport to="body">
      <div v-if="showSaveModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="save-theme-title" @click.self="closeSaveModal">
        <div class="modal save-theme-modal">
          <h2 id="save-theme-title" class="modal-heading">Save theme</h2>
          <p class="modal-hint">Give your theme a name. It will appear in the theme templates above.</p>
          <div class="save-theme-preview" :style="previewStyle(theme.getCurrentPalette())"></div>
          <input
            v-model="saveThemeName"
            type="text"
            class="save-theme-input"
            placeholder="Theme name"
            maxlength="50"
            @keydown.enter.prevent="confirmSaveTheme"
          />
          <p v-if="saveThemeError" class="save-theme-error" role="alert">{{ saveThemeError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeSaveModal">Cancel</button>
            <button type="button" class="btn btn-primary" :disabled="!saveThemeName.trim()" @click="confirmSaveTheme">Save</button>
          </div>
        </div>
      </div>

      <div
        v-if="editingColorKey !== null"
        class="modal-backdrop color-editor-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`color-editor-title-${editingColorKey}`"
        @click.self="closeColorEditor"
      >
        <div class="modal color-editor-modal">
          <h2 :id="`color-editor-title-${editingColorKey}`" class="modal-heading">
            {{ editingColorKey ? colorLabels[editingColorKey] : 'Adjust color' }}
          </h2>
          <p class="modal-hint">Use sliders or enter a hex code.</p>
          <div class="color-editor-preview" :style="{ backgroundColor: editingHex }"></div>
          <div class="color-editor-hex-wrap">
            <label :for="`color-editor-hex-${editingColorKey}`" class="sr-only">Hex code</label>
            <input
              :id="`color-editor-hex-${editingColorKey}`"
              v-model="editingHex"
              type="text"
              class="color-editor-hex"
              spellcheck="false"
              autocapitalize="off"
              inputmode="text"
              maxlength="7"
              placeholder="#000000"
              @input="onEditorHexInput"
            />
          </div>
          <div class="color-editor-sliders">
            <div class="color-editor-slider-row">
              <label :for="`color-editor-h-${editingColorKey}`" class="color-editor-slider-label">Hue</label>
              <input
                :id="`color-editor-h-${editingColorKey}`"
                v-model.number="editingHsl.h"
                type="range"
                min="0"
                max="360"
                class="color-editor-range color-editor-range-hue"
                @input="syncHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingHsl.h) }}°</span>
            </div>
            <div class="color-editor-slider-row">
              <label :for="`color-editor-s-${editingColorKey}`" class="color-editor-slider-label">Saturation</label>
              <input
                :id="`color-editor-s-${editingColorKey}`"
                v-model.number="editingHsl.s"
                type="range"
                min="0"
                max="100"
                class="color-editor-range"
                @input="syncHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingHsl.s) }}%</span>
            </div>
            <div class="color-editor-slider-row">
              <label :for="`color-editor-l-${editingColorKey}`" class="color-editor-slider-label">Lightness</label>
              <input
                :id="`color-editor-l-${editingColorKey}`"
                v-model.number="editingHsl.l"
                type="range"
                min="0"
                max="100"
                class="color-editor-range"
                @input="syncHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingHsl.l) }}%</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeColorEditor">Done</button>
          </div>
        </div>
      </div>

      <div
        v-if="showCropModal && theme.bgImageUrl"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
        @click.self="closeCropModal"
      >
        <div class="modal crop-modal">
          <h2 id="crop-modal-title" class="modal-heading">Crop wallpaper</h2>
          <p class="modal-hint">Drag the box to move it, or drag the corners or edges to resize. Only the area inside the box will show as your background.</p>
          <div
            ref="cropContainerRef"
            class="crop-editor-container"
            :style="{ backgroundImage: `url(${theme.bgImageUrl})` }"
            @mousedown="onCropContainerMouseDown"
            @touchstart.passive="onCropContainerTouchStart"
          >
            <div
              class="crop-box"
              :style="cropBoxStyle()"
              @mousedown.stop="onCropBoxMouseDown($event, 'move')"
              @touchstart.stop.prevent="onCropBoxTouchStart($event, 'move')"
            >
              <div class="crop-handle n" @mousedown.stop="onCropBoxMouseDown($event, 'n')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'n')"></div>
              <div class="crop-handle s" @mousedown.stop="onCropBoxMouseDown($event, 's')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 's')"></div>
              <div class="crop-handle e" @mousedown.stop="onCropBoxMouseDown($event, 'e')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'e')"></div>
              <div class="crop-handle w" @mousedown.stop="onCropBoxMouseDown($event, 'w')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'w')"></div>
              <div class="crop-handle ne" @mousedown.stop="onCropBoxMouseDown($event, 'ne')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'ne')"></div>
              <div class="crop-handle nw" @mousedown.stop="onCropBoxMouseDown($event, 'nw')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'nw')"></div>
              <div class="crop-handle se" @mousedown.stop="onCropBoxMouseDown($event, 'se')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'se')"></div>
              <div class="crop-handle sw" @mousedown.stop="onCropBoxMouseDown($event, 'sw')" @touchstart.stop.prevent="onCropBoxTouchStart($event, 'sw')"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeCropModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="applyCrop">Use this crop</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ThemeKey, ThemeTemplate, BgImagePosition, BgImageCrop } from '@/stores/theme'

const theme = useThemeStore()
const userHasEdited = ref(false)
const showSaveModal = ref(false)
const saveThemeName = ref('')
const saveThemeError = ref('')

const editingColorKey = ref<ThemeKey | null>(null)
const editingHex = ref('#000000')
const editingHsl = ref({ h: 0, s: 0, l: 0 })

const bgFileInputRef = ref<HTMLInputElement | null>(null)
const bgImageUrlInput = ref('')

const showCropModal = ref(false)
const cropEditing = ref<BgImageCrop>({ x: 0, y: 0, width: 1, height: 1 })
const cropContainerRef = ref<HTMLDivElement | null>(null)
const cropDrag = ref<{ mode: string; startX: number; startY: number; startCrop: BgImageCrop } | null>(null)

const bgPositionOptions: BgImagePosition[] = [
  'top left',
  'top',
  'top right',
  'left',
  'center',
  'right',
  'bottom left',
  'bottom',
  'bottom right',
]

function bgPreviewStyle() {
  const url = theme.bgImageUrl
  const opts = theme.bgImageOptions
  if (!url) return {}
  if (opts.crop) {
    const c = opts.crop
    return {
      backgroundImage: `url(${url})`,
      backgroundPosition: `${(-c.x * 100) / c.width}% ${(-c.y * 100) / c.height}%`,
      backgroundSize: `${100 / c.width}% ${100 / c.height}%`,
      backgroundRepeat: opts.repeat,
    }
  }
  const size = opts.size === 'zoom' ? `${opts.sizeZoom}%` : opts.size
  return {
    backgroundImage: `url(${url})`,
    backgroundPosition: opts.position,
    backgroundSize: size,
    backgroundRepeat: opts.repeat,
  }
}

const MIN_CROP = 0.08

function openCropModal() {
  const current = theme.bgImageOptions.crop
  cropEditing.value = current
    ? { ...current }
    : { x: 0, y: 0, width: 1, height: 1 }
  showCropModal.value = true
}

function closeCropModal() {
  showCropModal.value = false
  cropDrag.value = null
}

function cropBoxStyle() {
  const c = cropEditing.value
  return {
    left: `${c.x * 100}%`,
    top: `${c.y * 100}%`,
    width: `${c.width * 100}%`,
    height: `${c.height * 100}%`,
  }
}

function applyCrop() {
  theme.setBgImageOptions({ crop: { ...cropEditing.value } })
  closeCropModal()
}

function getNormFromEvent(e: MouseEvent | TouchEvent, container: DOMRect): { x: number; y: number } {
  const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
  if (clientX == null || clientY == null) return { x: 0, y: 0 }
  return {
    x: Math.max(0, Math.min(1, (clientX - container.left) / container.width)),
    y: Math.max(0, Math.min(1, (clientY - container.top) / container.height)),
  }
}

function getNormFromPointer(clientX: number, clientY: number, container: DOMRect): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(1, (clientX - container.left) / container.width)),
    y: Math.max(0, Math.min(1, (clientY - container.top) / container.height)),
  }
}

function onCropContainerMouseDown() {
  cropDrag.value = null
}

function onCropContainerTouchStart() {
  cropDrag.value = null
}

function onCropBoxMouseDown(e: MouseEvent, mode: string) {
  const el = cropContainerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const { x, y } = getNormFromEvent(e, rect)
  cropDrag.value = { mode, startX: x, startY: y, startCrop: { ...cropEditing.value } }
  const onMove = (e2: MouseEvent) => {
    if (!cropDrag.value) return
    const n = getNormFromPointer(e2.clientX, e2.clientY, rect)
    updateCropFromDrag(n.x, n.y)
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    cropDrag.value = null
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onCropBoxTouchStart(e: TouchEvent, mode: string) {
  const el = cropContainerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  const { x, y } = getNormFromPointer(touch.clientX, touch.clientY, rect)
  cropDrag.value = { mode, startX: x, startY: y, startCrop: { ...cropEditing.value } }
  const onMove = (e2: TouchEvent) => {
    if (!cropDrag.value || !e2.touches[0]) return
    e2.preventDefault()
    const el2 = cropContainerRef.value
    const r = el2 ? el2.getBoundingClientRect() : rect
    const t = e2.touches[0]
    const n = getNormFromPointer(t.clientX, t.clientY, r)
    updateCropFromDrag(n.x, n.y)
  }
  const onEnd = () => {
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    document.removeEventListener('touchcancel', onEnd)
    cropDrag.value = null
  }
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
  document.addEventListener('touchcancel', onEnd)
}

function updateCropFromDrag(normX: number, normY: number) {
  const d = cropDrag.value
  if (!d) return
  const { mode, startX, startY, startCrop: c } = d
  const dx = normX - startX
  const dy = normY - startY
  let next: BgImageCrop = { ...c }
  if (mode === 'move') {
    next.x = Math.max(0, Math.min(1 - c.width, c.x + dx))
    next.y = Math.max(0, Math.min(1 - c.height, c.y + dy))
  } else {
    if (mode.includes('e')) {
      const newW = normX - c.x
      next.width = Math.max(MIN_CROP, Math.min(1 - c.x, newW))
    }
    if (mode.includes('w')) {
      const newX = Math.min(c.x + c.width - MIN_CROP, normX)
      next.x = Math.max(0, newX)
      next.width = c.x + c.width - next.x
    }
    if (mode.includes('s')) {
      const newH = normY - c.y
      next.height = Math.max(MIN_CROP, Math.min(1 - c.y, newH))
    }
    if (mode.includes('n')) {
      const newY = Math.min(c.y + c.height - MIN_CROP, normY)
      next.y = Math.max(0, newY)
      next.height = c.y + c.height - next.y
    }
  }
  cropEditing.value = next
}

function onBgZoomInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!Number.isNaN(val)) theme.setBgImageOptions({ sizeZoom: val })
}

const allKeys: ThemeKey[] = (
  Object.values(theme.THEME_KEYS) as readonly (readonly ThemeKey[])[]
).flat()

function applyTemplateAndClearDirty(id: string) {
  theme.applyTemplate(id)
  userHasEdited.value = false
}

async function onDeleteUserTheme(id: string) {
  try {
    await theme.deleteUserTheme(id)
  } catch {
    // Could show a toast on failure
  }
}

function resetAndClearDirty() {
  theme.reset()
  userHasEdited.value = false
}

function triggerBgImageFileInput() {
  bgFileInputRef.value?.click()
}

const MAX_BG_IMAGE_WIDTH = 1200
const BG_IMAGE_JPEG_QUALITY = 0.82

function compressImageForBg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const scale = w > MAX_BG_IMAGE_WIDTH ? MAX_BG_IMAGE_WIDTH / w : 1
      const cw = Math.round(w * scale)
      const ch = Math.round(h * scale)
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, cw, ch)
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', BG_IMAGE_JPEG_QUALITY)
        resolve(dataUrl)
      } catch {
        reject(new Error('Failed to compress image'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    img.src = objectUrl
  })
}

async function onBgImageFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  input.value = ''
  try {
    const dataUrl = await compressImageForBg(file)
    theme.setBgImage(dataUrl)
  } catch {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (dataUrl) theme.setBgImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }
}

function applyBgImageUrl() {
  const url = bgImageUrlInput.value.trim()
  if (!url) return
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    bgImageUrlInput.value = 'https://' + url
    theme.setBgImage(bgImageUrlInput.value)
  } else {
    theme.setBgImage(url)
  }
}

onMounted(() => {
  theme.fetchUserThemes()
})

function openSaveModal() {
  saveThemeName.value = ''
  saveThemeError.value = ''
  showSaveModal.value = true
}

function closeSaveModal() {
  showSaveModal.value = false
  saveThemeName.value = ''
  saveThemeError.value = ''
}

async function confirmSaveTheme() {
  const name = saveThemeName.value.trim()
  if (!name) return
  saveThemeError.value = ''
  try {
    await theme.saveUserTheme(name)
    closeSaveModal()
    userHasEdited.value = false
  } catch {
    saveThemeError.value = 'Failed to save theme. Please try again.'
  }
}

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')
}

function randomizeOne(key: ThemeKey) {
  theme.set(key, randomHex())
  userHasEdited.value = true
}

function randomizeAll() {
  for (const key of allKeys) theme.set(key, randomHex())
  userHasEdited.value = true
}

const sectionTitles: Record<string, string> = {
  backgrounds: 'Backgrounds',
  text: 'Text',
  accents: 'Accent colors',
  borders: 'Borders',
  actions: 'Actions & highlights',
  navigation: 'Navigation',
}

const colorLabels: Record<ThemeKey, string> = {
  'bg-primary': 'Page background',
  'bg-secondary': 'Secondary background',
  'bg-card': 'Cards & panels',
  'text-primary': 'Primary text',
  'text-secondary': 'Secondary text',
  'text-tertiary': 'Tertiary / muted text',
  'accent-primary': 'Primary accent (buttons, links)',
  'accent-secondary': 'Secondary accent',
  'accent-tertiary': 'Tertiary accent',
  'accent-green': 'Success / green accent',
  'accent-burgundy': 'Burgundy / danger accent',
  'border-light': 'Light borders',
  'border-medium': 'Medium borders',
  'like-color': 'Like / heart color',
  'nav-bg': 'Nav bar background',
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16)
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

function openColorEditor(key: ThemeKey) {
  editingColorKey.value = key
  const hex = theme.get(key)
  editingHex.value = hex
  editingHsl.value = hexToHsl(hex)
}

function closeColorEditor() {
  editingColorKey.value = null
}

function syncHexFromHsl() {
  const { h, s, l } = editingHsl.value
  const hex = hslToHex(h, s, l)
  editingHex.value = hex
  if (editingColorKey.value) {
    theme.set(editingColorKey.value, hex)
    userHasEdited.value = true
  }
}

function onEditorHexInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) {
    const hex = '#' + raw
    editingHex.value = hex
    editingHsl.value = hexToHsl(hex)
    if (editingColorKey.value) {
      theme.set(editingColorKey.value, hex)
      userHasEdited.value = true
    }
  }
}

function onColorInput(key: ThemeKey, e: Event) {
  const target = (e.target as HTMLInputElement)
  if (target?.value) {
    theme.set(key, target.value)
    userHasEdited.value = true
  }
}

function onHexInput(key: ThemeKey, e: Event) {
  const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(value)) {
    theme.set(key, `#${value}`)
    userHasEdited.value = true
  }
}

function resetOne(key: ThemeKey) {
  theme.set(key, theme.defaults[key])
}

function previewStyle(palette: ThemeTemplate) {
  return {
    background: `linear-gradient(135deg, ${palette['bg-primary']} 0%, ${palette['accent-primary']} 50%, ${palette['bg-card']} 100%)`,
  }
}
</script>

<style scoped>
.customization-page { padding: 0; max-width: 640px; margin: 0 auto; width: 100%; }
.customization-page h1 { font-size: clamp(1.5rem, 4vw, 2rem); margin: 0 0 0.5rem; color: var(--text-primary); }
.intro { color: var(--text-secondary); font-size: 0.9375rem; margin: 0 0 2rem; }
.theme-section { margin-bottom: 2rem; }
.section-hint { font-size: 0.9375rem; color: var(--text-secondary); margin: 0 0 1rem; }
.ui-theme-section .section-hint { margin-bottom: 0.75rem; }
.ui-theme-options { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; }
.ui-theme-option { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
.ui-theme-option input { cursor: pointer; }
.ui-theme-option input[type="radio"] {
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
.ui-theme-option input[type="radio"]:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-card);
}
.templates-section .section-title { margin-bottom: 0.75rem; }

.bg-image-section .section-title { margin-bottom: 0.5rem; }
.bg-image-preview-wrap { margin-top: 0.5rem; }
.bg-image-preview {
  width: 100%;
  max-width: 320px;
  height: 12rem;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-medium);
  background-color: var(--bg-secondary);
}
.bg-image-arrange { margin-top: 1rem; }
.bg-arrange-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.5rem;
}
.bg-position-grid {
  display: grid;
  grid-template-columns: repeat(3, 2rem);
  grid-template-rows: repeat(3, 2rem);
  gap: 2px;
  margin-bottom: 1rem;
}
.bg-position-btn {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  place-items: stretch;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.bg-position-btn:hover { border-color: var(--accent-primary); background: var(--bg-secondary); }
.bg-position-btn.active { border-color: var(--accent-primary); background: rgba(139, 69, 19, 0.1); }
.bg-position-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
  margin: auto;
}
.bg-position-dot.top-left { grid-column: 1; grid-row: 1; }
.bg-position-dot.top { grid-column: 2; grid-row: 1; }
.bg-position-dot.top-right { grid-column: 3; grid-row: 1; }
.bg-position-dot.left { grid-column: 1; grid-row: 2; }
.bg-position-dot.center { grid-column: 2; grid-row: 2; }
.bg-position-dot.right { grid-column: 3; grid-row: 2; }
.bg-position-dot.bottom-left { grid-column: 1; grid-row: 3; }
.bg-position-dot.bottom { grid-column: 2; grid-row: 3; }
.bg-position-dot.bottom-right { grid-column: 3; grid-row: 3; }
.bg-size-options, .bg-repeat-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-bottom: 0.75rem;
}
.bg-size-option {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9375rem;
  color: var(--text-primary);
  cursor: pointer;
}
.bg-size-option input { cursor: pointer; }
.bg-zoom-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.bg-zoom-label { font-size: 0.875rem; font-variant-numeric: tabular-nums; min-width: 3rem; color: var(--text-secondary); }
.bg-zoom-slider {
  flex: 1;
  min-width: 100px;
  max-width: 200px;
  height: 0.5rem;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-light);
  border-radius: 999px;
}
.bg-zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-card);
  cursor: pointer;
}
.bg-zoom-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-card);
  cursor: pointer;
}
.bg-crop-hint {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin: -0.25rem 0 0.5rem;
}
.bg-crop-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.25rem; }
.bg-crop-active { font-size: 0.8125rem; color: var(--text-tertiary); margin: 0.25rem 0 0; }
.bg-image-actions { margin-top: 1rem; }

.crop-modal {
  max-width: min(420px, calc(100vw - 2rem));
  background: #ffffff;
  color: #1a1a1a;
  border: 2px solid #e0e0e0;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
}
.crop-modal .modal-heading { color: #1a1a1a; }
.crop-modal .modal-hint { color: #555; }
.crop-modal .btn-primary {
  background: #8B4513;
  color: #fff;
  border-color: #8B4513;
}
.crop-modal .btn-primary:hover { filter: brightness(1.08); }
.crop-modal .btn-outline {
  border-color: #ccc;
  color: #333;
}
.crop-modal .btn-outline:hover { border-color: #8B4513; color: #8B4513; }
.crop-editor-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 280px;
  background-size: 100% 100%;
  background-position: 0 0;
  background-repeat: no-repeat;
  background-color: #f0f0f0;
  border-radius: var(--radius-md);
  border: 2px solid #ccc;
  margin-bottom: 1rem;
  touch-action: none;
  user-select: none;
}
.crop-box {
  position: absolute;
  box-sizing: border-box;
  border: 3px solid #8B4513;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  cursor: move;
}
.crop-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  background: #fff;
  border: 2px solid #8B4513;
  border-radius: 50%;
  cursor: pointer;
  touch-action: none;
}
.crop-handle.n { top: 0; left: 50%; cursor: n-resize; }
.crop-handle.s { bottom: 0; left: 50%; margin-bottom: -10px; margin-left: -10px; cursor: s-resize; }
.crop-handle.e { right: 0; top: 50%; margin-right: -10px; margin-top: -10px; cursor: e-resize; }
.crop-handle.w { left: 0; top: 50%; cursor: w-resize; }
.crop-handle.ne { top: 0; right: 0; margin-right: -10px; cursor: ne-resize; }
.crop-handle.nw { top: 0; left: 0; cursor: nw-resize; }
.crop-handle.se { bottom: 0; right: 0; margin-bottom: -10px; margin-right: -10px; cursor: se-resize; }
.crop-handle.sw { bottom: 0; left: 0; margin-bottom: -10px; cursor: sw-resize; }
.bg-image-upload {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  margin-top: 0.5rem;
}
.bg-image-file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}
.bg-image-or { font-size: 0.9375rem; color: var(--text-tertiary); }
.bg-image-url-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}
.bg-image-url-input {
  min-width: 12rem;
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
}
.bg-image-url-input:focus { outline: none; border-color: var(--accent-primary); }
.bg-image-url-input::placeholder { color: var(--text-tertiary); }

@media (max-width: 600px) {
  .customization-page {
    padding-left: 1rem;
    padding-right: 1rem;
    box-sizing: border-box;
  }
  .actions {
    gap: 0.5rem;
  }
  .actions-group {
    flex-shrink: 0;
    gap: 0.5rem;
  }
  .actions-group .btn,
  .actions > .btn-outline {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }
  .bg-image-upload {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .bg-image-upload .btn.btn-outline:first-of-type {
    align-self: flex-start;
  }
  .bg-image-url-wrap {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .bg-image-url-input {
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
  .bg-image-url-wrap .btn-outline {
    width: 100%;
    box-sizing: border-box;
  }
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 1.25rem 0 0.5rem;
}
.subsection-title:first-of-type { margin-top: 0; }
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
}
.template-card-wrap {
  position: relative;
}
.template-delete {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  z-index: 1;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm, 4px);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: color 0.2s, background 0.2s;
}
.template-delete:hover {
  color: var(--accent-burgundy, #6b2c3e);
  background: var(--bg-secondary);
}
.template-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
}
.template-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.template-preview {
  display: block;
  height: 3rem;
  width: 100%;
  flex-shrink: 0;
}
.template-name {
  padding: 0.5rem 0.5rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}
.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-light);
}
.color-grid { display: flex; flex-direction: column; gap: 1rem; }
.color-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1rem;
  align-items: center;
}
@media (max-width: 600px) {
  .color-row { grid-template-columns: 1fr; }
}
.color-label {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  min-width: 0;
}
.color-input-wrap { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
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
  padding: 0.5rem 0.5rem;
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
.btn-icon-small {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 769px) {
  .btn-icon-small { width: 2rem; height: 2rem; min-width: 2rem; min-height: 2rem; }
}
.btn-icon-small:hover { color: var(--accent-primary); background: rgba(139, 69, 19, 0.08); }
.btn-icon-small .pi { font-size: 0.875rem; }
.actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-light);
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
.actions-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
}
.btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: inherit; border: 2px solid transparent; }
.btn-primary { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-outline { background: transparent; border-color: var(--border-medium); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline:disabled:hover { border-color: var(--border-medium); color: var(--text-secondary); }

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
.color-editor-modal .modal-heading { color: #1a1a1a; }
.color-editor-modal .modal-hint { color: #555; }
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
.color-editor-hex {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-family: ui-monospace, monospace;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}
.color-editor-hex:focus { outline: none; border-color: var(--accent-primary); }
.color-editor-sliders { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
.color-editor-slider-row {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
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
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  border-radius: 999px;
  height: 0.5rem;
  align-self: center;
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
  padding: 1rem;
}
.save-theme-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  padding: 1.5rem;
  max-width: 360px;
  width: 100%;
}
.modal-heading { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
.modal-hint { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 1rem; }
.save-theme-preview {
  height: 4rem;
  width: 100%;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  border: 2px solid var(--border-light);
}
.save-theme-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-family: inherit;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-bottom: 1rem;
}
.save-theme-input:focus { outline: none; border-color: var(--accent-primary); }
.save-theme-input::placeholder { color: var(--text-tertiary); }
.save-theme-error { font-size: 0.875rem; color: var(--accent-burgundy, #c53030); margin: 0.5rem 0 0; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
</style>
