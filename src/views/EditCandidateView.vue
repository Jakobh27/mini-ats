<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold text-neutral-900 mb-2">Edit candidate</h1>
    <p class="text-neutral-600 mb-8">Update candidate information and CV</p>

    <div v-if="loading" class="text-center py-12">
      <p class="text-neutral-600">Loading candidate...</p>
    </div>

    <div v-else-if="!candidate" class="text-center py-12">
      <p class="text-red-600">Candidate not found or access denied</p>
      <router-link to="/" class="text-violet-600 hover:text-violet-700 mt-4 inline-block">
        Back to dashboard
      </router-link>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
      <form @submit.prevent="handleUpdateCandidate" class="space-y-6">
        <!-- Name field -->
        <FormInput
          id="name"
          label="Name"
          v-model="form.name"
          type="text"
          placeholder="e.g., John Doe"
          required
        />

        <!-- Email field -->
        <FormInput
          id="email"
          label="Email"
          v-model="form.email"
          type="email"
          placeholder="john@example.com"
          required
        />

        <!-- Phone field -->
        <FormInput
          id="phone"
          label="Phone"
          v-model="form.phone"
          type="tel"
          placeholder="+46701234567"
          required
        />

        <!-- LinkedIn URL field -->
        <FormInput
          id="linkedinUrl"
          label="LinkedIn URL"
          v-model="form.linkedinUrl"
          type="url"
          placeholder="https://linkedin.com/in/johndoe"
          required
        />

        <!-- CV Upload Component -->
        <CVUploadField
          ref="cvUploadComponent"
          label="Upload New CV (PDF) - Optional"
          :current-file-url="candidate?.resume_url"
          :max-size-m-b="10"
          help-text="Leave blank to keep current CV. Max 10MB, PDF format"
        />

        <!-- Success message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-3">
          <p class="text-green-700 text-sm">{{ successMessage }}</p>
        </div>

        <!-- Error message component -->
        <ErrorAlert :message="error" />

        <!-- Buttons -->
        <div class="flex gap-2 pt-4">
          <button
            type="submit"
            :disabled="isLoading"
            class="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-400 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {{ isLoading ? 'Updating...' : 'Update candidate' }}
          </button>
          <router-link
            :to="`/candidate/${candidate.id}`"
            class="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-900 font-medium transition-colors text-center"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { useUserContext } from '../composables/useUserContext'
import FormInput from '../components/FormInput.vue'
import CVUploadField from '../components/CVUploadField.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

const route = useRoute()
const router = useRouter()
const { userId, isAdmin } = useUserContext()

const candidate = ref(null)
const loading = ref(true)
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const cvUploadComponent = ref(null)
const uploadProgress = ref(0)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  linkedinUrl: ''
})

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
    const { data, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()

    if (fetchError || !data) {
      loading.value = false
      return
    }

    // Check access: user must be admin or the candidate's customer
    if (!isAdmin.value && data.customer_id !== userId.value) {
      loading.value = false
      return
    }

    candidate.value = data
    form.name = data.name
    form.email = data.email
    form.phone = data.phone
    form.linkedinUrl = data.linkedin_url
    loading.value = false
  } catch (err) {
    console.error('Error loading candidate:', err)
    loading.value = false
  }
})

const uploadCVToStorage = async (file) => {
  if (!file) {
    return null // No new CV provided
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const filename = `${userId.value}_${timestamp}_${randomString}.pdf`
    const filepath = `${userId.value}/${filename}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
        }
      })

    if (uploadError) {
      error.value = `Failed to upload CV: ${uploadError.message}`
      return null
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('cvs')
      .getPublicUrl(filepath)

    uploadProgress.value = 0
    return publicUrlData.publicUrl
  } catch (err) {
    error.value = `Error uploading CV: ${err.message}`
    return null
  }
}

const handleUpdateCandidate = async () => {
  error.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // Get selected file from component (if any)
    const selectedFile = cvUploadComponent.value?.getSelectedFile()

    // Upload new CV if provided
    let resumeUrl = candidate.value.resume_url
    if (selectedFile) {
      resumeUrl = await uploadCVToStorage(selectedFile)
      if (!resumeUrl) {
        isLoading.value = false
        return
      }
    }

    // Update candidate in database
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        linkedin_url: form.linkedinUrl,
        resume_url: resumeUrl
      })
      .eq('id', candidate.value.id)

    if (updateError) {
      error.value = updateError.message
      isLoading.value = false
      return
    }

    successMessage.value = 'Candidate updated successfully!'
    isLoading.value = false

    // Redirect to candidate detail view after 1 second
    setTimeout(() => {
      router.push(`/candidate/${candidate.value.id}`)
    }, 1000)
  } catch (err) {
    error.value = 'An unexpected error occurred'
    isLoading.value = false
  }
}
</script>
