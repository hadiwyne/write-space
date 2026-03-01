<template>
  <Teleport to="body" :disabled="!fullscreen && !fullscreenExiting">
    <div
      class="rich-text-editor"
      :class="{
        'rich-text-editor--fullscreen': fullscreen || fullscreenExiting,
        'rich-text-editor--fullscreen-entering': fullscreen && !fullscreenExiting,
        'rich-text-editor--fullscreen-exiting': fullscreenExiting,
      }"
    >
    <div class="editor-toolbar" role="toolbar">
      <template v-if="editor">
      <!-- Text formatting -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Italic">
        <em>I</em>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()" title="Underline">
        <u>U</u>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Strikethrough">
        <s>S</s>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('highlight') }" @click="editor.chain().focus().toggleHighlight().run()" title="Highlight">
        <span class="toolbar-highlight-icon">H</span>
      </button>
      <span class="toolbar-divider"></span>
      <!-- Font family -->
      <div class="toolbar-dropdown-wrap" ref="fontDropdownRef">
        <button type="button" class="toolbar-dropdown-trigger toolbar-dropdown-trigger--font" title="Font" :aria-expanded="fontDropdownOpen" @click="fontDropdownOpen = !fontDropdownOpen">
          <span class="toolbar-dropdown-label">{{ currentFontFamily || 'Font' }}</span>
          <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="toolbar-dropdown">
          <div v-if="fontDropdownOpen" class="toolbar-dropdown-panel toolbar-dropdown-panel--font" role="menu">
            <button type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: !currentFontFamily }" @click="selectFontFamily(''); fontDropdownOpen = false">Font</button>
            <button v-for="f in CONTENT_FONT_FAMILY_OPTIONS" :key="f" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentFontFamily === f }" :style="fontOptionStyle(f)" @click="selectFontFamily(f); fontDropdownOpen = false">{{ f }}</button>
          </div>
        </Transition>
      </div>
      <!-- Font size -->
      <div class="toolbar-dropdown-wrap" ref="sizeDropdownRef">
        <button type="button" class="toolbar-dropdown-trigger" title="Font size" :aria-expanded="sizeDropdownOpen" @click="sizeDropdownOpen = !sizeDropdownOpen">
          <span class="toolbar-dropdown-label">{{ currentFontSize || 'Size' }}</span>
          <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="toolbar-dropdown">
          <div v-if="sizeDropdownOpen" class="toolbar-dropdown-panel" role="menu">
            <button type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: !currentFontSize }" @click="selectFontSize(''); sizeDropdownOpen = false">Size</button>
            <button v-for="s in fontSizes" :key="s" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentFontSize === s }" @click="selectFontSize(s); sizeDropdownOpen = false">{{ s }}</button>
          </div>
        </Transition>
      </div>
      <!-- Paragraph style -->
      <div class="toolbar-dropdown-wrap" ref="headingDropdownRef">
        <button type="button" class="toolbar-dropdown-trigger" title="Paragraph style" :aria-expanded="headingDropdownOpen" @click="headingDropdownOpen = !headingDropdownOpen">
          <span class="toolbar-dropdown-label">{{ headingLabel }}</span>
          <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="toolbar-dropdown">
          <div v-if="headingDropdownOpen" class="toolbar-dropdown-panel" role="menu">
            <button v-for="opt in headingOptions" :key="opt.value" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentHeading === opt.value }" @click="selectHeading(opt.value); headingDropdownOpen = false">{{ opt.label }}</button>
          </div>
        </Transition>
      </div>
      <span class="toolbar-divider"></span>
      <!-- Alignment -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()" title="Align left">
        ≡
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()" title="Align center">
        ≡
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()" title="Align right">
        ≡
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'justify' }) }" @click="editor.chain().focus().setTextAlign('justify').run()" title="Justify">
        ≡
      </button>
      <span class="toolbar-divider"></span>
      <!-- Lists -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Bullet list">
        •
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Numbered list">
        1.
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Quote">
        “
      </button>
      <span class="toolbar-divider"></span>
      <!-- Link -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('link') }" @click="toggleLink" title="Link" aria-label="Link">
        <i class="pi pi-link" aria-hidden="true"></i>
      </button>
      <!-- Image -->
      <button
        type="button"
        class="toolbar-btn"
        :disabled="!canAddImage"
        :title="canAddImage ? 'Insert Media' : 'Maximum 5 images per post'"
        :aria-label="canAddImage ? 'Insert Media' : 'Maximum 5 images per post'"
        @click="triggerImageUpload"
      >
        <i class="pi pi-images" aria-hidden="true"></i>
      </button>
      <template v-if="imageSelectedByDoubleClick && editor.isActive('image')">
        <span class="toolbar-divider"></span>
        <div class="toolbar-dropdown-wrap" ref="imageSizeDropdownRef">
          <button type="button" class="toolbar-dropdown-trigger" title="Image size" :aria-expanded="imageSizeDropdownOpen" @click="imageSizeDropdownOpen = !imageSizeDropdownOpen">
            <span class="toolbar-dropdown-label">{{ imageSizeLabel }}</span>
            <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="toolbar-dropdown">
            <div v-if="imageSizeDropdownOpen" class="toolbar-dropdown-panel" role="menu">
              <button v-for="opt in imageSizeOptions" :key="opt.value" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentImageWidth === opt.value }" @click="selectImageSize(opt.value); imageSizeDropdownOpen = false">{{ opt.label }}</button>
            </div>
          </Transition>
        </div>
        <button type="button" class="toolbar-btn toolbar-btn--crop" title="Crop image" aria-label="Crop image" @click="openCropModal">
          <svg class="crop-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M5.5 2a1 1 0 00-2 0v2H2a1 1 0 000 2h12v7h2V5a1 1 0 00-1-1H5.5V2zm-2 5v8a1 1 0 001 1H14v2a1 1 0 102 0v-2h2a1 1 0 100-2H5.5V7h-2z"/></svg>
        </button>
      </template>
      <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelect" />
      </template>
      <span v-else class="toolbar-loading">Loading editor…</span>
    </div>
    <ImageCropModal
      :open="cropModalOpen"
      :image-src="cropImageSrc"
      @close="cropModalOpen = false"
      @crop-apply="onCropApply"
    />
    <div class="editor-content">
      <editor-content :editor="editor" />
    </div>
    <button
      type="button"
      class="editor-fullscreen-btn"
      :title="fullscreen ? 'Exit full screen' : 'Full screen'"
      :aria-label="fullscreen ? 'Exit full screen' : 'Full screen'"
      @click="toggleFullscreen"
    >
      <i :class="fullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" aria-hidden="true"></i>
      <span class="editor-fullscreen-btn-label">{{ fullscreen ? 'Exit full screen' : 'Full screen' }}</span>
    </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, provide } from 'vue'
import { useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import ResizableImageNodeView from './ResizableImageNodeView.vue'
import ImageCropModal from './ImageCropModal.vue'

const ImageWithSize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-width') || (el as HTMLElement).style?.maxWidth || null,
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.width) return {}
          const v = typeof attrs.width === 'number' ? `${attrs.width}px` : String(attrs.width)
          return { 'data-width': attrs.width, style: `max-width: ${v}; width: ${v}; height: auto; display: block;` }
        },
      },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageNodeView)
  },
})
import TextStyle from '@tiptap/extension-text-style'

import { CONTENT_FONT_FAMILY_OPTIONS } from '../utils/allowed-content-fonts'
import { ensureFontLoaded } from '../utils/load-fonts'

const props = withDefaults(
  defineProps<{
    modelValue: string
    canAddImage?: boolean
  }>(),
  { canAddImage: true }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'image-upload': [file: File]
  'image-crop-apply': [file: File]
}>()

const imageInputRef = ref<HTMLInputElement | null>(null)

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']
const headingOptions = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: '1', label: 'Heading 1' },
  { value: '2', label: 'Heading 2' },
  { value: '3', label: 'Heading 3' },
] as const
const imageSizeOptions = [
  { value: '100%', label: 'Full width' },
  { value: '75%', label: 'Large' },
  { value: '50%', label: 'Medium' },
  { value: '33%', label: 'Small' },
] as const

