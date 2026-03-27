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
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              minlength="6"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <!-- Eye open -->
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- Eye closed -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
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
const showPassword = ref(false)

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
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 5vw, 2rem);
}
.auth-card {
  background: var(--bg-card);
  padding: clamp(1.25rem, 4vw, 2rem);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border-light);
  width: 100%;
  max-width: 380px;
  min-width: 0;
}
.auth-card h1 {
  margin: 0 0 1.25rem;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}
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
  min-width: 0;
}
.form-group input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1); }
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrapper input {
  width: 100%;
  padding-right: 2.75rem;
}
.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}
.toggle-password:hover { color: var(--text-primary); }
.error { color: var(--like-color); font-size: 0.875rem; margin: 0; }
.btn-primary { background: var(--accent-primary); color: white; border: 2px solid var(--accent-primary); }
.btn-primary:hover:not(:disabled) { background: var(--accent-burgundy); border-color: var(--accent-burgundy); }
.btn-block { width: 100%; padding: 0.75rem; margin-top: 0.5rem; font-weight: 600; border-radius: var(--radius-md); }
.footer { margin: 1.25rem 0 0; font-size: 0.875rem; color: var(--text-secondary); }
</style>
