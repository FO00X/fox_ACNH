<template>
  <div class="notes tab flex-1">
    <textarea
      :value="modelValue"
      placeholder="给该条目添加备注"
      class="textarea textarea-bordered w-full h-32 rounded-2xl text-base"
      @input="$emit('update:modelValue', ($event.target).value)"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' }
})
defineEmits(['update:modelValue'])
</script>