const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: (attrs: { fontSize?: string | null }) => {
              if (!attrs.fontSize) return {}
              return { style: `font-size: ${attrs.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    } as Record<string, unknown>
  },
})

const FontFamilyExtension = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (el) => {
              const v = (el as HTMLElement).style.fontFamily
              if (!v) return null
              return v.replace(/^["']|["']$/g, '')
            },
            renderHTML: (attrs: { fontFamily?: string | null }) => {
              if (!attrs.fontFamily) return {}
              const q = attrs.fontFamily.includes(' ') ? `"${attrs.fontFamily}"` : attrs.fontFamily
              return { style: `font-family: ${q}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontFamily: null }).run(),
    } as Record<string, unknown>
  },
})

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    ImageWithSize.configure({
      inline: false,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener' },
    }),
    TextStyle,
    FontSizeExtension,
    FontFamilyExtension,
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor',
      'data-placeholder': 'Write your story…',
    },
  },
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
})

const currentFontSize = ref('')
const currentFontFamily = ref('')
const currentHeading = ref('')
const currentImageWidth = ref('')
const cropModalOpen = ref(false)
const cropImageSrc = ref('')
const imageSelectedByDoubleClick = ref(false)
provide('onImageDoubleClick', () => {
  imageSelectedByDoubleClick.value = true
})

const fontDropdownOpen = ref(false)
const sizeDropdownOpen = ref(false)
const headingDropdownOpen = ref(false)
const imageSizeDropdownOpen = ref(false)
const fontDropdownRef = ref<HTMLElement | null>(null)
const sizeDropdownRef = ref<HTMLElement | null>(null)
const headingDropdownRef = ref<HTMLElement | null>(null)
const imageSizeDropdownRef = ref<HTMLElement | null>(null)

const headingLabel = computed(() => {
  const o = headingOptions.find((x) => x.value === currentHeading.value)
  return o ? o.label : 'Style'
})
const imageSizeLabel = computed(() => {
  const o = imageSizeOptions.find((x) => x.value === currentImageWidth.value)
  return o ? o.label : 'Size'
})

watch(
  () => editor.value,
  (e) => {
    if (!e) return
    const updateAttrs = () => {
      const textStyle = e.getAttributes('textStyle') as { fontSize?: string; fontFamily?: string }
      currentFontSize.value = textStyle?.fontSize || ''
      currentFontFamily.value = textStyle?.fontFamily || ''
      const heading = e.getAttributes('heading') as { level?: number }
      currentHeading.value = heading?.level ? String(heading.level) : 'paragraph'
      currentImageWidth.value = e.isActive('image') ? (e.getAttributes('image').width as string) || '' : ''
      if (!e.isActive('image')) imageSelectedByDoubleClick.value = false
    }
    e.on('selectionUpdate', updateAttrs)
    e.on('transaction', updateAttrs)
    updateAttrs()
  },
  { immediate: true }
)

function fontOptionStyle(fontName: string): { fontFamily: string } {
  const q = fontName.includes(' ') ? `"${fontName}"` : fontName
  return { fontFamily: q }
}

function selectFontFamily(value: string) {
  if (!value.trim()) {
    ;(editor.value?.chain().focus() as unknown as { unsetFontFamily: () => { run: () => void } })?.unsetFontFamily().run()
    return
  }
  ensureFontLoaded(value.trim())
  ;(editor.value?.chain().focus() as unknown as { setFontFamily: (f: string) => { run: () => void } })?.setFontFamily(value.trim()).run()
}

