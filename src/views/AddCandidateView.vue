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
          <FormSelect
            v-if="isAdmin"
            id="companyId"
            label="Company"
            :model-value="selectedCompanyId"
            placeholder="Select a company"
            :options="companies.map(c => ({ id: c.id, label: c.company_name }))"
            required
            :warning-text="companies.length === 0 ? 'No companies found. Create at least one customer account first.' : ''"
            :show-warning="companies.length === 0"
            @update:model-value="(value) => { selectedCompanyId = value; handleCompanyChange() }"
          />

          <!-- Name field -->
          <FormInput
            id="name"
            label="Name"
            v-model="name"
            type="text"
            placeholder="e.g., John Doe"
            required
          />

          <!-- Email field -->
          <FormInput
            id="email"
            label="Email"
            v-model="email"
            type="email"
            placeholder="john@example.com"
            required
          />

          <!-- Phone field -->
          <FormInput
            id="phone"
            label="Phone"
            v-model="phone"
            type="tel"
            placeholder="+46701234567"
            required
          />

          <!-- LinkedIn URL field -->
          <FormInput
            id="linkedinUrl"
            label="LinkedIn URL"
            v-model="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/johndoe"
            required
          />

          <!-- Job dropdown -->
          <FormSelect
            id="jobId"
            label="Job"
            :model-value="jobId"
            placeholder="Select a job"
            :options="availableJobs.map(j => ({ id: j.id, label: j.title }))"
            required
            :warning-text="availableJobs.length === 0 && selectedCompanyId ? 'This company has no jobs yet.' + (isAdmin ? ' Go to the jobs page to create one.' : '') : ''"
            :show-warning="availableJobs.length === 0 && selectedCompanyId"
            :helper-text="isAdmin && !selectedCompanyId ? 'Select a company first to see available jobs.' : (!isAdmin && availableJobs.length === 0 ? 'Create a job first.' : '')"
            @update:model-value="(value) => { jobId = value }"
          />

          <!-- CV Upload Component -->
          <CVUploadField
            ref="cvUploadComponent"
            label="Upload CV (PDF)"
            :max-size-m-b="10"
            help-text="Max 10MB PDF file"
            @file-selected="handleCVFileSelected"
          />

          <!-- Success message -->
          <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-green-700 text-sm">{{ successMessage }}</p>
          </div>

          <!-- Error message component -->
          <ErrorAlert :message="error" />

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
import FormInput from '../components/FormInput.vue'
import FormSelect from '../components/FormSelect.vue'
import CVUploadField from '../components/CVUploadField.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

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
const cvUploadComponent = ref(null)
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

const handleCVFileSelected = (event) => {
  // This is called when file is selected in CVUploadField component
  // The component handles validation internally
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
    // Get selected file from component
    const selectedFile = cvUploadComponent.value?.getSelectedFile()

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
    if (selectedFile) {
      try {
        resumeUrl = await uploadCVToStorage(selectedFile, candidateCustomerId)
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
    cvUploadComponent.value?.clearFile()
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
