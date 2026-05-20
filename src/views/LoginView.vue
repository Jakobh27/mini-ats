<template>
  <div class="flex items-center justify-center min-h-screen bg-neutral-50">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Welcome back</h1>
        <p class="text-neutral-600 mb-8">Sign in to your account</p>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-900 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password field -->
          <div>
            <label for="password" class="block text-sm font-medium text-neutral-900 mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <!-- Error message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-red-700 text-sm">{{ error }}</p>
          </div>

          <!-- Login button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-400 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (signInError) {
      error.value = signInError.message
      isLoading.value = false
      return
    }

    // Login successful - redirect to dashboard
    router.push('/')
  } catch (err) {
    error.value = 'An unexpected error occurred'
    isLoading.value = false
  }
}
</script>