function selectFontSize(value: string) {
  setFontSize(value)
}

function selectHeading(value: string) {
  setHeading(value)
}

function selectImageSize(value: string) {
  if (!value) return
  editor.value?.chain().focus().updateAttributes('image', { width: value }).run()
}

function closeToolbarDropdowns(e: MouseEvent) {
  const target = e.target as Node
  if (fontDropdownRef.value?.contains(target)) return
  if (sizeDropdownRef.value?.contains(target)) return
  if (headingDropdownRef.value?.contains(target)) return
  if (imageSizeDropdownRef.value?.contains(target)) return
  fontDropdownOpen.value = false
  sizeDropdownOpen.value = false
  headingDropdownOpen.value = false
  imageSizeDropdownOpen.value = false
}

function setFontSize(value: string) {
  const c = editor.value?.chain().focus() as unknown as { unsetFontSize: () => { run: () => void }; setFontSize: (v: string) => { run: () => void }; run: () => void }
  if (!value) c?.unsetFontSize().run()
  else c?.setFontSize(value).run()
}

function setHeading(value: string) {
  if (value === 'paragraph') editor.value?.chain().focus().setParagraph().run()
  else if (value === '1' || value === '2' || value === '3') editor.value?.chain().focus().setHeading({ level: Number(value) as 1 | 2 | 3 }).run()
}

function toggleLink() {
  if (editor.value?.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('Enter URL:')
  if (url) editor.value?.chain().focus().setLink({ href: url }).run()
}

function triggerImageUpload() {
  if (!props.canAddImage) return
  imageInputRef.value?.click()
}

async function onImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  emit('image-upload', file)
}


function openCropModal() {
  if (!editor.value?.isActive('image')) return
  const attrs = editor.value.getAttributes('image')
  if (attrs.src) {
    cropImageSrc.value = attrs.src
    cropModalOpen.value = true
  }
}

function onCropApply(blob: Blob) {
  cropModalOpen.value = false
  const file = new File([blob], 'cropped.png', { type: blob.type || 'image/png' })
  emit('image-crop-apply', file)
}

defineExpose({
  addImage: (url: string) => {
    editor.value?.chain().focus().setImage({ src: url }).run()
  },
  replaceSelectedImage: (url: string) => {
    editor.value?.chain().focus().updateAttributes('image', { src: url }).run()
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== undefined && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val, false)
    }
  }
)

const fullscreen = ref(false)
const fullscreenExiting = ref(false)
const FULLSCREEN_EXIT_MS = 280

