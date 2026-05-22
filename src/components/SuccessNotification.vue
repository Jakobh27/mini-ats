<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      :class="[
        'fixed rounded-lg p-4 shadow-lg',
        positionClass
      ]"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <p class="text-sm font-medium text-green-700">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  },
  position: {
    type: String,
    default: 'bottom-right',
    validator: (v) => ['top-right', 'bottom-right', 'bottom-left', 'top-left'].includes(v)
  }
})

const isVisible = ref(false)

const positionClass = {
  'top-right': 'top-4 right-4 bg-green-50 border border-green-200',
  'bottom-right': 'bottom-4 right-4 bg-green-50 border border-green-200',
  'bottom-left': 'bottom-4 left-4 bg-green-50 border border-green-200',
  'top-left': 'top-4 left-4 bg-green-50 border border-green-200'
}[props.position]

watch(() => props.message, (newMessage) => {
  if (newMessage) {
    isVisible.value = true
    setTimeout(() => {
      isVisible.value = false
    }, props.duration)
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
