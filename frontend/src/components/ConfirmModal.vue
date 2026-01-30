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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.confirm-modal {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}
.confirm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--gray-200);
}
.confirm-modal-title {
  margin: 0;
  font-size: 1.25rem;
}
.confirm-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--gray-700);
  cursor: pointer;
  padding: 0.25rem;
}
.confirm-modal-close:hover {
  color: var(--gray-900);
}
.confirm-modal-body {
  padding: 1rem 1.25rem;
}
.confirm-modal-message {
  margin: 0;
  color: var(--gray-700);
  font-size: 0.9375rem;
  line-height: 1.5;
}
.confirm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--gray-200);
}
.confirm-modal-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: var(--radius);
  cursor: pointer;
  border: 1px solid var(--gray-300);
  background: #fff;
  color: var(--gray-700);
}
.confirm-modal-btn:hover {
  background: var(--gray-100);
}
.confirm-modal-confirm {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}
.confirm-modal-confirm:hover {
  filter: brightness(1.05);
}
.confirm-modal-confirm-danger {
  border-color: #dc2626;
  background: #dc2626;
  color: #fff;
}
.confirm-modal-confirm-danger:hover {
  filter: brightness(1.1);
}
</style>
