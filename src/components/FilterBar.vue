<template>
  <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
    <div :class="['grid gap-4', gridClass]">
      <!-- Search input -->
      <div>
        <label for="search" class="block text-sm font-medium text-neutral-900 mb-2">
          {{ searchLabel }}
        </label>
        <input
          id="search"
          :value="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          @input="$emit('update:searchQuery', $event.target.value)"
          class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      <!-- Job filter -->
      <div>
        <label for="jobFilter" class="block text-sm font-medium text-neutral-900 mb-2">
          {{ jobLabel }}
        </label>
        <select
          id="jobFilter"
          :value="selectedJobId"
          @change="$emit('update:selectedJobId', $event.target.value)"
          class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
        >
          <option value="">All jobs</option>
          <option v-for="job in jobs" :key="job.id" :value="job.id">
            {{ job.title }}
          </option>
        </select>
      </div>

      <!-- Company filter (optional) -->
      <div v-if="showCompanyFilter">
        <label for="companyFilter" class="block text-sm font-medium text-neutral-900 mb-2">
          {{ companyLabel }}
        </label>
        <select
          id="companyFilter"
          :value="selectedCompanyId"
          @change="$emit('update:selectedCompanyId', $event.target.value)"
          class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
        >
          <option value="">All companies</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">
            {{ company.company_name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  selectedJobId: {
    type: String,
    default: ''
  },
  selectedCompanyId: {
    type: String,
    default: ''
  },
  jobs: {
    type: Array,
    default: () => []
  },
  companies: {
    type: Array,
    default: () => []
  },
  showCompanyFilter: {
    type: Boolean,
    default: false
  },
  searchLabel: {
    type: String,
    default: 'Search candidates'
  },
  searchPlaceholder: {
    type: String,
    default: 'Search by name...'
  },
  jobLabel: {
    type: String,
    default: 'Filter by job'
  },
  companyLabel: {
    type: String,
    default: 'Filter by company'
  },
  gridClass: {
    type: String,
    default: 'grid-cols-1 md:grid-cols-2'
  }
})

defineEmits(['update:searchQuery', 'update:selectedJobId', 'update:selectedCompanyId'])
</script>
