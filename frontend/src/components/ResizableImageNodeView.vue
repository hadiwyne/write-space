<template>
  <NodeViewWrapper class="resizable-image-node" :class="{ 'resizable-image-node--resizing': resizing }">
    <div
      ref="wrapRef"
      class="resizable-image-wrap"
      :style="wrapStyle"
      @dblclick="toggleResize"
      @touchstart.passive="onTouchStart"
    >
      <div
        class="drag-handle"
        title="Drag to move image"
        @pointerdown="onDragHandlePointerDown"
      >
        <span class="drag-handle-grip" aria-hidden="true">⋮⋮</span>
      </div>
      <img
        :src="node.attrs.src"
        :alt="node.attrs.alt ?? ''"
        class="resizable-image-img"
        draggable="false"
        @mousedown="onImageMouseDown"
        @dragstart.prevent
      />
      <div
        v-show="resizing"
        class="resize-handle"
        @mousedown="onResizeStart"
        @touchstart.passive="onResizeHandleTouchStart"
      />
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeSelection } from 'prosemirror-state'

const props = defineProps<{
  node: ProseMirrorNode
  updateAttributes: (attrs: Record<string, unknown>) => void
  getPos?: () => number | undefined
  editor?: { view: { state: { doc: { resolve: (p: number) => { nodeBefore: ProseMirrorNode | null }; nodeAt: (p: number) => ProseMirrorNode | null }; tr: { delete: (a: number, b: number) => unknown; insert: (p: number, n: ProseMirrorNode) => unknown } }; dispatch: (tr: unknown) => void } }
}>()

const onImageDoubleClick = inject<() => void>('onImageDoubleClick')
const resizing = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

const wrapStyle = computed(() => {
  const w = props.node.attrs.width
  if (!w) return undefined
  const v = typeof w === 'number' ? `${w}px` : String(w)
  return { maxWidth: v, width: v }
})

function selectImageNode() {
  const pos = props.getPos?.()
  const view = props.editor?.view
  if (typeof pos === 'number' && view) {
    const { state } = view
    const doc = state.doc as Parameters<typeof NodeSelection.create>[0]
    const tr = (state.tr as unknown as { setSelection: (s: unknown) => unknown }).setSelection(NodeSelection.create(doc, pos))
    view.dispatch(tr as unknown as Parameters<typeof view.dispatch>[0])
  }
  onImageDoubleClick?.()
}

function toggleResize() {
  selectImageNode()
  resizing.value = !resizing.value
}

function onImageMouseDown(e: MouseEvent) {
  if (resizing.value) e.preventDefault()
}

/** Find position of the first image node with this src (survives node view recreation). */
function findImagePos(
  doc: { descendants: (f: (node: ProseMirrorNode, pos: number) => void) => void },
  src: string
): number | null {
  let found: number | null = null
  doc.descendants((node, pos) => {
    if (found !== null) return
    if (node.type.name === 'image' && node.attrs.src === src) found = pos
  })
  return found
}

function moveImageUp(editor: NonNullable<typeof props.editor>, imageSrc: string) {
  if (!editor?.view) return
  const { state } = editor.view
  const { doc, tr } = state
  const pos = findImagePos(doc, imageSrc)
  if (pos === null || pos <= 0) return
  const node = doc.nodeAt(pos)
  if (!node) return
  const $pos = doc.resolve(pos)
  const before = $pos.nodeBefore
  if (!before) return
  const beforeStart = pos - before.nodeSize
  const newTr = tr.delete(pos, pos + node.nodeSize).insert(beforeStart, node)
  editor.view.dispatch(newTr)
}

function moveImageDown(editor: NonNullable<typeof props.editor>, imageSrc: string) {
  if (!editor?.view) return
  const { state } = editor.view
  const { doc, tr } = state
  const pos = findImagePos(doc, imageSrc)
  if (pos === null) return
  const node = doc.nodeAt(pos)
  if (!node) return
  const afterPos = pos + node.nodeSize
  const $after = doc.resolve(afterPos)
  const after = $after.nodeAfter
  if (!after) return
  const insertPos = pos + after.nodeSize
  const newTr = tr.delete(pos, pos + node.nodeSize).insert(insertPos, node)
  editor.view.dispatch(newTr)
}

let dragStartY = 0
const DRAG_THRESHOLD = 40

