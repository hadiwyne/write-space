<template>
  <div class="privacy-page">
    <h1>Privacy Settings</h1>
    <p class="intro">Control how others interact with you.</p>

    <form @submit.prevent="save" class="privacy-form">
      <div class="form-group">
        <label for="whoCanSeeLikes" class="label">Who can see my likes</label>
        <select id="whoCanSeeLikes" v-model="whoCanSeeLikes" class="select">
          <option value="NO_ONE">No one</option>
          <option value="FOLLOWERS">Followers</option>
          <option value="PUBLIC">Public</option>
        </select>
        <p class="hint">Profile's Liked tab.</p>
      </div>

      <div class="form-group">
        <label for="whoCanSeeFollowing" class="label">Who can see my following</label>
        <select id="whoCanSeeFollowing" v-model="whoCanSeeFollowing" class="select">
          <option value="NO_ONE">No one</option>
          <option value="FOLLOWERS">Followers</option>
          <option value="PUBLIC">Public</option>
        </select>
        <p class="hint">Hide or show the people you're following.</p>
      </div>

      <div class="form-group">
        <label for="whoCanSeeFollowers" class="label">Who can see my followers</label>
        <select id="whoCanSeeFollowers" v-model="whoCanSeeFollowers" class="select">
          <option value="NO_ONE">No one</option>
          <option value="FOLLOWERS">Followers</option>
          <option value="PUBLIC">Public</option>
        </select>
        <p class="hint">Hide or show your list of followers.</p>
      </div>

      <div class="form-group">
        <label for="whoCanFollowMe" class="label">Who can follow me</label>
        <select id="whoCanFollowMe" v-model="whoCanFollowMe" class="select">
          <option value="PUBLIC">Public</option>
          <option value="APPROVAL">By approval</option>
        </select>
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api/client'

const auth = useAuthStore()
const whoCanSeeLikes = ref('PUBLIC')
const whoCanSeeFollowing = ref('PUBLIC')
const whoCanSeeFollowers = ref('PUBLIC')
const whoCanFollowMe = ref('PUBLIC')
const error = ref('')
const success = ref('')
const saving = ref(false)

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
.select {
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
}
.select:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.hint {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin: 0;
}
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
.btn-primary:hover:not(:disabled) {
  background: var(--accent-burgundy);
}
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
