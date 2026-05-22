<template>
  <div v-if="!isLoading" class="p-6">
    <h1 class="text-3xl font-bold text-neutral-900 mb-8">Dashboard</h1>

    <!-- Filters Component -->
    <FilterBar
      :search-query="searchQuery"
      :selected-job-id="selectedJobId"
      :selected-company-id="selectedCompanyId"
      :jobs="jobs"
      :companies="companies"
      :show-company-filter="true"
      grid-class="grid-cols-1 md:grid-cols-3"
      @update:search-query="searchQuery = $event"
      @update:selected-job-id="selectedJobId = $event"
      @update:selected-company-id="selectedCompanyId = $event"
    />

    <!-- Kanban board -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KanbanColumn
        title="New"
        :candidates="newCandidatesList"
        :show-company="true"
        :get-job-title="getJobTitle"
        :get-company-name="getCompanyName"
        @update:candidates="newCandidatesList = $event"
        @candidate-moved="onCandidateMoved('Ny')"
      />

      <KanbanColumn
        title="Interview"
        :candidates="interviewCandidatesList"
        :show-company="true"
        :get-job-title="getJobTitle"
        :get-company-name="getCompanyName"
        @update:candidates="interviewCandidatesList = $event"
        @candidate-moved="onCandidateMoved('Intervju')"
      />

      <KanbanColumn
        title="Hired"
        :candidates="hiredCandidatesList"
        :show-company="true"
        :get-job-title="getJobTitle"
        :get-company-name="getCompanyName"
        @update:candidates="hiredCandidatesList = $event"
        @candidate-moved="onCandidateMoved('Anställd')"
      />
    </div>

    <!-- Delete confirmation modal component -->
    <DeleteConfirmationModal
      :is-open="showDeleteConfirmation"
      title="Delete candidate?"
      :message="`Are you sure you want to delete ${candidateToDelete?.name}? This action cannot be undone.`"
      :is-loading="isDeleting"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="closeDeleteConfirmation"
    />

    <!-- Success notification component -->
    <SuccessNotification
      :message="deleteSuccess"
    />
  </div>
  <div v-else class="flex justify-center items-center h-64">
    <p class="text-neutral-600">Loading dashboard...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabaseClient'
import FilterBar from '../components/FilterBar.vue'
import KanbanColumn from '../components/KanbanColumn.vue'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal.vue'
import SuccessNotification from '../components/SuccessNotification.vue'

const jobs = ref([])
const companies = ref([])
const allCandidates = ref([])
const newCandidatesList = ref([])
const interviewCandidatesList = ref([])
const hiredCandidatesList = ref([])
const searchQuery = ref('')
const selectedJobId = ref('')
const selectedCompanyId = ref('')
const isLoading = ref(true)
const userId = ref(null)

// Delete confirmation state
const showDeleteConfirmation = ref(false)
const candidateToDelete = ref(null)
const isDeleting = ref(false)
const deleteError = ref('')
const deleteSuccess = ref('')

onMounted(async () => {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      console.error('Could not retrieve user')
      isLoading.value = false
      return
    }

    userId.value = userData.user.id

    // Load all companies
    const { data: companiesData, error: companiesError } = await supabase
      .from('profiles')
      .select('id, company_name')
      .eq('role', 'customer')

    if (companiesError) throw companiesError
    companies.value = companiesData || []

    // Build jobs query - load all jobs for admin
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, customer_id')

    if (jobsError) throw jobsError
    jobs.value = jobsData || []

    // Build candidates query - load all candidates for admin
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, name, linkedin_url, job_id, stage, customer_id')

    if (candidatesError) throw candidatesError
    allCandidates.value = candidatesData || []

    // Initial distribution
    filterAndSortCandidates()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('candidates-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'candidates'
        },
        (payload) => {
          handleCandidateDeleted(payload.old.id)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  } catch (err) {
    console.error('Error loading data:', err)
  } finally {
    isLoading.value = false
  }
})

// Watch for filter changes
watch([searchQuery, selectedJobId, selectedCompanyId], () => {
  filterAndSortCandidates()
})

const filterAndSortCandidates = () => {
  const filtered = allCandidates.value.filter((candidate) => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesJob = !selectedJobId.value || candidate.job_id === selectedJobId.value
    const matchesCompany = !selectedCompanyId.value || candidate.customer_id === selectedCompanyId.value
    return matchesSearch && matchesJob && matchesCompany
  })

  newCandidatesList.value = filtered.filter((c) => c.stage === 'Ny')
  interviewCandidatesList.value = filtered.filter((c) => c.stage === 'Intervju')
  hiredCandidatesList.value = filtered.filter((c) => c.stage === 'Anställd')
}

const getJobTitle = (jobId) => {
  const job = jobs.value.find((j) => j.id === jobId)
  return job ? job.title : 'Unknown job'
}

const getCompanyName = (customerId) => {
  const company = companies.value.find((c) => c.id === customerId)
  return company ? company.company_name : 'Unknown company'
}

const onCandidateMoved = async (targetStage) => {
  try {
    const allLists = {
      'Ny': newCandidatesList.value,
      'Intervju': interviewCandidatesList.value,
      'Anställd': hiredCandidatesList.value
    }

    for (const [stage, candidates] of Object.entries(allLists)) {
      for (const candidate of candidates) {
        const originalCandidate = allCandidates.value.find((c) => c.id === candidate.id)

        if (originalCandidate && originalCandidate.stage !== stage) {
          const { error } = await supabase
            .from('candidates')
            .update({ stage: stage })
            .eq('id', candidate.id)

          if (error) {
            console.error('Error updating candidate:', error)
            filterAndSortCandidates()
            return
          }

          originalCandidate.stage = stage
        }
      }
    }
  } catch (err) {
    console.error('Error in onCandidateMoved:', err)
    filterAndSortCandidates()
  }
}

const openDeleteConfirmation = (candidate) => {
  candidateToDelete.value = candidate
  deleteError.value = ''
  showDeleteConfirmation.value = true
}

const closeDeleteConfirmation = () => {
  showDeleteConfirmation.value = false
  candidateToDelete.value = null
  deleteError.value = ''
}

const confirmDelete = async () => {
  isDeleting.value = true
  deleteError.value = ''

  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidateToDelete.value.id)

    if (error) {
      deleteError.value = error.message
      isDeleting.value = false
      return
    }

    // Remove from local state
    handleCandidateDeleted(candidateToDelete.value.id)

    // Close modal and show success
    isDeleting.value = false
    showDeleteConfirmation.value = false
    deleteSuccess.value = `${candidateToDelete.value.name} has been deleted`

    // Clear success message after 3 seconds
    setTimeout(() => {
      deleteSuccess.value = ''
    }, 3000)
  } catch (err) {
    deleteError.value = 'An unexpected error occurred'
    isDeleting.value = false
  }
}

const handleCandidateDeleted = (candidateId) => {
  // Remove from allCandidates
  allCandidates.value = allCandidates.value.filter(c => c.id !== candidateId)
  
  // Re-filter to update the lists
  filterAndSortCandidates()
}
</script>
