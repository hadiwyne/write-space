<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Log in</h1>
      <form @submit.prevent="submit" class="form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required autocomplete="current-password" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">Log in</button>
      </form>
      <p class="footer">Don't have an account? <router-link to="/register">Sign up</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/feed')
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.auth-card {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border-light);
  width: 100%;
  max-width: 380px;
}
.auth-card h1 { margin: 0 0 1.5rem; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); }
.form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-group label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }
.form-group input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  background: var(--bg-card);
  transition: border-color 0.2s ease;
}
.form-group input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1); }
.error { color: var(--like-color); font-size: 0.875rem; margin: 0; }
.btn-primary { background: var(--accent-primary); color: white; border: 2px solid var(--accent-primary); }
.btn-primary:hover:not(:disabled) { background: var(--accent-burgundy); border-color: var(--accent-burgundy); }
.btn-block { width: 100%; padding: 0.75rem; margin-top: 0.5rem; font-weight: 600; border-radius: var(--radius-md); }
.footer { margin: 1.5rem 0 0; font-size: 0.875rem; color: var(--text-secondary); }
</style>
