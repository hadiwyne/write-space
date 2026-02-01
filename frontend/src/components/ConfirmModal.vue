<template>
  <Teleport to="body">
    <div v-if="open" class="confirm-modal-backdrop" @click.self="onCancel">
      <div class="confirm-modal">
        <div class="confirm-modal-header">
          <h2 class="confirm-modal-title">{{ title }}</h2>
          <button type="button" class="confirm-modal-close" aria-label="Close" @click="onCancel">×</button>
        </div>
        <div class="confirm-modal-body">
          <p class="confirm-modal-message">{{ message }}</p>
        </div>
        <div class="confirm-modal-footer">
          <button type="button" class="confirm-modal-btn confirm-modal-cancel" @click="onCancel">
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="confirm-modal-btn confirm-modal-confirm"
            :class="{ 'confirm-modal-confirm-danger': variant === 'danger' }"
            @click="onConfirm"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}>()

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(44, 24, 16, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.confirm-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border-light);
  max-width: 400px;
  width: 100%;
}
.confirm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid var(--border-light);
}
.confirm-modal-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
.confirm-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s ease;
}
.confirm-modal-close:hover { color: var(--text-primary); }
.confirm-modal-body { padding: 1rem 1.25rem; }
.confirm-modal-message { margin: 0; color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6; }
.confirm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 2px solid var(--border-light);
}
.confirm-modal-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 2px solid var(--border-medium);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-family: inherit;
  transition: all 0.2s ease;
}
.confirm-modal-btn:hover { background: var(--bg-primary); color: var(--text-primary); }
.confirm-modal-confirm {
  border-color: var(--accent-primary);
  background: var(--accent-primary);
  color: #fff;
}
.confirm-modal-confirm:hover { background: var(--accent-burgundy); border-color: var(--accent-burgundy); }
.confirm-modal-confirm-danger {
  border-color: var(--like-color);
  background: var(--like-color);
  color: #fff;
}
.confirm-modal-confirm-danger:hover { filter: brightness(1.1); }
</style>
