<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="isLoadingContext" class="flex justify-center items-center h-64">
      <p class="text-neutral-600">Loading...</p>
    </div>

    <div v-else>
      <h1 class="text-3xl font-bold text-neutral-900 mb-2">Add a new candidate</h1>
      <p class="text-neutral-600 mb-8">Add candidates to your job openings</p>

      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <form @submit.prevent="handleAddCandidate" class="space-y-6">
          <!-- Company selector (only for admins) -->
          <div v-if="isAdmin">
            <label for="companyId" class="block text-sm font-medium text-neutral-900 mb-2">
              Company
            </label>
            <select
              id="companyId"
              v-model="selectedCompanyId"
              required
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
              @change="handleCompanyChange"
            >
              <option value="" disabled>Select a company</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">
                {{ company.company_name }}
              </option>
            </select>

            <p v-if="companies.length === 0" class="text-amber-600 text-sm mt-2">
              ⚠️ No companies found. Create at least one customer account first.
            </p>
          </div>

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
              placeholder="john@example.com"
            />
          </div>

          <!-- Phone field -->
          <div>
            <label for="phone" class="block text-sm font-medium text-neutral-900 mb-2">
              Phone
            </label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              required
              class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="+46701234567"
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
              <option v-for="job in availableJobs" :key="job.id" :value="job.id">
                {{ job.title }}
              </option>
            </select>

            <!-- Warning if no jobs available -->
            <p v-if="availableJobs.length === 0 && selectedCompanyId" class="text-amber-600 text-sm mt-2">
              ⚠️ This company has no jobs yet.
              <span v-if="isAdmin"> Go to the jobs page to create one.</span>
            </p>

            <p v-if="isAdmin && !selectedCompanyId" class="text-neutral-500 text-sm mt-2">
              Select a company first to see available jobs.
            </p>

            <p v-if="!isAdmin && availableJobs.length === 0" class="text-amber-600 text-sm mt-2">
              ⚠️ You don't have any jobs yet.
              <router-link to="/create-job" class="underline">Create a job first.</router-link>
            </p>
          </div>

          <!-- CV file upload -->
          <div>
            <label for="cvFile" class="block text-sm font-medium text-neutral-900 mb-2">
              Upload CV (PDF)
            </label>
            <div class="relative">
              <input
                id="cvFile"
                ref="fileInput"
                type="file"
                accept=".pdf"
                class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                @change="handleFileChange"
              />
              <p v-if="selectedFile" class="text-sm text-green-600 mt-2">
                ✓ {{ selectedFile.name }} selected ({{ formatFileSize(selectedFile.size) }})
              </p>
            </div>
            <p class="text-xs text-neutral-500 mt-1">Max 10MB PDF file</p>
          </div>

          <!-- Upload progress -->
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-blue-700 text-sm mb-2">Uploading CV...</p>
            <div class="w-full bg-blue-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all"
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
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
            :disabled="isLoading || availableJobs.length === 0"
            class="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-400 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {{ isLoading ? 'Adding candidate...' : 'Add candidate' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { useUserContext } from '../composables/useUserContext'

const router = useRouter()
const { userId, isAdmin, loading: isLoadingContext } = useUserContext()

const name = ref('')
const email = ref('')
const phone = ref('')
const linkedinUrl = ref('')
const jobId = ref('')
const selectedCompanyId = ref('')
const companies = ref([])
const allJobs = ref([])
const availableJobsList = ref([])
const error = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const fileInput = ref(null)
const selectedFile = ref(null)
const uploadProgress = ref(0)

// Computed property to show available jobs based on selected company
const availableJobs = computed(() => {
  if (isAdmin.value && selectedCompanyId.value) {
    return allJobs.value.filter(job => job.customer_id === selectedCompanyId.value)
  }
  if (!isAdmin.value) {
    return availableJobsList.value
  }
  return []
})

onMounted(async () => {
  try {
    // Wait for composable to finish loading user context
    while (isLoadingContext.value) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    if (!userId.value) {
      error.value = 'User not authenticated'
      return
    }

    // If admin: load all companies and all jobs
    if (isAdmin.value) {
      // Load all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('profiles')
        .select('id, company_name')
        .eq('role', 'customer')

      if (companiesError) {
        error.value = `Could not load companies: ${companiesError.message}`
        console.error('Companies error:', companiesError)
        return
      }
      
      console.log('Companies loaded:', companiesData)
      companies.value = companiesData || []

      // Load all jobs
      const { data: allJobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, customer_id')

      if (jobsError) {
        error.value = `Could not load jobs: ${jobsError.message}`
        return
      }
      allJobs.value = allJobsData || []
    } else {
      // If customer: load only their own jobs
      const { data: customerJobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, customer_id')
        .eq('customer_id', userId.value)

      if (jobsError) {
        error.value = `Could not load jobs: ${jobsError.message}`
        return
      }
      availableJobsList.value = customerJobsData || []
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    console.error('Error loading data:', err)
  }
})

const handleCompanyChange = () => {
  // Reset job selection when company changes
  jobId.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) {
    selectedFile.value = null
    return
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    error.value = 'Only PDF files are allowed'
    selectedFile.value = null
    fileInput.value.value = ''
    return
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = `File size must be less than 10MB (current: ${formatFileSize(file.size)})`
    selectedFile.value = null
    fileInput.value.value = ''
    return
  }

  error.value = ''
  selectedFile.value = file
}

const uploadCVToStorage = async (file, customerId) => {
  try {
    const fileExt = 'pdf'
    const fileName = `${customerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${customerId}/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
        }
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (err) {
    console.error('CV upload error:', err)
    throw err
  }
}

const handleAddCandidate = async () => {
  error.value = ''
  successMessage.value = ''
  isLoading.value = true
  uploadProgress.value = 0

  try {
    // Determine which customer owns this candidate
    let candidateCustomerId = userId.value

    if (isAdmin.value) {
      // Admin must have selected a company
      if (!selectedCompanyId.value) {
        error.value = 'Please select a company'
        isLoading.value = false
        return
      }
      candidateCustomerId = selectedCompanyId.value
    }

    // Verify the selected job belongs to the selected/current customer
    const selectedJob = availableJobs.value.find(j => j.id === jobId.value)
    if (!selectedJob) {
      error.value = 'Invalid job selection'
      isLoading.value = false
      return
    }

    let resumeUrl = null

    // Upload CV if provided
    if (selectedFile.value) {
      try {
        resumeUrl = await uploadCVToStorage(selectedFile.value, candidateCustomerId)
      } catch (uploadErr) {
        error.value = uploadErr.message
        isLoading.value = false
        uploadProgress.value = 0
        return
      }
    }

    // Create candidate in database
    const { error: insertError } = await supabase
      .from('candidates')
      .insert([
        {
          name: name.value,
          email: email.value,
          phone: phone.value,
          linkedin_url: linkedinUrl.value,
          job_id: jobId.value,
          customer_id: candidateCustomerId,
          stage: 'Ny',
          resume_url: resumeUrl
        }
      ])

    if (insertError) {
      error.value = insertError.message
      isLoading.value = false
      uploadProgress.value = 0
      return
    }

    // Success
    successMessage.value = 'Candidate has been added!'
    name.value = ''
    email.value = ''
    phone.value = ''
    linkedinUrl.value = ''
    jobId.value = ''
    selectedCompanyId.value = ''
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    isLoading.value = false
    uploadProgress.value = 0

    // Redirect to dashboard after 1 second
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (err) {
    error.value = 'An unexpected error occurred'
    isLoading.value = false
    uploadProgress.value = 0
    console.error('Error:', err)
  }
}
</script>
