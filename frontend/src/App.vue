<template>
  <div class="app">
    <AppHeader v-if="!hideLayout" />
    <main class="main" :class="{ 'main--full': hideLayout }">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const hideLayout = computed(() => route.meta.hideLayout === true)
</script>

<style>
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-700: #374151;
  --gray-900: #111827;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: var(--gray-50); color: var(--gray-900); }
.app { min-height: 100vh; display: flex; flex-direction: column; }
.main { flex: 1; max-width: 720px; margin: 0 auto; padding: 1.5rem; width: 100%; }
.main--full { max-width: none; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }

/* PrimeVue tooltip – classic tooltip look (dark bubble, white text, arrow) */
.p-tooltip {
  position: absolute;
  z-index: 9999;
  display: block;
  max-width: 12.5rem;
  padding: 0.25rem 0;
}
.p-tooltip .p-tooltip-text {
  background: #1f2937;
  color: #fff;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
.p-tooltip .p-tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 5px solid transparent;
}
.p-tooltip.p-tooltip-top .p-tooltip-arrow { bottom: -5px; left: 50%; margin-left: -5px; border-top-color: #1f2937; }
.p-tooltip.p-tooltip-bottom .p-tooltip-arrow { top: -5px; left: 50%; margin-left: -5px; border-bottom-color: #1f2937; }
.p-tooltip.p-tooltip-left .p-tooltip-arrow { right: -5px; top: 50%; margin-top: -5px; border-left-color: #1f2937; }
.p-tooltip.p-tooltip-right .p-tooltip-arrow { left: -5px; top: 50%; margin-top: -5px; border-right-color: #1f2937; }
</style>
