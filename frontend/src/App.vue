<template>
  <div class="app" :class="{ 'status-bar-hidden': statusBarState.hidden }">
    <template v-if="theme.isDarkVoid && !hideLayout">
      <DarkVoidLayout />
      <FloatingActionButton v-if="showFab" class="fab--dark-void" />
    </template>
    <main v-else-if="theme.isDarkVoid && hideLayout" class="main main--full dark-void-standalone">
      <RouterView />
    </main>
    <template v-else>
      <AppHeader v-if="!hideLayout" />
      <main class="main" :class="{ 'main--full': hideLayout, 'main--with-header': !hideLayout }">
        <RouterView />
      </main>
      <FloatingActionButton v-if="!hideLayout && showFab" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import FloatingActionButton from '@/components/FloatingActionButton.vue'
import DarkVoidLayout from '@/components/DarkVoidLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import knightCursorUrl from '@/assets/knight.png'

const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const hideLayout = computed(() => route.meta.hideLayout === true)

const statusBarState = reactive({ hidden: false })
provide('statusBarState', statusBarState)

const showFab = computed(() => {
  if (!auth.isLoggedIn) return false
  const p = route.path
  if (p === '/write' || p === '/settings' || p === '/customization') return false
  if (/^\/posts\/[^/]+\/edit$/.test(p)) return false
  const profileMatch = p.match(/^\/u\/([^/]+)/)
  if (profileMatch && profileMatch[1] === auth.user?.username) return false
  return true
})

let cursorStyleEl: HTMLStyleElement | null = null
function applyDarkVoidCursor(active: boolean) {
  if (active) {
    if (!cursorStyleEl) {
      cursorStyleEl = document.createElement('style')
      cursorStyleEl.setAttribute('data-dark-void-cursor', '')
      cursorStyleEl.textContent = `html.ui-theme-dark-void, html.ui-theme-dark-void * { cursor: url("${knightCursorUrl}") 0 0, auto !important; }`
      document.head.appendChild(cursorStyleEl)
    }
  } else {
    if (cursorStyleEl?.parentNode) cursorStyleEl.remove()
    cursorStyleEl = null
  }
}

let stardustBgUrl = ''
async function loadStardustBg() {
  try {
    const m = await import('@/assets/stardust.png')
    stardustBgUrl = typeof m.default === 'string' ? m.default : ''
  } catch {
    stardustBgUrl = 'https://www.transparenttextures.com/patterns/stardust.png'
  }
  applyDarkVoidBg()
}

function applyDarkVoidBg() {
  const root = document.documentElement
  if (theme.isDarkVoid && stardustBgUrl) {
    root.style.setProperty('--dark-void-bg-image', `url("${stardustBgUrl.replace(/"/g, '%22')}")`)
  } else {
    root.style.removeProperty('--dark-void-bg-image')
  }
}

