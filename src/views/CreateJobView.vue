<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-neutral-900 mb-2">Create a new job</h1>
    <p class="text-neutral-600 mb-8">Post a new job opening to find the right candidates</p>

    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
      <form @submit.prevent="handleCreateJob" class="space-y-6">
        <!-- Job Title field -->
        <div>
          <label for="title" class="block text-sm font-medium text-neutral-900 mb-2">
            Job Title
          </label>
          <input
            id="title"
            v-model="title"
            type="text"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="e.g., Senior Frontend Developer"
          />
        </div>

        <!-- Description field -->
        <div>
          <label for="description" class="block text-sm font-medium text-neutral-900 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="description"
            required
            rows="8"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            placeholder="Describe the job, responsibilities, requirements, etc."
          />
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
          {{ isLoading ? 'Creating job...' : 'Create job' }}
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
const title = ref('')
const description = ref('')
const error = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const handleCreateJob = async () => {
  error.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()

    if (userError || !data.user) {
      error.value = 'Could not retrieve user information'
      isLoading.value = false
      return
    }

    const userId = data.user.id

    // Insert job into database
    const { error: insertError } = await supabase
      .from('jobs')
      .insert([
        {
          title: title.value,
          description: description.value,
          customer_id: userId
        }
      ])

    if (insertError) {
      error.value = insertError.message
      isLoading.value = false
      return
    }

    // Success - show message and reset form
    successMessage.value = 'Job has been created!'
    title.value = ''
    description.value = ''
    isLoading.value = false

    // Redirect to dashboard after 1 second
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (err) {
    error.value = 'An unexpected error occurred'
    isLoading.value = false
  }
}
</script>