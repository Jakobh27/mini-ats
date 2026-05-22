<template>
  <div>
    <label for="cvFile" class="block text-sm font-medium text-neutral-900 mb-2">
      {{ label }}
    </label>
    
    <div v-if="currentFileUrl && showCurrentFile" class="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
      <p class="text-sm font-medium text-neutral-900 mb-2">Current file</p>
      <a
        :href="currentFileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-violet-600 hover:text-violet-700 text-sm font-medium"
      >
        Download current file
      </a>
    </div>

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
        @click="$refs.fileInput?.click()"
        class="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-neutral-900 font-medium transition-colors"
      >
        {{ selectedFile ? 'Change file' : 'Choose file' }}
      </button>
      <span v-if="selectedFile" class="text-sm text-neutral-600">
        {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </span>
      <span v-else class="text-sm text-neutral-500">No new file selected</span>
    </div>

    <p class="text-xs text-neutral-500 mt-1">{{ helpText }}</p>

    <!-- Upload progress bar -->
    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="w-full bg-neutral-200 rounded-lg h-2 mt-4">
      <div
        class="bg-violet-600 h-2 rounded-lg transition-all"
        :style="{ width: uploadProgress + '%' }"
      ></div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
      <p class="text-red-700 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: 'Upload CV (PDF)'
  },
  currentFileUrl: {
    type: String,
    default: ''
  },
  showCurrentFile: {
    type: Boolean,
    default: true
  },
  maxSizeMB: {
    type: Number,
    default: 10
  },
  helpText: {
    type: String,
    default: 'Leave blank to keep current. Max 10MB, PDF format'
  }
})

const emit = defineEmits(['file-selected', 'error'])

const fileInput = ref(null)
const selectedFile = ref(null)
const error = ref('')
const uploadProgress = ref(0)

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes, k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  error.value = ''

  if (!file) {
    selectedFile.value = null
    return
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    error.value = 'Only PDF files are allowed'
    selectedFile.value = null
    emit('error', error.value)
    return
  }

  // Validate file size
  const maxBytes = props.maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    error.value = `File size must be less than ${props.maxSizeMB}MB`
    selectedFile.value = null
    emit('error', error.value)
    return
  }

  selectedFile.value = file
  emit('file-selected', { file, progress: uploadProgress })
}

// Expose methods for parent component to use
defineExpose({
  getSelectedFile: () => selectedFile.value,
  setUploadProgress: (progress) => {
    uploadProgress.value = progress
  },
  clearFile: () => {
    selectedFile.value = null
    error.value = ''
    if (fileInput.value) fileInput.value.value = ''
  },
  formatFileSize
})
</script>
