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
        <div>
          <label for="name" class="block text-sm font-medium text-neutral-900 mb-2">
            Name
          </label>
          <input
            id="name"
            v-model="form.name"
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
            v-model="form.email"
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
            v-model="form.phone"
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
            v-model="form.linkedinUrl"
            type="url"
            required
            class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="https://linkedin.com/in/johndoe"
          />
        </div>

        <!-- Current CV section -->
        <div v-if="candidate.resume_url" class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <p class="text-sm font-medium text-neutral-900 mb-2">Current CV</p>
          <a
            :href="candidate.resume_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-violet-600 hover:text-violet-700 text-sm font-medium"
          >
            Download current resume
          </a>
        </div>

        <!-- CV file upload -->
        <div>
          <label for="cvFile" class="block text-sm font-medium text-neutral-900 mb-2">
            Upload New CV (PDF) - Optional
          </label>
          <div class="flex items-center gap-2">
            <input
              id="cvFile"
              type="file"
              accept=".pdf"
              @change="handleFileChange"
              class="hidden"
              ref="fileInput"
            />
            <button
              type="button"
              @click="$refs.fileInput.click()"
              class="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-900 font-medium transition-colors"
            >
              Choose file
            </button>
            <span v-if="selectedFile" class="text-sm text-neutral-600">
              {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </span>
            <span v-else class="text-sm text-neutral-500">No new file selected</span>
          </div>
          <p class="text-xs text-neutral-500 mt-1">Leave blank to keep current CV. Max 10MB, PDF format</p>
        </div>

        <!-- Upload progress bar -->
        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="w-full bg-neutral-200 rounded-lg h-2">
          <div
            class="bg-violet-600 h-2 rounded-lg transition-all"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-3">
          <p class="text-green-700 text-sm">{{ successMessage }}</p>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>

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

const route = useRoute()
const router = useRouter()
const { userId, isAdmin } = useUserContext()

const candidate = ref(null)
const loading = ref(true)
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const selectedFile = ref(null)
const fileInput = ref(null)
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes, k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Validate file type
  if (file.type !== 'application/pdf') {
    error.value = 'Only PDF files are allowed'
    selectedFile.value = null
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size must be less than 10MB'
    selectedFile.value = null
    return
  }

  error.value = ''
  selectedFile.value = file
}

const uploadCVToStorage = async (userId) => {
  if (!selectedFile.value) {
    return null // No new CV provided
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const filename = `${userId}_${timestamp}_${randomString}.pdf`
    const filepath = `${userId}/${filename}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(filepath, selectedFile.value, {
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
    // Upload new CV if provided
    let resumeUrl = candidate.value.resume_url
    if (selectedFile.value) {
      resumeUrl = await uploadCVToStorage(userId.value)
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
