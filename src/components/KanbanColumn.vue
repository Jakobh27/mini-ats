<template>
  <div class="bg-neutral-100 rounded-lg p-4 h-full">
    <div class="mb-4 pb-3 border-b border-neutral-300">
      <h2 class="text-xl font-bold text-black">{{ title }}</h2>
      <p class="text-sm text-neutral-600">{{ candidates.length }} candidates</p>
    </div>
    <draggable
      :model-value="candidates"
      item-key="id"
      group="candidates"
      class="space-y-3 min-h-[500px]"
      @update:model-value="$emit('update:candidates', $event)"
      @end="$emit('candidate-moved')"
    >
      <template #item="{ element: candidate }">
        <CandidateCard
          :candidate="candidate"
          :job-title="getJobTitle(candidate.job_id)"
          :company-name="showCompany ? getCompanyName(candidate.customer_id) : ''"
          :show-company="showCompany"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import CandidateCard from './CandidateCard.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  candidates: {
    type: Array,
    required: true
  },
  showCompany: {
    type: Boolean,
    default: false
  },
  getJobTitle: {
    type: Function,
    required: true
  },
  getCompanyName: {
    type: Function,
    required: true
  }
})

defineEmits(['update:candidates', 'candidate-moved'])
</script>
