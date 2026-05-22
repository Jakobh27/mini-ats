<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <router-link
        to="/"
        class="text-violet-600 hover:text-violet-700 font-medium"
      >
        ← Back to dashboard
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-neutral-600">Loading candidate...</p>
    </div>

    <div v-else-if="!candidate" class="text-center py-12">
      <p class="text-red-600">Candidate not found or access denied</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Header card -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">{{ candidate.name }}</h1>
            <p class="text-neutral-600 mt-2">
              Applied for: <span class="font-medium">{{ getJobTitle() }}</span>
            </p>
            <p v-if="isAdmin" class="text-neutral-600 mt-1">
              Company: <span class="font-medium">{{ getCompanyName() }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                {
                  'bg-blue-100 text-blue-700': candidate.stage === 'Ny',
                  'bg-amber-100 text-amber-700': candidate.stage === 'Intervju',
                  'bg-green-100 text-green-700': candidate.stage === 'Anställd'
                }
              ]"
            >
              {{ candidate.stage }}
            </span>
          </div>
        </div>

        <p class="text-sm text-neutral-500 mb-4">
          Applied on: {{ formatDate(candidate.created_at) }}
        </p>

        <div class="flex gap-2">
          <router-link
            :to="`/candidate/${candidate.id}/edit`"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
          >
            Edit candidate
          </router-link>
        </div>
      </div>

      <!-- Contact information -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <h2 class="text-lg font-bold text-neutral-900 mb-4">Contact Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-neutral-600 mb-1">Email</p>
            <a
              :href="`mailto:${candidate.email}`"
              class="text-violet-600 hover:text-violet-700 font-medium"
            >
              {{ candidate.email }}
            </a>
          </div>
          <div>
            <p class="text-sm text-neutral-600 mb-1">Phone</p>
            <a
              :href="`tel:${candidate.phone}`"
              class="text-violet-600 hover:text-violet-700 font-medium"
            >
              {{ candidate.phone }}
            </a>
          </div>
          <div class="md:col-span-2">
            <p class="text-sm text-neutral-600 mb-1">LinkedIn</p>
            <a
              :href="candidate.linkedin_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-violet-600 hover:text-violet-700 font-medium"
            >
              {{ candidate.linkedin_url }}
            </a>
          </div>
        </div>
      </div>

      <!-- CV section -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <h2 class="text-lg font-bold text-neutral-900 mb-4">CV</h2>
        <div v-if="candidate.resume_url" class="space-y-4">
          <p class="text-neutral-600 text-sm">CV uploaded on {{ formatDate(candidate.created_at) }}</p>
          <a
            :href="candidate.resume_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Open CV
          </a>
        </div>
        <p v-else class="text-neutral-600 text-sm">No CV uploaded yet</p>
      </div>

      <!-- Stage management -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <h2 class="text-lg font-bold text-neutral-900 mb-4">Change Stage</h2>
        <div class="flex gap-2 flex-wrap">
          <button
            @click="updateStage('Ny')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              candidate.stage === 'Ny'
                ? 'bg-blue-600 text-white'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
            ]"
          >
            New
          </button>
          <button
            @click="updateStage('Intervju')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              candidate.stage === 'Intervju'
                ? 'bg-amber-600 text-white'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
            ]"
          >
            Interview
          </button>
          <button
            @click="updateStage('Anställd')"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              candidate.stage === 'Anställd'
                ? 'bg-green-600 text-white'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
            ]"
          >
            Hired
          </button>
        </div>
        <p v-if="stageUpdateMessage" class="text-green-600 text-sm mt-2">
          {{ stageUpdateMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { useUserContext } from '../composables/useUserContext'

const route = useRoute()
const router = useRouter()
const { userId, isAdmin } = useUserContext()
const candidate = ref(null)
const loading = ref(true)
const stageUpdateMessage = ref('')

onMounted(async () => {
  try {
    const candidateId = route.params.id

    // Check user context
    await new Promise(resolve => {
      const checkUser = setInterval(() => {
        if (userId.value) {
          clearInterval(checkUser)
          resolve()
        }
      }, 50)
      setTimeout(() => clearInterval(checkUser), 5000)
    })

    // Fetch candidate
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()

    if (error || !data) {
      loading.value = false
      return
    }

    // Check access: user must be admin or the candidate's customer
    if (!isAdmin.value && data.customer_id !== userId.value) {
      loading.value = false
      return
    }

    candidate.value = data
    loading.value = false
  } catch (err) {
    console.error('Error loading candidate:', err)
    loading.value = false
  }
})

const getJobTitle = () => {
  // In a real app, you'd fetch this from the jobs table
  // For now, we'll fetch it when rendering
  if (candidate.value?.job_id) {
    // This would need to be async - for now returning placeholder
    return 'Loading job...'
  }
  return 'N/A'
}

const getCompanyName = () => {
  // In a real app, you'd get this from the job's customer_id
  return 'Loading company...'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const updateStage = async (newStage) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ stage: newStage })
      .eq('id', candidate.value.id)

    if (error) {
      console.error('Error updating stage:', error)
      return
    }

    candidate.value.stage = newStage
    stageUpdateMessage.value = `Stage updated to ${newStage}`
    setTimeout(() => {
      stageUpdateMessage.value = ''
    }, 2000)
  } catch (err) {
    console.error('Error:', err)
  }
}
</script>
