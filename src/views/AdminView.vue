<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-neutral-900 mb-2">Create new account</h1>
    <p class="text-neutral-600 mb-8">Add a new user to the system</p>

    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
      <form @submit.prevent="handleCreateAccount" class="space-y-6">
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
            placeholder="user@example.com"
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
            minlength="6"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <!-- Company name field -->
        <div>
          <label for="companyName" class="block text-sm font-medium text-neutral-900 mb-2">
            Company name
          </label>
          <input
            id="companyName"
            v-model="companyName"
            type="text"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="e.g., Acme Corp"
          />
        </div>

        <!-- Role dropdown -->
        <div>
          <label for="role" class="block text-sm font-medium text-neutral-900 mb-2">
            Role
          </label>
          <select
            id="role"
            v-model="role"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
          >
            <option value="">Select a role</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-3">
          <p class="text-green-700 text-sm">{{ successMessage }}</p>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-400 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>
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
const companyName = ref('')
const role = ref('')
const error = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const handleCreateAccount = async () => {
  error.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // Sign up user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })

    if (signUpError) {
      error.value = signUpError.message
      isLoading.value = false
      return
    }

    if (!data.user) {
      error.value = 'Failed to create user'
      isLoading.value = false
      return
    }

    // Insert profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          company_name: companyName.value,
          role: role.value
        }
      ])

    if (insertError) {
      error.value = insertError.message
      isLoading.value = false
      return
    }

    // Success
    successMessage.value = 'Account created! You are now logged in as the new user.'
    email.value = ''
    password.value = ''
    companyName.value = ''
    role.value = ''
    isLoading.value = false

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (err) {
    error.value = 'An unexpected error occurred'
    isLoading.value = false
  }
}
</script>