function onDragHandlePointerDown(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  const editor = props.editor
  const imageSrc = props.node.attrs.src
  if (!editor || typeof imageSrc !== 'string') return
  dragStartY = e.clientY
  const overlay = document.createElement('div')
  overlay.className = 'resizable-image-drag-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:grabbing;pointer-events:auto;'
  document.body.appendChild(overlay)
  overlay.setPointerCapture(e.pointerId)
  const onMove = (ev: PointerEvent) => {
    const dy = ev.clientY - dragStartY
    if (Math.abs(dy) < DRAG_THRESHOLD) return
    if (dy < 0) moveImageUp(editor, imageSrc)
    else moveImageDown(editor, imageSrc)
    dragStartY = ev.clientY
  }
  const onUp = () => {
    overlay.removeEventListener('pointermove', onMove)
    overlay.removeEventListener('pointerup', onUp)
    overlay.removeEventListener('pointercancel', onUp)
    overlay.remove()
  }
  overlay.addEventListener('pointermove', onMove)
  overlay.addEventListener('pointerup', onUp)
  overlay.addEventListener('pointercancel', onUp)
}

let resizeStartX = 0
let resizeStartWidth = 0
let startWrapWidth = 0

function parseWidth(val: unknown): number {
  if (val == null) return 0
  if (typeof val === 'number') return val
  const s = String(val)
  const num = parseFloat(s)
  if (s.endsWith('%')) return num
  return num
}

function onResizeStart(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  resizeStartX = e.clientX
  startWrapWidth = wrapRef.value?.offsetWidth ?? parseWidth(props.node.attrs.width) ?? 400
  resizeStartWidth = startWrapWidth
  const container = (e.target as HTMLElement).closest('.ProseMirror')
  const maxW = container?.clientWidth ?? 600
  const onMove = (ev: MouseEvent) => {
    const delta = ev.clientX - resizeStartX
    const newW = Math.min(maxW, Math.max(80, resizeStartWidth + delta))
    props.updateAttributes({ width: `${newW}px` })
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    resizing.value = false
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

let lastTap = 0
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const now = Date.now()
  if (now - lastTap < 400) {
    lastTap = 0
    resizing.value = !resizing.value
  } else {
    lastTap = now
  }
}

function onResizeHandleTouchStart(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length !== 1) return
  resizing.value = true
  const touch = e.touches[0]
  resizeStartX = touch.clientX
  startWrapWidth = parseWidth(props.node.attrs.width) || 400
  resizeStartWidth = startWrapWidth
  const onMove = (ev: TouchEvent) => {
    if (ev.touches.length !== 1) return
    const delta = ev.touches[0].clientX - resizeStartX
    const container = (e.target as HTMLElement).closest('.ProseMirror')
    const maxW = container?.clientWidth ?? 600
    const newW = Math.min(maxW, Math.max(80, resizeStartWidth + delta))
    props.updateAttributes({ width: `${newW}px` })
  }
  const onEnd = () => {
    document.removeEventListener('touchmove', onMove, { passive: false })
    document.removeEventListener('touchend', onEnd)
    resizing.value = false
  }
  document.addEventListener('touchmove', onMove, { passive: false } as AddEventListenerOptions)
  document.addEventListener('touchend', onEnd)
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    if (resizing.value && !(e.target as HTMLElement).closest('.resizable-image-node')) {
      resizing.value = false
    }
  })
})
</script>

<style scoped>
.resizable-image-node {
  display: block;
  margin: 0.5rem 0;
}
.resizable-image-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
  cursor: default;
}
.drag-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: grab;
  border-radius: 0 0 4px 0;
  z-index: 2;
}
.drag-handle:active {
  cursor: grabbing;
}
.drag-handle-grip {
  font-size: 0.875rem;
  letter-spacing: -0.15em;
  line-height: 1;
  user-select: none;
}
.resizable-image-wrap:focus-within,
.resizable-image-node--resizing .resizable-image-wrap {
  outline: 2px solid var(--accent-primary, #6366f1);
  outline-offset: 2px;
  border-radius: 4px;
}
.resizable-image-img {
  display: block;
  max-width: 100%;
  height: auto;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 24px;
  height: 24px;
  background: var(--accent-primary, #6366f1);
  cursor: nwse-resize;
  border-radius: 4px 0 0 0;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}
.resize-handle::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 10px;
  height: 10px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
}
</style>
