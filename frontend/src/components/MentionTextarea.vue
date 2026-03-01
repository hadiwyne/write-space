<template>
  <div class="mention-textarea-wrap">
    <textarea
      ref="textareaRef"
      :value="content"
      class="mention-textarea"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      @input="onInput"
      @keydown="onKeydown"
    />
    <Transition name="dropdown">
      <div
        v-if="mention.mentionOpen && (mention.mentionQuery?.length ?? 0) > 0 && (mention.mentionCandidates.length > 0 || mention.mentionLoading)"
        class="mention-dropdown"
        role="listbox"
      >
        <div v-if="mention.mentionLoading" class="mention-item mention-item--loading">Searching…</div>
        <button
          v-for="(u, i) in mention.mentionCandidates"
          :key="u.id || i"
          type="button"
          class="mention-item"
          :class="{ 'mention-item--selected': i === mention.mentionSelectedIndex }"
          role="option"
          :aria-selected="i === mention.mentionSelectedIndex"
          @click="u.username && mention.selectMention(u.username)"
        >
          <span class="mention-avatar-wrap" :class="avatarShapeClass(u.avatarShape)">
            <img v-if="u.avatarUrl" :src="avatarSrc(u.avatarUrl, u.id)" alt="" class="mention-avatar" />
            <span v-else class="mention-avatar-placeholder">{{ (u.displayName || u.username || '?')[0] }}</span>
          </span>
          <span class="mention-item-text">
            <span class="mention-username">@{{ u.username || '' }}</span>
            <span v-if="u.displayName" class="mention-display-name">{{ u.displayName }}</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useMentionAutocomplete } from '@/composables/useMentionAutocomplete'
import { avatarSrc } from '@/api/client'
import { avatarShapeClass } from '@/utils/avatar'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    rows?: number
    disabled?: boolean
  }>(),
  { placeholder: '', rows: 3, disabled: false }
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const content = ref(props.modelValue)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.modelValue,
  (v) => {
    content.value = v
  }
)

const mention = reactive(useMentionAutocomplete(content, textareaRef))

watch(
  content,
  (v) => {
    emit('update:modelValue', v)
  },
  { flush: 'sync' }
)

function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  content.value = el.value
  if (typeof el.selectionStart === 'number') mention.updateMentionState(el.selectionStart)
}
function onKeydown(e: KeyboardEvent) {
  mention.onKeydown(e)
}
</script>

<style scoped>
.mention-textarea-wrap { position: relative; }
.mention-textarea { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-medium, #d1d5db); border-radius: var(--radius); font-family: inherit; font-size: 0.9375rem; resize: vertical; box-sizing: border-box; }
.mention-dropdown { position: absolute; left: 0; right: 0; top: 100%; margin-top: 0.25rem; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 220px; overflow-y: auto; z-index: 30; }
.mention-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.5rem 0.75rem; text-align: left; border: none; background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-primary); }
.mention-item:hover, .mention-item--selected { background: var(--gray-100, #f3f4f6); }
.mention-item--loading { color: var(--text-tertiary); cursor: default; }
.mention-avatar-wrap { width: 36px; height: 36px; flex-shrink: 0; overflow: hidden; border-radius: 50%; background: var(--border-light, #e5e7eb); }
.mention-avatar-wrap.avatar-shape-rounded { border-radius: 12%; }
.mention-avatar-wrap.avatar-shape-square { border-radius: 0; }
.mention-avatar-wrap.avatar-shape-squircle { border-radius: 25%; }
.mention-avatar, .mention-avatar-placeholder { width: 100%; height: 100%; object-fit: cover; display: block; }
.mention-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; color: var(--text-secondary); }
.mention-item-text { min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.35rem; }
.mention-username { font-weight: 600; margin-right: 0.25rem; }
.mention-display-name { color: var(--text-secondary); font-size: 0.8125rem; }
</style>
