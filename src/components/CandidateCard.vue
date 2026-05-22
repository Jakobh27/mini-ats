<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow group">
    <router-link
      :to="`/candidate/${candidate.id}`"
      class="block p-4"
    >
      <h3 class="font-medium text-neutral-900 mb-2 group-hover:text-violet-600">
        {{ candidate.name }}
      </h3>
      <div class="space-y-2 text-sm">
        <p class="text-neutral-600">
          <span class="font-medium">Job:</span> {{ jobTitle }}
        </p>
        <p v-if="showCompany" class="text-neutral-600">
          <span class="font-medium">Company:</span> {{ companyName }}
        </p>
      </div>
      <p class="text-xs text-violet-600 font-medium mt-3">Click for more info →</p>
    </router-link>
  </div>
</template>

<script setup>
defineProps({
  candidate: {
    type: Object,
    required: true,
    validator(obj) {
      return obj.id && obj.name && obj.job_id
    }
  },
  jobTitle: {
    type: String,
    default: 'Unknown job'
  },
  companyName: {
    type: String,
    default: ''
  },
  showCompany: {
    type: Boolean,
    default: false
  }
})
</script>
