<template>
  <router-link
    to="/write"
    class="fab"
    aria-label="Write a new post"
  >
    <i class="pi pi-pencil"></i>
  </router-link>
</template>

<script setup lang="ts">
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: max(1.5rem, env(safe-area-inset-bottom, 0px));
  right: max(1.5rem, env(safe-area-inset-right, 0px));
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: white;
  border-radius: 50%;
  border: 3px solid white;
  outline: 2px solid var(--border-medium);
  box-shadow: 0 8px 24px rgba(139, 69, 19, 0.3);
  z-index: 50;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  animation: fadeIn 1s ease-out 1s both;
}
.fab:hover {
  background: var(--accent-burgundy);
  color: white;
  text-decoration: none;
}
.fab:active {
  transform: scale(0.95);
}
.fab .pi {
  font-size: 1.5rem;
}
@media (max-width: 768px) {
  .fab {
    bottom: max(1rem, env(safe-area-inset-bottom, 0px));
    right: max(1rem, env(safe-area-inset-right, 0px));
    width: 56px;
    height: 56px;
    border-width: 2px;
  }
  .fab .pi {
    font-size: 1.25rem;
  }
}
</style>
