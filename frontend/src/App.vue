<template>
  <div class="app">
    <AppHeader v-if="!hideLayout" />
    <main class="main" :class="{ 'main--full': hideLayout, 'main--with-header': !hideLayout }">
      <RouterView />
    </main>
    <FloatingActionButton v-if="!hideLayout && auth.isLoggedIn" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import FloatingActionButton from '@/components/FloatingActionButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const hideLayout = computed(() => route.meta.hideLayout === true)

onMounted(() => {
  if (theme.bgImageUrl) theme.setBgImage(theme.bgImageUrl)
})
</script>

<style>
@import '@/assets/design-tokens.css';

* { box-sizing: border-box; }
html { overflow-x: hidden; scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: 'Manrope', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-primary);
  background-image: var(--bg-image, none);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: var(--text-primary);
  line-height: 1.6;
  letter-spacing: -0.02em;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
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
.main {
  flex: 1;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 2.5rem) var(--container-padding) var(--container-padding-bottom);
  width: 100%;
  min-width: 0; /* allow shrink for small screens */
}
.main--with-header {
  padding-top: calc(4.5rem + clamp(1.25rem, 4vw, 2.5rem));
}
@media (max-width: 768px) {
  .main--with-header {
    padding-top: calc(7rem + clamp(1rem, 3vw, 1.5rem));
  }
}
@media (max-width: 480px) {
  .main--with-header {
    padding-top: calc(8rem + 1rem);
  }
}
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

/* Avatar shape: only the container has the shape; overflow hidden clips the image. Image keeps full picture, container shapes what’s visible. No background on container so nothing shows around the image. */
.avatar-shape-circle,
.avatar-shape-rounded,
.avatar-shape-square,
.avatar-shape-squircle {
  overflow: hidden;
  background: none;
}
.avatar-shape-circle { border-radius: 50%; }
.avatar-shape-rounded { border-radius: 12%; }
.avatar-shape-square { border-radius: 0; }
.avatar-shape-squircle { border-radius: 25%; }
/* Inner image: no shape, no crop – full image fills container, container clips to shape */
.avatar-shape-circle img,
.avatar-shape-circle .avatar-img,
.avatar-shape-rounded img,
.avatar-shape-rounded .avatar-img,
.avatar-shape-square img,
.avatar-shape-square .avatar-img,
.avatar-shape-squircle img,
.avatar-shape-squircle .avatar-img {
  border-radius: 0 !important;
  clip-path: none !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 100% !important;
  min-height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block !important;
  vertical-align: top !important;
}

/* Avatar frame: gradient/glow/preset border around avatar */
.avatar-frame {
  overflow: hidden;
}
.avatar-frame.avatar-shape-circle { border-radius: 50%; }
.avatar-frame.avatar-shape-rounded { border-radius: 12%; }
.avatar-frame.avatar-shape-square { border-radius: 0; }
.avatar-frame.avatar-shape-squircle { border-radius: 25%; }
.avatar-frame--gradient.avatar-frame--animated {
  background-size: 200% 200% !important;
  animation: avatar-frame-linear var(--frame-speed, 3s) linear infinite;
}
.avatar-frame--gradient.avatar-frame--conic-animated {
  animation: avatar-frame-rotate var(--frame-speed, 3s) linear infinite;
}
@keyframes avatar-frame-linear {
  to { background-position: 200% 200%; }
}
@keyframes avatar-frame-rotate {
  to { transform: rotate(360deg); }
}
.avatar-frame--glow {
  box-shadow: 0 0 var(--frame-glow-blur, 20px) var(--frame-glow-spread, 4px) var(--frame-glow-color, rgba(255,0,204,0.6));
}
.avatar-frame--glow.avatar-frame--pulse {
  animation: avatar-frame-pulse 2s ease-in-out infinite;
}
@keyframes avatar-frame-pulse {
  0%, 100% { box-shadow: 0 0 10px 2px var(--frame-glow-color); }
  50% { box-shadow: 0 0 25px 8px var(--frame-glow-color); }
}
.avatar-frame--preset-gamer {
  padding: 3px;
  background: linear-gradient(90deg, #ff0080, #7928ca, #0070f3, #00dfd8, #ff0080) !important;
  background-size: 300% 100% !important;
  animation: avatar-frame-gamer 2s linear infinite;
}
@keyframes avatar-frame-gamer {
  to { background-position: 300% 0; }
}
.avatar-frame--preset-soft {
  padding: 4px;
  background: linear-gradient(135deg, #ffd6e7, #e7d6ff, #d6e7ff) !important;
  box-shadow: 0 0 20px rgba(255,182,193,0.5);
}
.avatar-frame--preset-premium {
  padding: 4px;
  background: linear-gradient(135deg, #d4af37, #f4e4bc, #d4af37) !important;
  box-shadow: 0 0 15px rgba(212,175,55,0.5);
}
.avatar-frame--preset-fire {
  padding: 4px;
  background: linear-gradient(180deg, #ff6b00, #ff0000, #ff6b00) !important;
  box-shadow: 0 0 20px rgba(255,100,0,0.6);
}

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