onMounted(() => {
  if (theme.bgImageUrl) theme.setBgImage(theme.bgImageUrl)
  applyDarkVoidCursor(theme.isDarkVoid)
  loadStardustBg()
})
watch(() => theme.isDarkVoid, () => {
  applyDarkVoidCursor(theme.isDarkVoid)
  applyDarkVoidBg()
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

/* Avatar frame: gradient/glow/preset border around avatar. Use !important so shape wins over component scoped styles. */
.avatar-frame {
  overflow: hidden;
}
.avatar-frame.avatar-shape-circle { border-radius: 50% !important; }
.avatar-frame.avatar-shape-rounded { border-radius: 12% !important; }
.avatar-frame.avatar-shape-square { border-radius: 0 !important; }
.avatar-frame.avatar-shape-squircle { border-radius: 25% !important; }
/* Badge inherits avatar shape so it fits the corner; badge image keeps contain */
.avatar-frame-badge.avatar-shape-circle img,
.avatar-frame-badge.avatar-shape-rounded img,
.avatar-frame-badge.avatar-shape-square img,
.avatar-frame-badge.avatar-shape-squircle img {
  object-fit: contain !important;
}
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

.avatar-frame--none { background: transparent !important; }

/* Extra frame animations */
.avatar-frame--anim-shimmer {
  position: relative;
  overflow: hidden;
}
.avatar-frame--anim-shimmer > * {
  position: relative;
  z-index: 0;
}
.avatar-frame--anim-shimmer::after {
  content: '';
  position: absolute;
  inset: -50%;
  z-index: 1;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%);
  animation: avatar-frame-shimmer 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes avatar-frame-shimmer {
  0% { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(100%) rotate(25deg); }
}

.avatar-frame--anim-dashed {
  border: 2px dashed var(--frame-dash-color, rgba(255,255,255,0.7));
  animation: avatar-frame-rotate 8s linear infinite;
}

.avatar-frame--anim-spin {
  animation: avatar-frame-spin 6s linear infinite;
}
.avatar-frame--anim-spin.avatar-frame--conic-animated,
.avatar-frame--anim-spin.avatar-frame--animated { animation: avatar-frame-spin 6s linear infinite; }
@keyframes avatar-frame-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

/* Dark Void UI theme – background image set via --dark-void-bg-image in script (local stardust.png or fallback) */
html.ui-theme-dark-void body {
  font-family: 'Space Grotesk', sans-serif;
  background-color: #0d0d0f;
  background-image: var(--dark-void-bg-image, url('https://www.transparenttextures.com/patterns/stardust.png'));
  background-size: 30px 30px;
  background-repeat: repeat;
  background-attachment: scroll;
  color: #e8e8ec;
}
html.ui-theme-dark-void {
  --dark-void-bg: #0d0d0f;
  --dark-void-card: #141418;
  --dark-void-text: #e8e8ec;
  --dark-void-text-muted: #888894;
  --dark-void-border: #2a2a30;
  --bg-primary: #0d0d0f;
  --bg-secondary: #141418;
  --bg-card: #1a1a1f;
  --text-primary: #e8e8ec;
  --text-secondary: #a0a0a8;
  --text-tertiary: #888894;
  --border-light: #2a2a30;
  --border-medium: #3a3a42;
  --nav-bg: #0d0d0f;
  --accent-primary: #a0a0c0;
  --accent-burgundy: #c090a0;
}
.main.dark-void-standalone {
  padding: 2rem;
  max-width: none;
}

/* Dark Void: landing (home) page – same aesthetic as rest of theme */
html.ui-theme-dark-void .dark-void-standalone .home .hero h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-standalone .home .hero p {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-standalone .home .btn {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-standalone .home .btn-primary {
  background: var(--dark-void-text);
  color: var(--dark-void-bg);
  border: 2px solid var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-standalone .home .btn-primary:hover {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
  text-decoration: none;
}
html.ui-theme-dark-void .dark-void-standalone .home .btn-outline {
  background: transparent;
  border: 2px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-standalone .home .btn-outline:hover {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
  text-decoration: none;
}

/* Dark Void: login / sign up pages – same card and form aesthetic */
html.ui-theme-dark-void .dark-void-standalone .auth-page .auth-card {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .auth-card h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .form-group label {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .form-group input {
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .form-group input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .form-group input:focus {
  border-color: var(--dark-void-text-muted);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .btn-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border: 2px solid var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .footer {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .footer a {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-standalone .auth-page .footer a:hover {
  color: var(--dark-void-text-muted);
}

/* Dark Void: PostCard – sharp corners, serif italic title, dark card, light grey actions */
html.ui-theme-dark-void .card {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0;
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .card-header {
  border-color: var(--dark-void-border);
}
html.ui-theme-dark-void .card-body:hover .card-title,
html.ui-theme-dark-void .card-body:hover .card-excerpt {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .card-title {
  font-family: Georgia, 'Libre Baskerville', serif;
  font-style: italic;
  font-weight: 600;
  color: var(--dark-void-text);
  font-size: 1.5rem;
  line-height: 1.35;
}
html.ui-theme-dark-void .card-excerpt {
  color: var(--dark-void-text-muted);
  font-size: 0.9375rem;
  line-height: 1.5;
}
html.ui-theme-dark-void .author-name {
  color: var(--dark-void-text);
  font-weight: 600;
}
html.ui-theme-dark-void .author-meta,
html.ui-theme-dark-void .meta-date,
html.ui-theme-dark-void .meta-read {
  color: var(--dark-void-text-muted);
  font-size: 0.8125rem;
}
html.ui-theme-dark-void .card-footer {
  border-color: var(--dark-void-border);
}
html.ui-theme-dark-void .action-stat,
html.ui-theme-dark-void .action-btn {
  background: transparent;
  border: none;
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .action-stat:hover,
html.ui-theme-dark-void .action-btn:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .action-like-btn.liked {
  color: var(--accent-burgundy);
}
html.ui-theme-dark-void .tag {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .tag:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--dark-void-text);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .card-thumb,
html.ui-theme-dark-void .card-link-preview {
  border-color: var(--dark-void-border);
  background: var(--dark-void-bg);
  border-radius: 0;
}
html.ui-theme-dark-void .card-link-preview-body .card-link-preview-title {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .card-link-preview-body .card-link-preview-desc,
html.ui-theme-dark-void .card-link-preview-body .card-link-preview-site {
  color: var(--dark-void-text-muted);
}

/* Dark Void: feed – only post list centered; filter bar full width with theme typography */
html.ui-theme-dark-void .dark-void-main .feed .feed-content {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .feed .feed-hero h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
/* Dark Void: filter bar – slightly wider than post card, sharp corners everywhere */
html.ui-theme-dark-void .dark-void-main .feed .feed-filters {
  font-family: 'Space Grotesk', sans-serif;
  max-width: 672px;
  width: 100%;
  margin: 0 auto 0.75rem;
  padding: 0.25rem;
  border-radius: 0 !important;
  border: 1px solid var(--dark-void-border);
  background: var(--dark-void-card);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tabs {
  background: transparent;
  border: none;
  padding: 0.2rem;
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tab {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--dark-void-text-muted);
  padding: 0.4rem 0.875rem;
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tab:hover:not(.active) {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tab.active {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tab .pi {
  font-size: 0.875rem;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tabs-indicator {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: none;
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tag-and-view {
  border-radius: 0;
  justify-content: center;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tag .tag-input {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8125rem;
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  padding: 0.4rem 0.6rem;
  min-width: 8rem;
  max-width: 14rem;
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .feed .filter-tag .tag-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .feed .tag-btn {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 0.4rem 0.75rem;
  background: var(--dark-void-text);
  border: 1px solid var(--dark-void-text);
  color: var(--dark-void-bg);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .feed .tag-btn:hover {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .feed .view-btn {
  font-family: 'Space Grotesk', sans-serif;
  border: 1px solid var(--dark-void-border);
  background: var(--dark-void-card);
  color: var(--dark-void-text-muted);
  width: 36px;
  height: 36px;
  border-radius: 0 !important;
  font-size: 1rem;
}
html.ui-theme-dark-void .dark-void-main .feed .view-btn:hover:not(.active) {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .feed .view-btn.active {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}

/* Dark Void: poll block (feed, profile, post view) */
html.ui-theme-dark-void .dark-void-main .poll-block {
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option--bar.poll-option--clickable:hover .poll-option-bar-wrap {
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option-bar-wrap {
  background: var(--dark-void-card);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option-bar {
  background: rgba(255, 255, 255, 0.2);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option--voted .poll-option-bar {
  background: var(--dark-void-text);
}
/* Label on unvoted bar: light text; on voted (light) bar: dark text for contrast */
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option-label {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option--voted .poll-option-label,
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option--voted .poll-option-percent,
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option--voted .poll-option-voted-icon {
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option-percent {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option-voted-icon {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-option-count,
html.ui-theme-dark-void .dark-void-main .poll-block .poll-total,
html.ui-theme-dark-void .dark-void-main .poll-block .poll-open-hint {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-add-input {
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-add-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-add-input:focus {
  outline: none;
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-add-btn {
  background: transparent;
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .poll-block .poll-add-btn:hover:not(:disabled) {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 1024px) {
  html.ui-theme-dark-void .dark-void-main .feed .feed-filters {
    justify-content: center;
  }
}
@media (max-width: 768px) {
  html.ui-theme-dark-void .dark-void-main .feed .filter-tag-and-view {
    align-items: center;
  }
  html.ui-theme-dark-void .dark-void-main .feed .filter-tag-and-view .filter-tag {
    width: fit-content;
    max-width: 100%;
    flex: 0 0 auto;
  }
}

/* Dark Void: profile page – same aesthetic as feed (sharp corners, dark cards, Space Grotesk) */
html.ui-theme-dark-void .dark-void-main .profile-page .profile-header,
html.ui-theme-dark-void .dark-void-main .profile-page .posts-section {
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-header {
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  box-shadow: none;
  border-bottom: 1px solid var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-header h1 {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .bio,
html.ui-theme-dark-void .dark-void-main .profile-page .profile-html {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-stats {
  border-top-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .profile-page .stat-item {
  border-radius: 0 !important;
  color: inherit;
}
html.ui-theme-dark-void .dark-void-main .profile-page .stat-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
}
html.ui-theme-dark-void .dark-void-main .profile-page .stat-value {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .stat-item:hover .stat-value {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .stat-label {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .stat-item:hover .stat-label {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .edit-link {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .profile-page .edit-link:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .archived-link:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .btn-follow {
  font-family: 'Space Grotesk', sans-serif;
  border-radius: 0 !important;
  border: 1px solid var(--dark-void-text);
  background: var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .profile-page .btn-follow:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .btn-following {
  background: transparent;
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .btn-following:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-tabs {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  padding: 0.2rem;
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-tab {
  font-family: 'Space Grotesk', sans-serif;
  border-radius: 0 !important;
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-tab:hover:not(.active) {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-tab.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--dark-void-text);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .profile-page .profile-tabs-indicator {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 0 !important;
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .profile-page .empty {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .profile-page .loading,
html.ui-theme-dark-void .dark-void-main .profile-page .error {
  color: var(--dark-void-text-muted);
}
/* Dark Void: modals (profile followers/following + any teleported modal) */
html.ui-theme-dark-void .modal-backdrop {
  background: rgba(0, 0, 0, 0.7);
}
html.ui-theme-dark-void .modal {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
html.ui-theme-dark-void .modal-header {
  border-bottom-color: var(--dark-void-border);
}
html.ui-theme-dark-void .modal-title {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .modal-close {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .modal-close:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .modal-list-item {
  border-bottom-color: var(--dark-void-border);
}
html.ui-theme-dark-void .modal-user:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .modal-user-name {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .modal-user-handle {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .btn-modal {
  border-radius: 0 !important;
  border-color: var(--dark-void-border);
  background: var(--dark-void-card);
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .btn-modal:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .btn-remove:hover:not(:disabled) {
  border-color: var(--accent-burgundy);
  color: var(--accent-burgundy);
}
html.ui-theme-dark-void .btn-unfollow:hover:not(:disabled) {
  border-color: var(--dark-void-text);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .profile-page .avatar-clip,
html.ui-theme-dark-void .dark-void-main .profile-page .avatar-placeholder {
  border-color: var(--dark-void-card);
  outline-color: var(--dark-void-border);
  box-shadow: none;
}

/* Dark Void: post view (single post) – same aesthetic as feed/profile */
html.ui-theme-dark-void .dark-void-main .post-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  padding: 0;
}
html.ui-theme-dark-void .dark-void-main .post-page .loading,
html.ui-theme-dark-void .dark-void-main .post-page .error {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .post {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  box-shadow: none;
  margin-bottom: clamp(1rem, 4vw, 2rem);
  padding: clamp(1rem, 4vw, 2rem);
}
html.ui-theme-dark-void .dark-void-main .post-page .post-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .post-page .post-meta {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .post-meta .author {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .post-meta .author:hover {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .post-content {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .post-tags .tag {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .post-tags .tag:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .post-page .post-actions {
  border-top-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .post-page .action {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .action:hover {
  color: var(--dark-void-text);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .action.active {
  color: var(--dark-void-text);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .action-like.active {
  color: var(--like-color);
  border-color: var(--like-color);
  background: rgba(220, 20, 60, 0.15);
}
html.ui-theme-dark-void .dark-void-main .post-page .action-edit {
  color: var(--dark-void-text-muted);
  border-color: transparent;
  background: transparent;
}
html.ui-theme-dark-void .dark-void-main .post-page .action-edit:hover {
  color: var(--dark-void-text);
  border-color: transparent;
}
html.ui-theme-dark-void .dark-void-main .post-page .action-archive:hover,
html.ui-theme-dark-void .dark-void-main .post-page .action-delete:hover {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .post-page .action-dropdown,
html.ui-theme-dark-void .dark-void-main .post-page .export-dropdown {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
html.ui-theme-dark-void .dark-void-main .post-page .dropdown-option,
html.ui-theme-dark-void .dark-void-main .post-page .export-option {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .dropdown-option:hover:not(:disabled),
html.ui-theme-dark-void .dark-void-main .post-page .export-option:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .post-page .dropdown-loading,
html.ui-theme-dark-void .dark-void-main .post-page .dropdown-empty {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comments h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-form textarea {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-form textarea::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-form textarea:focus {
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-form .btn-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-form .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-list .comment {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-author {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-body {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-time,
html.ui-theme-dark-void .dark-void-main .post-page .comment-meta {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-reply-btn,
html.ui-theme-dark-void .dark-void-main .post-page .comment-delete-btn {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-reply-btn:hover,
html.ui-theme-dark-void .dark-void-main .post-page .comment-delete-btn:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .post-page .reply-textarea {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-edit-wrap {
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-edit-textarea {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-edit-textarea::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .comment-edit-textarea:focus {
  border-color: var(--dark-void-text-muted);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .post-page .btn-reply-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .post-page .btn-reply-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .post-page .btn-reply-ghost {
  border-radius: 0 !important;
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .post-page .btn-reply-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dark-void-text);
}

/* Dark Void: archived posts page */
html.ui-theme-dark-void .dark-void-main .archived-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .archived-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .archived-page .intro {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9375rem;
}
html.ui-theme-dark-void .dark-void-main .archived-page .loading,
html.ui-theme-dark-void .dark-void-main .archived-page .empty {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}

/* Dark Void: bookmarks page */
html.ui-theme-dark-void .dark-void-main .bookmarks-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .bookmarks-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .bookmarks-page .hint,
html.ui-theme-dark-void .dark-void-main .bookmarks-page .loading,
html.ui-theme-dark-void .dark-void-main .bookmarks-page .empty {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}

/* Dark Void: search page */
html.ui-theme-dark-void .dark-void-main .search-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .search-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .search-page .search-input {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .search-page .search-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .search-page .search-input:focus {
  border-color: var(--dark-void-text-muted);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
}
html.ui-theme-dark-void .dark-void-main .search-page .btn-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border: 1px solid var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .search-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .search-page .search-tabs {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  padding: 0.2rem;
}
html.ui-theme-dark-void .dark-void-main .search-page .tab {
  border-radius: 0 !important;
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .search-page .tab:hover:not(.active) {
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .search-page .tab.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--dark-void-text);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .search-page .loading,
html.ui-theme-dark-void .dark-void-main .search-page .empty {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .search-page .user-item {
  border-bottom-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .search-page .user-link:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .search-page .user-name {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .search-page .user-handle {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}

/* Dark Void: notifications page */
html.ui-theme-dark-void .dark-void-main .notifications-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .notifications-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .notifications-page .loading,
html.ui-theme-dark-void .dark-void-main .notifications-page .empty {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .notifications-page .notification-item {
  border-bottom-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .notifications-page .notification-item.unread {
  background: rgba(255, 255, 255, 0.04);
}
html.ui-theme-dark-void .dark-void-main .notifications-page .notification-link {
  color: inherit;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .notifications-page .notification-link:hover {
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .notifications-page .notif-text {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .notifications-page .notif-date {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .notifications-page .mark-all {
  border-radius: 0 !important;
  border: 1px solid var(--dark-void-border);
  background: var(--dark-void-card);
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .notifications-page .mark-all:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dark-void-text);
}

/* Dark Void: collections list page */
html.ui-theme-dark-void .dark-void-main .collections-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .collections-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .collections-page .intro {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9375rem;
}
html.ui-theme-dark-void .dark-void-main .collections-page .loading {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collections-page .empty {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collections-page .btn-primary {
  font-family: 'Space Grotesk', sans-serif;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .collections-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
  color: #1a1a1f;
}
html.ui-theme-dark-void .dark-void-main .collections-page .collection-link {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0;
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collections-page .collection-link:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .collections-page .collection-title {
  color: var(--dark-void-text);
  font-weight: 500;
}
html.ui-theme-dark-void .dark-void-main .collections-page .collection-count {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
/* Collections page "New collection" modal (in-page) */
html.ui-theme-dark-void .dark-void-main .collections-page .modal-backdrop {
  background: rgba(0, 0, 0, 0.6);
}
html.ui-theme-dark-void .dark-void-main .collections-page .modal {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0;
}
html.ui-theme-dark-void .dark-void-main .collections-page .modal h2 {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .collections-page .form-group label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collections-page .form-group input,
html.ui-theme-dark-void .dark-void-main .collections-page .form-group textarea {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collections-page .form-group input::placeholder,
html.ui-theme-dark-void .dark-void-main .collections-page .form-group textarea::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .collections-page .form-group input:focus,
html.ui-theme-dark-void .dark-void-main .collections-page .form-group textarea:focus {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}
html.ui-theme-dark-void .dark-void-main .collections-page .modal-actions .btn-ghost {
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
  border-radius: 0;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collections-page .modal-actions .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dark-void-text);
  border-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .collections-page .modal-actions .btn-primary {
  border-radius: 0;
}

/* Dark Void: settings page */
html.ui-theme-dark-void .dark-void-main .settings-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .settings-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .settings-page .form {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  padding: clamp(1rem, 4vw, 2rem);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .settings-page .form-group label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .input,
html.ui-theme-dark-void .dark-void-main .settings-page .textarea {
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .input::placeholder,
html.ui-theme-dark-void .dark-void-main .settings-page .textarea::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .input:focus,
html.ui-theme-dark-void .dark-void-main .settings-page .textarea:focus {
  outline: none;
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .btn-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .settings-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .btn-outline {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: transparent;
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .btn-outline:hover:not(:disabled) {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .settings-page .btn-ghost {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: transparent;
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .btn-ghost:hover {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .settings-page .badge-upload-hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .error {
  color: #f87171;
}
html.ui-theme-dark-void .dark-void-main .settings-page .success {
  color: #86efac;
}
html.ui-theme-dark-void .dark-void-main .settings-page .avatar-shape-label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .avatar-shape-options,
html.ui-theme-dark-void .dark-void-main .settings-page .frame-type-options {
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .avatar-shape-option span {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-label,
html.ui-theme-dark-void .dark-void-main .settings-page .frame-color-label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-value {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-check {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-select {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-select:focus {
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .color-picker {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .settings-page .color-adjust-btn {
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .settings-page .color-hex {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-slider {
  accent-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .avatar-row {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .settings-page .avatar-shape-option input[type="radio"],
html.ui-theme-dark-void .dark-void-main .settings-page .frame-type-options input[type="radio"] {
  border-radius: 0 !important;
  border-color: var(--dark-void-border);
  background: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .settings-page .avatar-shape-option input[type="radio"]:checked,
html.ui-theme-dark-void .dark-void-main .settings-page .frame-type-options input[type="radio"]:checked {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
  box-shadow: inset 0 0 0 2px var(--dark-void-card);
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-check input[type="checkbox"] {
  border-radius: 0 !important;
  border-color: var(--dark-void-border);
  background: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .settings-page .frame-check input[type="checkbox"]:checked {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 6l3 3 5-6'/%3E%3C/svg%3E");
  background-size: 0.75rem 0.75rem;
  background-position: center;
  background-repeat: no-repeat;
}

/* Dark Void: privacy settings page – dropdowns, save button, follow-request actions */
html.ui-theme-dark-void .dark-void-main .privacy-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .privacy-page .intro {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .privacy-page .label {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .privacy-page .select {
  background: var(--dark-void-bg);
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .privacy-page .select:focus {
  outline: none;
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .privacy-page .hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .privacy-page .btn-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border: 2px solid var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .privacy-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .privacy-page .error {
  color: #f87171;
}
html.ui-theme-dark-void .dark-void-main .privacy-page .success {
  color: #86efac;
}

/* Dark Void: follow requests page */
html.ui-theme-dark-void .dark-void-main .follow-requests-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .intro,
html.ui-theme-dark-void .dark-void-main .follow-requests-page .loading,
html.ui-theme-dark-void .dark-void-main .follow-requests-page .empty {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .follow-request-item {
  border-bottom-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .follow-request-user:hover {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .follow-request-name {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .follow-request-handle {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .btn-primary {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-text);
  border: 2px solid var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .btn-ghost {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  background: transparent;
  border: 1px solid var(--dark-void-border);
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .follow-requests-page .btn-ghost:hover:not(:disabled) {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}

/* Dark Void: customization page – sections as cards, centered, sharp corners */
html.ui-theme-dark-void .dark-void-main .customization-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .customization-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .customization-page .intro {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .theme-section {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}
html.ui-theme-dark-void .dark-void-main .customization-page .section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
  border-bottom-color: var(--dark-void-border);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
html.ui-theme-dark-void .dark-void-main .customization-page .section-hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .ui-theme-options {
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .ui-theme-option span {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .customization-page .subsection-title {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .template-card {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .template-card:hover {
  border-color: var(--dark-void-text-muted);
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .customization-page .template-name {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .customization-page .template-delete {
  background: var(--dark-void-card);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .template-delete:hover {
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.08);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-image-preview {
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
  background: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-arrange-label,
html.ui-theme-dark-void .dark-void-main .customization-page .bg-zoom-label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-position-btn {
  border-color: var(--dark-void-border);
  background: var(--dark-void-bg);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-position-btn:hover {
  border-color: var(--dark-void-text-muted);
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-position-btn.active {
  border-color: var(--dark-void-text-muted);
  background: rgba(255, 255, 255, 0.12);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-position-dot {
  background: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-size-option,
html.ui-theme-dark-void .dark-void-main .customization-page .bg-repeat-options .bg-size-option {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-zoom-slider {
  accent-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-crop-hint,
html.ui-theme-dark-void .dark-void-main .customization-page .bg-crop-active {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-image-url-input {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-image-url-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .customization-page .bg-image-or {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .customization-page .color-label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .color-picker {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .color-adjust-btn {
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .color-hex {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn-icon-small {
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn-icon-small:hover {
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .customization-page .actions {
  border-top-color: var(--dark-void-border);
  margin-top: 1.5rem;
  padding-top: 1.25rem;
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn {
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn-primary {
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn-outline {
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
  background: transparent;
}
html.ui-theme-dark-void .dark-void-main .customization-page .btn-outline:hover:not(:disabled) {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
  background: rgba(255, 255, 255, 0.06);
}

/* Dark Void: teleported modals (color editor, save theme) */
html.ui-theme-dark-void .color-editor-backdrop {
  background: rgba(0, 0, 0, 0.7);
}
html.ui-theme-dark-void .color-editor-modal {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .color-editor-modal .modal-heading {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .color-editor-modal .modal-hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .color-editor-modal .color-editor-preview {
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .color-editor-modal .color-editor-hex {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .color-editor-modal .color-editor-slider-label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .color-editor-modal .color-editor-value {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .color-editor-modal .btn-primary {
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .color-editor-modal .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .color-editor-modal .color-editor-range::-webkit-slider-runnable-track {
  background: var(--dark-void-border);
}
html.ui-theme-dark-void .color-editor-modal .color-editor-range::-webkit-slider-thumb {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-card);
}
html.ui-theme-dark-void .save-theme-modal {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .save-theme-modal .modal-heading {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .save-theme-modal .modal-hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .save-theme-modal .save-theme-preview {
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .save-theme-modal .save-theme-input {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .save-theme-modal .save-theme-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .save-theme-modal .btn-primary {
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .save-theme-modal .btn-outline {
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}

/* Dark Void: write post & edit post – focused writing experience, sharp corners, dark cards */
html.ui-theme-dark-void .dark-void-main .write-page,
html.ui-theme-dark-void .dark-void-main .edit-page {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .write-page h1,
html.ui-theme-dark-void .dark-void-main .edit-page h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .form,
html.ui-theme-dark-void .dark-void-main .edit-page .form {
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
  padding: clamp(1.25rem, 4vw, 2rem);
  box-shadow: none;
}
html.ui-theme-dark-void .dark-void-main .write-page .title-input,
html.ui-theme-dark-void .dark-void-main .edit-page .title-input {
  color: var(--dark-void-text);
  border-bottom-color: var(--dark-void-border);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .title-input::placeholder,
html.ui-theme-dark-void .dark-void-main .edit-page .title-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .title-warning {
  color: #fca5a5;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-trigger,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-trigger {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-trigger:hover,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-trigger:hover {
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-trigger:focus,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-trigger:focus {
  border-color: var(--dark-void-text-muted);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-chevron,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-chevron {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-panel,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-panel {
  background: var(--dark-void-card);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-option,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-option {
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-option:hover,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-option:hover {
  background: rgba(255, 255, 255, 0.06);
}
html.ui-theme-dark-void .dark-void-main .write-page .dropdown-option.active,
html.ui-theme-dark-void .dark-void-main .edit-page .dropdown-option.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--dark-void-text);
  font-weight: 600;
}
html.ui-theme-dark-void .dark-void-main .write-page .btn-outline,
html.ui-theme-dark-void .dark-void-main .edit-page .btn-outline {
  border-color: var(--dark-void-border);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .btn-outline:hover:not(:disabled),
html.ui-theme-dark-void .dark-void-main .edit-page .btn-outline:hover:not(:disabled) {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .saved-hint,
html.ui-theme-dark-void .dark-void-main .write-page .upload-hint {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .editor {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .editor::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .edit-page .editor {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .edit-page .editor::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .preview-pane {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .write-page .preview-label {
  color: var(--dark-void-text-muted);
  border-bottom-color: var(--dark-void-border);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .preview-content {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .tags-input,
html.ui-theme-dark-void .dark-void-main .edit-page .tags-input {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .tags-input::placeholder,
html.ui-theme-dark-void .dark-void-main .edit-page .tags-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .post-type-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
html.ui-theme-dark-void .dark-void-main .write-page .post-type-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--dark-void-border);
  background: var(--dark-void-card);
  color: var(--dark-void-text-muted);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
}
html.ui-theme-dark-void .dark-void-main .write-page .post-type-btn:hover {
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .post-type-btn.active {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-desc-label,
html.ui-theme-dark-void .dark-void-main .write-page .poll-options-label {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-desc-input {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-desc-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-option-input {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-option-input::placeholder {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-option-remove {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-option-remove:hover:not(:disabled) {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-option-add,
html.ui-theme-dark-void .dark-void-main .write-page .poll-settings .poll-check-wrap {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-settings .poll-check-wrap span {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-settings input[type="checkbox"],
html.ui-theme-dark-void .dark-void-main .write-page .poll-settings .poll-check {
  appearance: none;
  -webkit-appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid var(--dark-void-border);
  border-radius: 0 !important;
  background: var(--dark-void-bg);
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
html.ui-theme-dark-void .dark-void-main .write-page .poll-settings input[type="checkbox"]:checked,
html.ui-theme-dark-void .dark-void-main .write-page .poll-settings .poll-check:checked {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 6l3 3 5-6'/%3E%3C/svg%3E");
  background-size: 0.75rem 0.75rem;
  background-position: center;
  background-repeat: no-repeat;
}
html.ui-theme-dark-void .dark-void-main .write-page .actions,
html.ui-theme-dark-void .dark-void-main .edit-page .actions {
  border-top-color: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .write-page .btn-primary,
html.ui-theme-dark-void .dark-void-main .edit-page .btn-primary {
  background: var(--dark-void-text);
  border-color: var(--dark-void-text);
  color: var(--dark-void-bg);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .btn-primary:hover:not(:disabled),
html.ui-theme-dark-void .dark-void-main .edit-page .btn-primary:hover:not(:disabled) {
  background: var(--dark-void-text-muted);
  border-color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .error {
  color: #f87171;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .edit-page .error {
  color: #f87171;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .conflict-banner {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.5);
  border-radius: 0 !important;
  color: var(--dark-void-text);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .versions-panel {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .versions-title,
html.ui-theme-dark-void .dark-void-main .write-page .versions-item {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .btn-ghost {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .btn-ghost:hover {
  color: var(--dark-void-text);
}
/* Rich text editor (Write view) – Dark Void */
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor {
  font-family: 'Space Grotesk', sans-serif;
  background: var(--dark-void-card);
  border: 1px solid var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .editor-toolbar {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-btn,
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-select {
  background: var(--dark-void-card);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-btn:hover,
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-btn.active {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--dark-void-text-muted);
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-select {
  background: var(--dark-void-bg);
  border-color: var(--dark-void-border);
  color: var(--dark-void-text);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-divider {
  background: var(--dark-void-border);
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .toolbar-loading {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .ProseMirror {
  background: var(--dark-void-bg);
  color: var(--dark-void-text);
  border-color: var(--dark-void-border);
  border-radius: 0 !important;
}
html.ui-theme-dark-void .dark-void-main .write-page .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: var(--dark-void-text-muted);
}
html.ui-theme-dark-void .dark-void-main .edit-page > div {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}

/* Dark Void: single collection page */
html.ui-theme-dark-void .dark-void-main .collection-page {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}
html.ui-theme-dark-void .dark-void-main .collection-page .collection-header h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .collection-page .description {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collection-page .owner {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}
html.ui-theme-dark-void .dark-void-main .collection-page .owner:hover {
  color: var(--dark-void-text);
}
html.ui-theme-dark-void .dark-void-main .collection-page .loading,
html.ui-theme-dark-void .dark-void-main .collection-page .empty,
html.ui-theme-dark-void .dark-void-main .collection-page .error {
  color: var(--dark-void-text-muted);
  font-family: 'Space Grotesk', sans-serif;
}

/* Dark Void: FAB – right edge of feed (left of sidebar), sharp edges to match theme */
html.ui-theme-dark-void .fab--dark-void.fab,
html.ui-theme-dark-void .fab.fab--dark-void {
  background: #fff;
  color: #1a1a1f;
  border-radius: 0;
  border: none;
  outline: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  width: 56px;
  height: 56px;
  bottom: max(2.75rem, calc(env(safe-area-inset-bottom, 0px) + 2rem));
  right: calc(280px + 1.5rem);
}
@media (max-width: 1024px) {
  html.ui-theme-dark-void .fab--dark-void.fab,
  html.ui-theme-dark-void .fab.fab--dark-void {
    right: max(1.5rem, env(safe-area-inset-right, 0px));
    /* Sit above the fixed status bar when visible; moves down with bar when bar hides */
    bottom: max(6rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem));
    transition: bottom 0.25s ease-out;
  }
  html.ui-theme-dark-void .app.status-bar-hidden .fab--dark-void.fab,
  html.ui-theme-dark-void .app.status-bar-hidden .fab.fab--dark-void {
    /* Same distance from bottom edge as the gap above the bar when visible */
    bottom: max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem));
  }
}
html.ui-theme-dark-void .fab--dark-void.fab:hover,
html.ui-theme-dark-void .fab.fab--dark-void:hover {
  background: #e8e8ec;
  color: #0d0d0f;
}
html.ui-theme-dark-void .fab--dark-void.fab .fab-icon,
html.ui-theme-dark-void .fab.fab--dark-void .fab-icon {
  width: 1.375rem;
  height: 1.375rem;
}
</style>
