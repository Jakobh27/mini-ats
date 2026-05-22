<template>
  <div v-if="message" class="bg-red-50 border border-red-200 rounded-lg p-3">
    <p class="text-red-700 text-sm">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  }
})
</script>
