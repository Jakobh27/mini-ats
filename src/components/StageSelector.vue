<template>
  <div>
    <h2 class="text-lg font-bold text-neutral-900 mb-4">{{ title }}</h2>
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="stage in stages"
        :key="stage.value"
        @click="$emit('stage-selected', stage.value)"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors',
          isActive(stage.value)
            ? `${stage.activeClass} text-white`
            : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
        ]"
      >
        {{ stage.label }}
      </button>
    </div>
    <p v-if="successMessage" class="text-green-600 text-sm mt-2">
      {{ successMessage }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  currentStage: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Change Stage'
  },
  stages: {
    type: Array,
    default: () => [
      { value: 'Ny', label: 'New', activeClass: 'bg-blue-600' },
      { value: 'Intervju', label: 'Interview', activeClass: 'bg-amber-600' },
      { value: 'Anställd', label: 'Hired', activeClass: 'bg-green-600' }
    ]
  },
  successMessage: {
    type: String,
    default: ''
  }
})

defineEmits(['stage-selected'])

const isActive = (stage) => {
  return stage === defineProps().currentStage
}
</script>
