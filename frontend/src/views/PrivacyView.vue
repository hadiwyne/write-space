<template>
  <div class="privacy-page">
    <h1>Privacy Settings</h1>
    <p class="intro">Control how others interact with you.</p>

    <form @submit.prevent="save" class="privacy-form">
      <div class="form-group">
        <label class="label">Who can see my likes</label>
        <div class="dropdown-wrap" ref="likesDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="likesDropdownOpen" @click="likesDropdownOpen = !likesDropdownOpen">
            <span>{{ VISIBILITY_LABELS[whoCanSeeLikes] }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="likesDropdownOpen" class="dropdown-panel" role="menu">
              <button v-for="(label, key) in VISIBILITY_LABELS" :key="key" type="button" class="dropdown-option" role="menuitem"
                :class="{ active: whoCanSeeLikes === key }"
                @click="whoCanSeeLikes = key; likesDropdownOpen = false">{{ label }}</button>
            </div>
          </Transition>
        </div>
        <p class="hint">Profile's Liked tab.</p>
      </div>

      <div class="form-group">
        <label class="label">Who can see my following</label>
        <div class="dropdown-wrap" ref="followingDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="followingDropdownOpen" @click="followingDropdownOpen = !followingDropdownOpen">
            <span>{{ VISIBILITY_LABELS[whoCanSeeFollowing] }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="followingDropdownOpen" class="dropdown-panel" role="menu">
              <button v-for="(label, key) in VISIBILITY_LABELS" :key="key" type="button" class="dropdown-option" role="menuitem"
                :class="{ active: whoCanSeeFollowing === key }"
                @click="whoCanSeeFollowing = key; followingDropdownOpen = false">{{ label }}</button>
            </div>
          </Transition>
        </div>
        <p class="hint">Hide or show the people you're following.</p>
      </div>

      <div class="form-group">
        <label class="label">Who can see my followers</label>
        <div class="dropdown-wrap" ref="followersDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="followersDropdownOpen" @click="followersDropdownOpen = !followersDropdownOpen">
            <span>{{ VISIBILITY_LABELS[whoCanSeeFollowers] }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="followersDropdownOpen" class="dropdown-panel" role="menu">
              <button v-for="(label, key) in VISIBILITY_LABELS" :key="key" type="button" class="dropdown-option" role="menuitem"
                :class="{ active: whoCanSeeFollowers === key }"
                @click="whoCanSeeFollowers = key; followersDropdownOpen = false">{{ label }}</button>
            </div>
          </Transition>
        </div>
        <p class="hint">Hide or show your list of followers.</p>
      </div>

      <div class="form-group">
        <label class="label">Who can follow me</label>
        <div class="dropdown-wrap" ref="followMeDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="followMeDropdownOpen" @click="followMeDropdownOpen = !followMeDropdownOpen">
            <span>{{ FOLLOW_LABELS[whoCanFollowMe] }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="followMeDropdownOpen" class="dropdown-panel" role="menu">
              <button v-for="(label, key) in FOLLOW_LABELS" :key="key" type="button" class="dropdown-option" role="menuitem"
                :class="{ active: whoCanFollowMe === key }"
                @click="whoCanFollowMe = key; followMeDropdownOpen = false">{{ label }}</button>
            </div>
          </Transition>
        </div>
        <p v-if="whoCanFollowMe === 'PUBLIC'" class="hint">Anyone can follow you.</p>
        <p v-else-if="whoCanFollowMe === 'APPROVAL'" class="hint">You receive follow requests and can approve or deny them.</p>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving">Save privacy settings</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api/client'

const VISIBILITY_LABELS: Record<string, string> = {
  NO_ONE: 'No one',
  FOLLOWERS: 'Followers',
  PUBLIC: 'Public',
}

const FOLLOW_LABELS: Record<string, string> = {
  PUBLIC: 'Public',
  APPROVAL: 'By approval',
}

const auth = useAuthStore()
const whoCanSeeLikes = ref('PUBLIC')
const whoCanSeeFollowing = ref('PUBLIC')
const whoCanSeeFollowers = ref('PUBLIC')
const whoCanFollowMe = ref('PUBLIC')
const error = ref('')
const success = ref('')
const saving = ref(false)

// Dropdown open states
const likesDropdownOpen = ref(false)
const followingDropdownOpen = ref(false)
const followersDropdownOpen = ref(false)
const followMeDropdownOpen = ref(false)

// Dropdown refs for click-outside
const likesDropdownRef = ref<HTMLElement | null>(null)
const followingDropdownRef = ref<HTMLElement | null>(null)
const followersDropdownRef = ref<HTMLElement | null>(null)
const followMeDropdownRef = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (likesDropdownRef.value && !likesDropdownRef.value.contains(target)) likesDropdownOpen.value = false
  if (followingDropdownRef.value && !followingDropdownRef.value.contains(target)) followingDropdownOpen.value = false
  if (followersDropdownRef.value && !followersDropdownRef.value.contains(target)) followersDropdownOpen.value = false
  if (followMeDropdownRef.value && !followMeDropdownRef.value.contains(target)) followMeDropdownOpen.value = false
}

function load() {
  const u = auth.user
  if (u?.whoCanSeeLikes) whoCanSeeLikes.value = u.whoCanSeeLikes
  if (u?.whoCanSeeFollowing) whoCanSeeFollowing.value = u.whoCanSeeFollowing
  if (u?.whoCanSeeFollowers) whoCanSeeFollowers.value = u.whoCanSeeFollowers
  if (u?.whoCanFollowMe) whoCanFollowMe.value = u.whoCanFollowMe
}

onMounted(() => {
  load()
  if (!auth.user?.whoCanSeeLikes) auth.fetchUser().then(load)
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

async function save() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await api.patch('/users/me', {
      whoCanSeeLikes: whoCanSeeLikes.value,
      whoCanSeeFollowing: whoCanSeeFollowing.value,
      whoCanSeeFollowers: whoCanSeeFollowers.value,
      whoCanFollowMe: whoCanFollowMe.value,
    })
    await auth.fetchUser()
    success.value = 'Privacy settings saved.'
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.privacy-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}
.privacy-page h1 {
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}
.intro {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 1.5rem;
}
.privacy-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}
.hint {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* ── Dropdown (matches WriteView / SettingsView) ─────────── */
.dropdown-wrap { position: relative; }
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
}
.dropdown-trigger:hover { border-color: var(--border-medium); }
.dropdown-trigger:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.dropdown-trigger span { flex: 1; }
.dropdown-chevron { font-size: 0.75rem; color: var(--text-tertiary); margin-left: auto; flex-shrink: 0; }
.dropdown-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 100%;
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}
.dropdown-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.dropdown-option:hover { background: var(--bg-primary); }
.dropdown-option.active {
  background: rgba(139, 69, 19, 0.08);
  color: var(--accent-primary);
  font-weight: 600;
}
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
/* ─────────────────────────────────────────────────────────── */

.error { color: var(--like-color); font-size: 0.875rem; margin: 0; }
.success { color: var(--accent-green); font-size: 0.875rem; margin: 0; }
.btn-primary {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: none;
  background: var(--accent-primary);
  color: white;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-burgundy); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
