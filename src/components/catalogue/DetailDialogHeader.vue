<template>
  <div class="hdr flex flex-wrap items-center justify-between gap-2 mb-4">
    <h2 class="text-xl font-bold text-[#558B2F] dark:text-[#9CCC65]">{{ title }}</h2>
       <div class="controls multi-btn flex items-center gap-1">
      <button type="button" class="btn btn-ghost btn-sm" title="加入愿望单" @click="$emit('wishlist')">
        <Icon icon="mdi:heart-plus-outline" class="w-5 h-5" />
        <span class="hidden sm:inline">加入愿望单</span>
      </button>
      <button type="button" class="btn btn-ghost btn-sm" title="标记拥有" @click="$emit('owned')">
        <Icon icon="mdi:check-circle-outline" class="w-5 h-5" />
        <span class="hidden sm:inline">标记拥有</span>
      </button>
      <button type="button" class="btn btn-ghost btn-sm btn-square" title="关闭" @click="$emit('close')">
        <Icon icon="mdi:close" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  title: { type: String, default: '' }
})
defineEmits(['close', 'wishlist', 'owned'])
</script>
