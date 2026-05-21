<template>
  <div v-if="!isLoading" class="p-6">
    <h1 class="text-3xl font-bold text-neutral-900 mb-8">Dashboard</h1>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search input -->
        <div>
          <label for="search" class="block text-sm font-medium text-neutral-900 mb-2">
            Search candidates
          </label>
          <input
            id="search"
            v-model="searchQuery"
            type="text"
            placeholder="Search by name..."
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <!-- Job filter -->
        <div>
          <label for="jobFilter" class="block text-sm font-medium text-neutral-900 mb-2">
            Filter by job
          </label>
          <select
            id="jobFilter"
            v-model="selectedJobId"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
          >
            <option value="">All jobs</option>
            <option v-for="job in jobs" :key="job.id" :value="job.id">
              {{ job.title }}
            </option>
          </select>
        </div>

        <!-- Company filter -->
        <div>
          <label for="companyFilter" class="block text-sm font-medium text-neutral-900 mb-2">
            Filter by company
          </label>
          <select
            id="companyFilter"
            v-model="selectedCompanyId"
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
          >
            <option value="">All companies</option>
            <option v-for="company in companies" :key="company.id" :value="company.id">
              {{ company.company_name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Kanban board -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Ny column -->
      <div class="bg-neutral-100 rounded-lg p-4 h-full">
        <div class="mb-4 pb-3 border-b border-neutral-300">
          <h2 class="text-xl font-bold text-black">New</h2>
          <p class="text-sm text-neutral-600">{{ newCandidatesList.length }} candidates</p>
        </div>
        <draggable
          v-model="newCandidatesList"
          item-key="id"
          group="candidates"
          class="space-y-3 min-h-[500px]"
          @end="() => onCandidateMoved('Ny')"
        >
          <template #item="{ element: candidate }">
            <div class="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 cursor-move hover:shadow-md transition-shadow">
              <h3 class="font-medium text-neutral-900 mb-2">{{ candidate.name }}</h3>
              <div class="space-y-2 text-sm">
                <p class="text-neutral-600">
                  <span class="font-medium">Job:</span> {{ getJobTitle(candidate.job_id) }}
                </p>
                <p class="text-neutral-600">
                  <span class="font-medium">Company:</span> {{ getCompanyName(candidate.customer_id) }}
                </p>
                <a
                  v-if="candidate.linkedin_url"
                  :href="candidate.linkedin_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block text-violet-600 hover:text-violet-700 hover:underline"
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Intervju column -->
      <div class="bg-neutral-100 rounded-lg p-4 h-full">
        <div class="mb-4 pb-3 border-b border-neutral-300">
          <h2 class="text-xl font-bold text-gray-900">Interview</h2>
          <p class="text-sm text-neutral-600">{{ interviewCandidatesList.length }} candidates</p>
        </div>
        <draggable
          v-model="interviewCandidatesList"
          item-key="id"
          group="candidates"
          class="space-y-3 min-h-[500px]"
          @end="() => onCandidateMoved('Intervju')"
        >
          <template #item="{ element: candidate }">
            <div class="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 cursor-move hover:shadow-md transition-shadow">
              <h3 class="font-medium text-neutral-900 mb-2">{{ candidate.name }}</h3>
              <div class="space-y-2 text-sm">
                <p class="text-neutral-600">
                  <span class="font-medium">Job:</span> {{ getJobTitle(candidate.job_id) }}
                </p>
                <p class="text-neutral-600">
                  <span class="font-medium">Company:</span> {{ getCompanyName(candidate.customer_id) }}
                </p>
                <a
                  v-if="candidate.linkedin_url"
                  :href="candidate.linkedin_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block text-violet-600 hover:text-violet-700 hover:underline"
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Anställd column -->
      <div class="bg-neutral-100 rounded-lg p-4 h-full">
        <div class="mb-4 pb-3 border-b border-neutral-300">
          <h2 class="text-xl font-bold text-gray-900">Hired</h2>
          <p class="text-sm text-neutral-600">{{ hiredCandidatesList.length }} candidates</p>
        </div>
        <draggable
          v-model="hiredCandidatesList"
          item-key="id"
          group="candidates"
          class="space-y-3 min-h-[500px]"
          @end="() => onCandidateMoved('Anställd')"
        >
          <template #item="{ element: candidate }">
            <div class="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 cursor-move hover:shadow-md transition-shadow">
              <h3 class="font-medium text-neutral-900 mb-2">{{ candidate.name }}</h3>
              <div class="space-y-2 text-sm">
                <p class="text-neutral-600">
                  <span class="font-medium">Job:</span> {{ getJobTitle(candidate.job_id) }}
                </p>
                <p class="text-neutral-600">
                  <span class="font-medium">Company:</span> {{ getCompanyName(candidate.customer_id) }}
                </p>
                <a
                  v-if="candidate.linkedin_url"
                  :href="candidate.linkedin_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block text-violet-600 hover:text-violet-700 hover:underline"
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
  <div v-else class="flex justify-center items-center h-64">
    <p class="text-neutral-600">Loading dashboard...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import { supabase } from '../lib/supabaseClient'

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
</script>
