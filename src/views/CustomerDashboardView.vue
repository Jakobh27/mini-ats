<template>
  <div v-if="!isLoading" class="p-6">
    <h1 class="text-3xl font-bold text-neutral-900 mb-8">Dashboard</h1>

    <!-- Filters Component -->
    <FilterBar
      :search-query="searchQuery"
      :selected-job-id="selectedJobId"
      :jobs="jobs"
      :companies="[]"
      :show-company-filter="false"
      grid-class="grid-cols-1 md:grid-cols-2"
      @update:search-query="searchQuery = $event"
      @update:selected-job-id="selectedJobId = $event"
    />

    <!-- Kanban board -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KanbanColumn
        title="New"
        :candidates="newCandidatesList"
        :show-company="false"
        :get-job-title="getJobTitle"
        :get-company-name="() => ''"
        @update:candidates="newCandidatesList = $event"
        @candidate-moved="onCandidateMoved('Ny')"
      />

      <KanbanColumn
        title="Interview"
        :candidates="interviewCandidatesList"
        :show-company="false"
        :get-job-title="getJobTitle"
        :get-company-name="() => ''"
        @update:candidates="interviewCandidatesList = $event"
        @candidate-moved="onCandidateMoved('Intervju')"
      />

      <KanbanColumn
        title="Hired"
        :candidates="hiredCandidatesList"
        :show-company="false"
        :get-job-title="getJobTitle"
        :get-company-name="() => ''"
        @update:candidates="hiredCandidatesList = $event"
        @candidate-moved="onCandidateMoved('Anställd')"
      />
    </div>
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

const jobs = ref([])
const allCandidates = ref([])
const newCandidatesList = ref([])
const interviewCandidatesList = ref([])
const hiredCandidatesList = ref([])
const searchQuery = ref('')
const selectedJobId = ref('')
const isLoading = ref(true)
const userId = ref(null)

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

    // Build jobs query - only customer's jobs
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('customer_id', userId.value)

    if (jobsError) throw jobsError
    jobs.value = jobsData || []

    // Build candidates query - only customer's candidates
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, name, linkedin_url, job_id, stage')
      .eq('customer_id', userId.value)

    if (candidatesError) throw candidatesError
    allCandidates.value = candidatesData || []

    // Initial distribution
    filterAndSortCandidates()
  } catch (err) {
    console.error('Error loading data:', err)
  } finally {
    isLoading.value = false
  }
})

// Watch for filter changes
watch([searchQuery, selectedJobId], () => {
  filterAndSortCandidates()
})

const filterAndSortCandidates = () => {
  const filtered = allCandidates.value.filter((candidate) => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesJob = !selectedJobId.value || candidate.job_id === selectedJobId.value
    return matchesSearch && matchesJob
  })

  newCandidatesList.value = filtered.filter((c) => c.stage === 'Ny')
  interviewCandidatesList.value = filtered.filter((c) => c.stage === 'Intervju')
  hiredCandidatesList.value = filtered.filter((c) => c.stage === 'Anställd')
}

const getJobTitle = (jobId) => {
  const job = jobs.value.find((j) => j.id === jobId)
  return job ? job.title : 'Unknown job'
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
</script>
