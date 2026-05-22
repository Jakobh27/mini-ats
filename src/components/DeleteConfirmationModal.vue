<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-xl font-bold text-neutral-900 mb-2">{{ title }}</h2>
        <p class="text-neutral-600 mb-6">
          <slot>{{ message }}</slot>
        </p>

        <div class="flex gap-3">
          <button
            @click="$emit('confirm')"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
          >
            {{ isLoading ? 'Deleting...' : 'Delete' }}
          </button>
          <button
            @click="$emit('cancel')"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 border border-neutral-300 text-neutral-900 font-medium rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Delete item?'
  },
  message: {
    type: String,
    default: 'This action cannot be undone.'
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['confirm', 'cancel'])
</script>
