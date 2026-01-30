<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Sign up</h1>
      <form @submit.prevent="submit" class="form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" v-model="username" type="text" required autocomplete="username" minlength="3" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required autocomplete="new-password" minlength="6" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">Create account</button>
      </form>
      <p class="footer">Already have an account? <router-link to="/login">Log in</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(email.value, username.value, password.value)
    router.push('/feed')
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.auth-card { background: #fff; padding: 2rem; border-radius: 12px; box-shadow: var(--shadow); width: 100%; max-width: 380px; }
.auth-card h1 { margin: 0 0 1.5rem; font-size: 1.5rem; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-group label { font-size: 0.875rem; font-weight: 500; color: var(--gray-700); }
.form-group input { padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 1rem; }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.btn-block { width: 100%; padding: 0.75rem; margin-top: 0.5rem; }
.footer { margin: 1.5rem 0 0; font-size: 0.875rem; color: var(--gray-700); }
</style>