function lockBodyScroll(lock: boolean) {
  const val = lock ? 'hidden' : ''
  document.documentElement.style.overflow = val
  document.body.style.overflow = val
}
function toggleFullscreen() {
  if (fullscreen.value) {
    fullscreenExiting.value = true
    lockBodyScroll(false)
    setTimeout(() => {
      fullscreen.value = false
      fullscreenExiting.value = false
    }, FULLSCREEN_EXIT_MS)
  } else {
    fullscreen.value = true
    lockBodyScroll(true)
  }
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && fullscreen.value && !fullscreenExiting.value) {
    fullscreenExiting.value = true
    lockBodyScroll(false)
    setTimeout(() => {
      fullscreen.value = false
      fullscreenExiting.value = false
    }, FULLSCREEN_EXIT_MS)
  }
}
onMounted(() => {
  if (props.modelValue && editor.value) {
    editor.value.commands.setContent(props.modelValue, false)
  }
  document.addEventListener('click', closeToolbarDropdowns)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeToolbarDropdowns)
  document.removeEventListener('keydown', onKeydown)
  if (fullscreen.value || fullscreenExiting.value) lockBodyScroll(false)
  fullscreen.value = false
  fullscreenExiting.value = false
  editor.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  position: relative;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  min-height: 360px;
  box-shadow: var(--shadow-sm);
  padding-bottom: 2.5rem;
}
@keyframes editorFullscreenIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes editorFullscreenOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
.rich-text-editor--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  overscroll-behavior: contain;
  border-radius: 0;
  border: none;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
}
.rich-text-editor--fullscreen-entering {
  animation: editorFullscreenIn 0.3s ease-out;
}
.rich-text-editor--fullscreen-exiting {
  animation: editorFullscreenOut 0.28s ease-in forwards;
}
.rich-text-editor--fullscreen .editor-toolbar {
  flex-shrink: 0;
  width: 100%;
  margin: 0;
  align-self: stretch;
  border-radius: 0;
}
.rich-text-editor--fullscreen .editor-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  width: 100%;
  margin: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
}
.rich-text-editor--fullscreen .editor-content :deep(.ProseMirror) {
  flex: 1;
  min-height: 200px;
}
.rich-text-editor--fullscreen .editor-fullscreen-btn {
  right: 2.5rem;
  bottom: 1rem;
}
@media (max-width: 768px) {
  .rich-text-editor--fullscreen .editor-fullscreen-btn {
    right: 1rem;
  }
}
.editor-fullscreen-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.editor-fullscreen-btn:hover {
  background: var(--border-light);
  border-color: var(--text-tertiary);
}
.editor-fullscreen-btn .pi {
  font-size: 1rem;
}
.editor-fullscreen-btn-label {
  white-space: nowrap;
}
@media (max-width: 480px) {
  .editor-fullscreen-btn-label { display: none; }
}
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  min-height: 48px;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.toolbar-loading {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
.toolbar-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.toolbar-btn:hover {
  background: var(--border-light);
}
.toolbar-btn.active {
  background: var(--border-medium);
  color: var(--accent-primary);
}
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toolbar-btn--crop .crop-icon {
  display: block;
  flex-shrink: 0;
}
.toolbar-highlight-icon {
  background: linear-gradient(transparent 60%, var(--accent-tertiary) 60%);
  opacity: 0.9;
}
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-medium);
  margin: 0 2px;
  border-radius: 1px;
}
/* Custom dropdowns – match WriteView format dropdown */
.toolbar-dropdown-wrap {
  position: relative;
}
.toolbar-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  min-width: 4rem;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.toolbar-dropdown-trigger:hover {
  border-color: var(--border-medium);
}
.toolbar-dropdown-trigger:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--border-medium);
}
.toolbar-dropdown-label {
  flex: 1;
  min-width: 0;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
.toolbar-dropdown-trigger--font { min-width: 10rem; }
.toolbar-dropdown-trigger--font .toolbar-dropdown-label { max-width: none; }
.toolbar-dropdown-chevron {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: auto;
}
.toolbar-dropdown-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 100%;
  max-height: 280px;
  overflow-y: auto;
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.toolbar-dropdown-panel::-webkit-scrollbar {
  display: none;
}
.toolbar-dropdown-panel--font { min-width: 12rem; }
.toolbar-dropdown-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.45rem 0.75rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.toolbar-dropdown-option:hover {
  background: var(--bg-primary);
}
.toolbar-dropdown-option.active {
  background: var(--bg-primary);
  color: var(--accent-primary);
  font-weight: 600;
}
.toolbar-dropdown-enter-active,
.toolbar-dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.toolbar-dropdown-enter-from,
.toolbar-dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.editor-content {
  min-height: 320px;
  background: var(--bg-card);
}
.editor-content :deep(.ProseMirror) {
  min-height: 320px;
  padding: 0.75rem 1rem;
  outline: none;
  color: var(--text-primary);
  background: var(--bg-card);
}
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--text-tertiary);
  float: left;
  height: 0;
  pointer-events: none;
}
.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
}
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--border-medium);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--text-secondary);
}
</style>
