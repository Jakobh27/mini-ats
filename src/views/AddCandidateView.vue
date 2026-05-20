<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-neutral-900 mb-2">Add a new candidate</h1>
    <p class="text-neutral-600 mb-8">Add candidates to your job openings</p>

    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
      <form @submit.prevent="handleAddCandidate" class="space-y-6">
        <!-- Name field -->
        <div>
          <label for="name" class="block text-sm font-medium text-neutral-900 mb-2">
            Name
          </label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="e.g., John Doe"
          />
        </div>

        <!-- LinkedIn URL field -->
        <div>
          <label for="linkedinUrl" class="block text-sm font-medium text-neutral-900 mb-2">
            LinkedIn URL
          </label>
          <input
            id="linkedinUrl"
            v-model="linkedinUrl"
            type="url"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/johndoe"
          />
        </div>

        <!-- Job dropdown -->
        <div>
          <label for="jobId" class="block text-sm font-medium text-neutral-900 mb-2">
            Job
          </label>
          <select
            id="jobId"
            v-model="jobId"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
          >
            <option value="" disabled>Select a job</option>
            <option v-for="job in jobs" :key="job.id" :value="job.id">
              {{ job.title }}
            </option>
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
          :disabled="isLoading || jobs.length === 0"
          class="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-400 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {{ isLoading ? 'Adding candidate...' : 'Add candidate' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const name = ref('')
const linkedinUrl = ref('')
const jobId = ref('')
const jobs = ref([])
const error = ref('')
const successMessage = ref('')
const isLoading = ref(false)

onMounted(async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title')

    if (fetchError) {
      error.value = 'Could not load jobs'
      return
    }

    jobs.value = data || []
  } catch (err) {
    error.value = 'An unexpected error occurred'
  }
})

const handleAddCandidate = async () => {
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

    // Insert candidate into database
    const { error: insertError } = await supabase
      .from('candidates')
      .insert([
        {
          name: name.value,
          linkedin_url: linkedinUrl.value,
          job_id: jobId.value,
          customer_id: userId,
          stage: 'Ny'
        }
      ])

    if (insertError) {
      error.value = insertError.message
      isLoading.value = false
      return
    }

    // Success - show message and reset form
    successMessage.value = 'Candidate has been added!'
    name.value = ''
    linkedinUrl.value = ''
    jobId.value = ''
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
