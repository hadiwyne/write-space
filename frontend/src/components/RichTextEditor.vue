<template>
  <div class="rich-text-editor">
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
      <!-- Font size -->
      <select class="toolbar-select" title="Font size" :value="currentFontSize" @change="onFontSizeChange">
        <option value="">Size</option>
        <option v-for="s in fontSizes" :key="s" :value="s">{{ s }}</option>
      </select>
      <!-- Headings -->
      <select class="toolbar-select" title="Paragraph style" :value="currentHeading" @change="onHeadingChange">
        <option value="">Style</option>
        <option value="paragraph">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>
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
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('link') }" @click="toggleLink" title="Link">
        🔗
      </button>
      <!-- Image -->
      <button
        type="button"
        class="toolbar-btn"
        :disabled="!canAddImage"
        :title="canAddImage ? 'Insert image' : 'Maximum 5 images per post'"
        @click="triggerImageUpload"
      >
        🖼
      </button>
      <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelect" />
      </template>
      <span v-else class="toolbar-loading">Loading editor…</span>
    </div>
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'

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
}>()

const imageInputRef = ref<HTMLInputElement | null>(null)

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

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
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener' },
    }),
    TextStyle,
    FontSizeExtension,
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
const currentHeading = ref('')

watch(
  () => editor.value,
  (e) => {
    if (!e) return
    const updateAttrs = () => {
      const textStyle = e.getAttributes('textStyle') as { fontSize?: string }
      currentFontSize.value = textStyle?.fontSize || ''
      const heading = e.getAttributes('heading') as { level?: number }
      currentHeading.value = heading?.level ? String(heading.level) : 'paragraph'
    }
    e.on('selectionUpdate', updateAttrs)
    e.on('transaction', updateAttrs)
    updateAttrs()
  },
  { immediate: true }
)

function onFontSizeChange(e: Event) {
  const value = (e.target as HTMLSelectElement)?.value ?? ''
  setFontSize(value)
}

function onHeadingChange(e: Event) {
  const value = (e.target as HTMLSelectElement)?.value ?? ''
  setHeading(value)
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

defineExpose({
  addImage: (url: string) => {
    editor.value?.chain().focus().setImage({ src: url }).run()
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

onMounted(() => {
  if (props.modelValue && editor.value) {
    editor.value.commands.setContent(props.modelValue, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  background: #fff;
  min-height: 360px;
}
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  background: #f1f5f9;
  min-height: 48px;
}
.toolbar-loading {
  font-size: 0.875rem;
  color: var(--gray-700);
}
.toolbar-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--gray-900);
}
.toolbar-btn:hover {
  background: var(--gray-200);
}
.toolbar-btn.active {
  background: var(--gray-300);
  color: var(--primary);
}
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toolbar-highlight-icon {
  background: linear-gradient(transparent 60%, #fef08a 60%);
}
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--gray-300);
  margin: 0 4px;
}
.toolbar-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 4px;
  font-size: 0.8125rem;
  background: #fff;
  min-width: 4rem;
}
.hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.editor-content {
  min-height: 320px;
}
.editor-content :deep(.ProseMirror) {
  min-height: 320px;
  padding: 0.75rem 1rem;
  outline: none;
}
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--gray-300);
  float: left;
  height: 0;
  pointer-events: none;
}
.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
}
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--gray-300);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--gray-700);
}
</style>
