<template>
  <div class="poll-block">
    <div class="poll-options">
      <!-- Vote buttons: show when user has not voted so they can always vote -->
      <template v-if="!userVotedOptionId">
        <div
          v-for="opt in poll.options"
          :key="'vote-' + opt.id"
          role="button"
          tabindex="0"
          class="poll-option poll-option--btn"
          :class="{ 'poll-option--loading': voteLoading }"
          :aria-disabled="voteLoading"
          @click.stop="handleVoteClick(opt.id)"
          @keydown.enter.prevent="handleVoteClick(opt.id)"
          @keydown.space.prevent="handleVoteClick(opt.id)"
        >
          {{ opt.text }}
        </div>
      </template>
    </div>
    <!-- Results: show when "Results are always visible" OR after user has voted -->
    <template v-if="showResults">
      <div class="poll-results">
        <div
          v-for="opt in poll.options"
          :key="opt.id"
          class="poll-option poll-option--result"
          :class="{ 'poll-option--voted': userVotedOptionId === opt.id }"
        >
          <div class="poll-option-bar-wrap">
            <div
              class="poll-option-bar"
              :style="{ width: optionPercent(opt) + '%' }"
            ></div>
            <span class="poll-option-label">{{ opt.text }}</span>
            <span class="poll-option-percent">{{ optionPercent(opt) }}%</span>
          </div>
          <span class="poll-option-count">{{ voteCount(opt) }} {{ voteCount(opt) === 1 ? 'vote' : 'votes' }}</span>
        </div>
      </div>
      <p class="poll-total">{{ totalVotes }} {{ totalVotes === 1 ? 'vote' : 'votes' }} total</p>
    </template>
    <div v-if="canAddOption && !compact" class="poll-add-option">
      <input
        v-model="newOptionText"
        type="text"
        class="poll-add-input"
        placeholder="Add an option…"
        maxlength="500"
        @keyup.enter="addOption"
      />
      <button type="button" class="btn btn-sm btn-outline poll-add-btn" :disabled="!newOptionText.trim() || addOptionLoading" @click="addOption">
        Add
      </button>
    </div>
    <p v-else-if="poll.isOpen && compact" class="poll-open-hint">Open poll – others can add options</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    post: {
      id: string
      poll?: {
        id: string
        isOpen: boolean
        resultsVisible: boolean
        options: Array<{ id: string; text: string; order?: number; _count?: { votes: number } }>
        votes?: Array<{ pollOptionId: string }>
      }
    }
    compact?: boolean
  }>(),
  { compact: false }
)

const emit = defineEmits<{ (e: 'update', post: Record<string, unknown>): void }>()
const auth = useAuthStore()
const voteLoading = ref(false)
const addOptionLoading = ref(false)
const newOptionText = ref('')

const poll = computed(() => props.post.poll!)
const totalVotes = computed(() => {
  const opts = poll.value?.options ?? []
  return opts.reduce((sum, o) => sum + (o._count?.votes ?? 0), 0)
})
const userVotedOptionId = computed(() => {
  const votes = poll.value?.votes
  if (!votes?.length) return null
  return votes[0].pollOptionId
})
const showResults = computed(() => {
  const p = poll.value
  if (!p) return false
  return p.resultsVisible || !!userVotedOptionId.value
})
const canAddOption = computed(() => {
  const p = poll.value
  if (!p?.isOpen) return false
  return !!auth.token
})

function voteCount(opt: { _count?: { votes: number } }) {
  return opt._count?.votes ?? 0
}

function optionPercent(opt: { _count?: { votes: number } }) {
  const total = totalVotes.value
  if (total === 0) return 0
  return Math.round((voteCount(opt) / total) * 100)
}

async function vote(optionId: string) {
  if (!auth.token || voteLoading.value) return
  voteLoading.value = true
  try {
    const { data } = await api.post(`/posts/${props.post.id}/poll/vote`, { optionId })
    emit('update', data)
  } finally {
    voteLoading.value = false
  }
}

function handleVoteClick(optionId: string) {
  if (voteLoading.value) return
  vote(optionId)
}

async function addOption() {
  const text = newOptionText.value.trim()
  if (!text || addOptionLoading.value || !auth.token) return
  addOptionLoading.value = true
  try {
    const { data } = await api.post(`/posts/${props.post.id}/poll/options`, { text })
    newOptionText.value = ''
    emit('update', data)
  } finally {
    addOptionLoading.value = false
  }
}
</script>

<style scoped>
.poll-block {
  position: relative;
  z-index: 2;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-card, #f9fafb);
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  touch-action: manipulation;
  pointer-events: auto;
}
.poll-options { display: flex; flex-direction: column; gap: 0.5rem; }
.poll-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.poll-option--btn {
  display: block;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer !important;
  pointer-events: auto !important;
  transition: background 0.15s, border-color 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.poll-option--btn:hover:not(.poll-option--loading) {
  background: var(--gray-50, #f3f4f6);
  border-color: var(--accent-primary, #8b4513);
}
.poll-option--btn:focus {
  outline: 2px solid var(--accent-primary, #8b4513);
  outline-offset: 2px;
}
.poll-option--btn.poll-option--loading {
  opacity: 0.8;
  cursor: wait;
  pointer-events: none;
}

.poll-option--result { display: flex; flex-direction: column; gap: 0.25rem; }
.poll-option-bar-wrap {
  position: relative;
  height: 2rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--gray-100, #f3f4f6);
}
.poll-option-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--accent-primary, #8b4513);
  opacity: 0.75;
  transition: width 0.3s ease;
}
.poll-option--voted .poll-option-bar { opacity: 1; }
.poll-option-label {
  position: absolute;
  left: 0.5rem;
  right: 3.25rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1;
}
.poll-option-percent {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  z-index: 1;
  min-width: 2.5rem;
  text-align: right;
}
.poll-option-count {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
.poll-total { margin: 0.5rem 0 0; font-size: 0.8125rem; color: var(--text-tertiary); }
.poll-add-option { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.poll-add-input {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.6rem;
  font-size: 0.875rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
}
.poll-add-btn { flex-shrink: 0; }
.poll-open-hint { margin: 0.5rem 0 0; font-size: 0.75rem; color: var(--text-tertiary); }

@media (max-width: 640px) {
  .poll-block { padding: 0.5rem; }
  .poll-option--btn { padding: 0.5rem 0.6rem; font-size: 0.875rem; }
  .poll-add-option { flex-direction: column; }
  .poll-add-input { width: 100%; }
}
</style>
