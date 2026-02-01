<template>
  <div class="app">
    <AppHeader v-if="!hideLayout" />
    <main class="main" :class="{ 'main--full': hideLayout }">
      <RouterView />
    </main>
    <FloatingActionButton v-if="!hideLayout && auth.isLoggedIn" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import FloatingActionButton from '@/components/FloatingActionButton.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const hideLayout = computed(() => route.meta.hideLayout === true)
</script>

<style>
@import '@/assets/design-tokens.css';

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Manrope', system-ui, -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  letter-spacing: -0.02em;
}
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(44, 24, 16, 0.015) 2px, rgba(44, 24, 16, 0.015) 4px),
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139, 69, 19, 0.03), transparent),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(193, 154, 107, 0.02), transparent);
}

.app { min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }
.main { flex: 1; max-width: 880px; margin: 0 auto; padding: 2.5rem 2rem 5rem; width: 100%; }
.main--full { max-width: none; }
a { color: var(--accent-primary); text-decoration: none; transition: color 0.2s ease; }
a:hover { text-decoration: underline; color: var(--accent-burgundy); }

/* PrimeVue tooltip – literary styling */
.p-tooltip {
  position: absolute;
  z-index: 9999;
  display: block;
  max-width: 12.5rem;
  padding: 0.25rem 0;
}
.p-tooltip .p-tooltip-text {
  background: var(--text-primary);
  color: var(--bg-card);
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-medium);
}
.p-tooltip .p-tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 5px solid transparent;
}
.p-tooltip.p-tooltip-top .p-tooltip-arrow { bottom: -5px; left: 50%; margin-left: -5px; border-top-color: var(--text-primary); }
.p-tooltip.p-tooltip-bottom .p-tooltip-arrow { top: -5px; left: 50%; margin-left: -5px; border-bottom-color: var(--text-primary); }
.p-tooltip.p-tooltip-left .p-tooltip-arrow { right: -5px; top: 50%; margin-top: -5px; border-left-color: var(--text-primary); }
.p-tooltip.p-tooltip-right .p-tooltip-arrow { left: -5px; top: 50%; margin-top: -5px; border-right-color: var(--text-primary); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
