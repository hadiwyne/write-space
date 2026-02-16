<template>
  <div class="follow-requests-page">
    <h1>Follow requests</h1>
    <p class="intro">People who have requested to follow you. Approve or deny each request.</p>

    <div v-if="loading" class="loading">Loading…</div>
    <template v-else-if="list.length > 0">
      <ul class="follow-requests-list">
        <li v-for="u in list" :key="u.id" class="follow-request-item">
          <router-link :to="`/u/${u.username}`" class="follow-request-user">
            <span class="follow-request-name">{{ u.displayName || u.username }}</span>
            <span class="follow-request-handle">@{{ u.username }}</span>
          </router-link>
          <div class="follow-request-actions">
            <button type="button" class="btn btn-sm btn-primary" :disabled="actionLoading === u.id" @click="approve(u.id)">Approve</button>
            <button type="button" class="btn btn-sm btn-ghost" :disabled="actionLoading === u.id" @click="deny(u.id)">Deny</button>
          </div>
        </li>
      </ul>
    </template>
    <p v-else class="empty">No pending follow requests.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'

const list = ref<{ id: string; username: string; displayName: string | null }[]>([])
const loading = ref(true)
const actionLoading = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/users/me/follow-requests')
    list.value = Array.isArray(data) ? data : []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function approve(fromUserId: string) {
  actionLoading.value = fromUserId
  try {
    await api.post(`/users/me/follow-requests/${fromUserId}/approve`)
    list.value = list.value.filter((u) => u.id !== fromUserId)
  } finally {
    actionLoading.value = null
  }
}

async function deny(fromUserId: string) {
  actionLoading.value = fromUserId
  try {
    await api.post(`/users/me/follow-requests/${fromUserId}/deny`)
    list.value = list.value.filter((u) => u.id !== fromUserId)
  } finally {
    actionLoading.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.follow-requests-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}
.follow-requests-page h1 {
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}
.intro {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 1.5rem;
}
.loading,
.empty {
  color: var(--text-tertiary);
  font-size: 0.9375rem;
  margin: 0;
}
.follow-requests-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.follow-request-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}
.follow-request-item:last-child {
  border-bottom: none;
}
.follow-request-user {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}
.follow-request-user:hover {
  color: var(--accent-primary);
}
.follow-request-name {
  font-weight: 600;
}
.follow-request-handle {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
.follow-request-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-ghost:hover:not(:disabled) {
  background: var(--bg-primary);
  color: var(--text-primary);
}
</style>
