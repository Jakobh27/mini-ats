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
              Applied for: <span class="font-medium">{{ jobTitle }}</span>
            </p>
            <p class="text-neutral-600 mt-1">
              Company: <span class="font-medium">{{ companyName }}</span>
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
              {{ getStageLabel(candidate.stage) }}
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
          
          <button
            @click="openDeleteConfirmation"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Delete candidate
          </button>
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

      <!-- Stage management component -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <StageSelector
          :current-stage="candidate.stage"
          title="Change Stage"
          :success-message="stageUpdateMessage"
          @stage-selected="updateStage"
        />
      </div>
    </div>

    <!-- Delete confirmation modal component -->
    <DeleteConfirmationModal
      :is-open="showDeleteConfirmation"
      title="Delete candidate?"
      :message="`Are you sure you want to delete ${candidate?.name}? This action cannot be undone.`"
      :is-loading="isDeleting"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="closeDeleteConfirmation"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { useUserContext } from '../composables/useUserContext'
import StageSelector from '../components/StageSelector.vue'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal.vue'

const route = useRoute()
const router = useRouter()
const { userId, isAdmin, userRole, companyName: userCompanyNameRef } = useUserContext()
const candidate = ref(null)
const loading = ref(true)
const stageUpdateMessage = ref('')
const showDeleteConfirmation = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')
const jobTitle = ref('Unknown job')
const companyName = ref('Unknown company')

const userCompanyName = computed(() => userCompanyNameRef.value || 'Loading...')
const userRoleLabel = computed(() => userRole.value === 'admin' ? '(Admin)' : '(Customer)')

const stageLabels = {
  'Ny': 'New',
  'Intervju': 'Interview',
  'Anställd': 'Hired'
}

const getStageLabel = (stage) => {
  return stageLabels[stage] || stage
}

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

    // Fetch job details
    if (data.job_id) {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, customer_id')
        .eq('id', data.job_id)
        .single()

      if (!jobError && jobData) {
        jobTitle.value = jobData.title

        // Fetch company details using customer_id from job
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_name')
          .eq('id', jobData.customer_id)
          .single()

        if (!profileError && profileData) {
          companyName.value = profileData.company_name
        }
      }
    }

    loading.value = false
  } catch (err) {
    console.error('Error loading candidate:', err)
    loading.value = false
  }
})

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

const openDeleteConfirmation = () => {
  deleteError.value = ''
  showDeleteConfirmation.value = true
}

const closeDeleteConfirmation = () => {
  showDeleteConfirmation.value = false
  deleteError.value = ''
}

const confirmDelete = async () => {
  isDeleting.value = true
  deleteError.value = ''

  try {
    // Delete candidate from database
    const { error: deleteErr } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidate.value.id)

    if (deleteErr) {
      deleteError.value = deleteErr.message
      isDeleting.value = false
      return
    }

    // Success - redirect to dashboard
    isDeleting.value = false
    showDeleteConfirmation.value = false
    
    // Show success message briefly before redirecting
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/')
  } catch (err) {
    deleteError.value = 'An unexpected error occurred'
    isDeleting.value = false
  }
}
</script>
