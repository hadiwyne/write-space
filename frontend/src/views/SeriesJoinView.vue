<template>
  <div class="join-page">
    <!-- Loading -->
    <div v-if="loading" class="join-card">
      <i class="pi pi-spin pi-spinner join-spinner"></i>
      <p>Loading invitation…</p>
    </div>

    <!-- Invalid / expired -->
    <div v-else-if="invalid" class="join-card join-card--error">
      <i class="pi pi-times-circle join-icon join-icon--error"></i>
      <h2 class="join-title">Invitation Not Found</h2>
      <p class="join-sub">This invite link is invalid or has already been used.</p>
      <router-link to="/" class="btn-primary">Go to Homepage</router-link>
    </div>

    <!-- Result: accepted -->
    <div v-else-if="result === 'accepted'" class="join-card join-card--success">
      <i class="pi pi-check-circle join-icon join-icon--success"></i>
      <h2 class="join-title">You're in!</h2>
      <p class="join-sub">You've joined <strong>{{ seriesName }}</strong> as a contributor.</p>
      <router-link :to="`/series/${seriesSlug}`" class="btn-primary">View Series</router-link>
    </div>

    <!-- Result: declined -->
    <div v-else-if="result === 'declined'" class="join-card">
      <i class="pi pi-ban join-icon join-icon--muted"></i>
      <h2 class="join-title">Invitation Declined</h2>
      <p class="join-sub">You've declined the invitation to <strong>{{ seriesName }}</strong>. The link is now invalid.</p>
      <router-link to="/" class="btn-primary">Go to Homepage</router-link>
    </div>

    <!-- Result: already member -->
    <div v-else-if="result === 'already'" class="join-card join-card--success">
      <i class="pi pi-check-circle join-icon join-icon--success"></i>
      <h2 class="join-title">Already a Member</h2>
      <p class="join-sub">You're already a member of <strong>{{ seriesName }}</strong>.</p>
      <router-link :to="`/series/${seriesSlug}`" class="btn-primary">View Series</router-link>
    </div>

    <!-- Invite preview -->
    <div v-else-if="invite" class="join-card">
      <!-- Series identity -->
      <div class="join-series-identity">
        <img
          v-if="invite.series.logoMimeType"
          :src="`/api/series/${invite.series.slug}/images/logo`"
          alt=""
          class="join-series-logo"
        />
        <div v-else class="join-series-logo-placeholder">
          <i class="pi pi-book"></i>
        </div>
        <span class="join-series-name">{{ invite.series.name }}</span>
      </div>

      <h2 class="join-title">You've been invited!</h2>
      <p class="join-sub">
        <strong>{{ invite.inviter.displayName || invite.inviter.username }}</strong>
        invited you to join
        <strong>{{ invite.series.name }}</strong>
        as a <span class="join-role">{{ invite.role }}</span>.
      </p>

      <!-- Not logged in -->
      <template v-if="!authStore.user">
        <p class="join-login-hint">You need to be logged in to accept this invitation.</p>
        <router-link :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`" class="btn-primary">
          Log in to Accept
        </router-link>
      </template>

      <!-- Logged in -->
      <template v-else>
        <div class="join-actions">
          <button type="button" class="btn-primary" :disabled="acting" @click="acceptInvite">
            <i v-if="acting === 'accept'" class="pi pi-spin pi-spinner"></i>
            Accept
          </button>
          <button type="button" class="btn-secondary" :disabled="!!acting" @click="declineInvite">
            <i v-if="acting === 'decline'" class="pi pi-spin pi-spinner"></i>
            Decline
          </button>
        </div>
        <p v-if="errorMsg" class="join-error">{{ errorMsg }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

interface InvitePreview {
  series: { id: string; name: string; slug: string; logoMimeType?: string | null }
  inviter: { id: string; username: string; displayName?: string | null }
  role: 'CONTRIBUTOR'
}

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const invalid = ref(false)
const invite = ref<InvitePreview | null>(null)
const acting = ref<'accept' | 'decline' | null>(null)
const seriesName = computed(() => invite.value?.series.name ?? '')
const seriesSlug = computed(() => invite.value?.series.slug ?? '')
const result = ref<'accepted' | 'declined' | 'already' | null>(null)
const errorMsg = ref('')

onMounted(async () => {
  const token = route.params.token as string
  try {
    const { data } = await api.get(`/series/join/${token}`, { cache: false })
    invite.value = data
  } catch {
    invalid.value = true
  } finally {
    loading.value = false
  }
})

async function acceptInvite() {
  acting.value = 'accept'
  errorMsg.value = ''
  const token = route.params.token as string
  try {
    await api.post(`/series/join/${token}`)
    result.value = 'accepted'
  } catch (e: any) {
    const msg: string = e?.response?.data?.message || ''
    if (msg.toLowerCase().includes('already')) {
      result.value = 'already'
    } else {
      errorMsg.value = msg || 'Something went wrong. Please try again.'
    }
  } finally {
    acting.value = null
  }
}

async function declineInvite() {
  acting.value = 'decline'
  errorMsg.value = ''
  const token = route.params.token as string
  try {
    await api.post(`/series/join/${token}/decline`)
    result.value = 'declined'
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    acting.value = null
  }
}
</script>

<style scoped>
.join-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--bg-primary);
}

.join-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  max-width: 440px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
}

.join-card--success { border-color: #22c55e40; }
.join-card--error   { border-color: #ef444440; }

.join-spinner {
  font-size: 2rem;
  color: var(--text-muted);
}

.join-icon {
  font-size: 3rem;
}
.join-icon--success { color: #22c55e; }
.join-icon--error   { color: #ef4444; }
.join-icon--muted   { color: var(--text-muted); }

.join-series-identity {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin-bottom: .25rem;
}

.join-series-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.join-series-logo-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.join-series-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.join-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.join-sub {
  color: var(--text-secondary);
  font-size: .95rem;
  line-height: 1.5;
  margin: 0;
}

.join-role {
  text-transform: capitalize;
  font-weight: 600;
  color: var(--accent, var(--text-primary));
}

.join-login-hint {
  color: var(--text-muted);
  font-size: .85rem;
  margin: 0;
}

.join-actions {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.join-error {
  color: #ef4444;
  font-size: .85rem;
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem 1.4rem;
  border-radius: 8px;
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: var(--accent, #6366f1);
  color: #fff;
  text-decoration: none;
  transition: opacity .15s, box-shadow .15s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { opacity: .88; box-shadow: 0 2px 10px rgba(0,0,0,.15); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem 1.4rem;
  border-radius: 8px;
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border: 1.5px solid var(--border-medium);
  color: var(--text-primary);
  transition: background .15s, box-shadow .15s;
  white-space: nowrap;
}
.btn-secondary:hover:not(:disabled) { background: var(--bg-tertiary); box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.btn-secondary:disabled { opacity: .5; cursor: not-allowed; }
</style>
