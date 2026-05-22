<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-neutral-900 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :required="required"
      @change="$emit('update:modelValue', $event.target.value)"
      class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.id" :value="option.id">
        {{ option.label }}
      </option>
    </select>
    <p v-if="warningText && showWarning" class="text-amber-600 text-sm mt-2">
      ⚠️ {{ warningText }}
    </p>
    <p v-if="helperText" class="text-xs text-neutral-500 mt-1">{{ helperText }}</p>
  </div>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  options: {
    type: Array,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  warningText: {
    type: String,
    default: ''
  },
  showWarning: {
    type: Boolean,
    default: false
  },
  helperText: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
</script>
