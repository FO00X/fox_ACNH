<template>
  <div :class="baseClasses" @click="$emit('click')">
    <!-- 便签钉 -->
    <div v-if="!note.is_fulfilled" class="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-gray-400 rounded-t-full shadow-md"></div>
    
    <!-- 便签纸褶皱效果 -->
    <div class="absolute inset-0 rounded-lg border border-white/30 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
    
    <!-- 便签内容 -->
    <div class="font-semibold text-sm mb-1 break-words relative z-10">
      <span 
        class="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
        @click.stop="emit('item-click', note)"
      >
        {{ note.item_name }}
      </span>
      <span v-if="note.quantity > 1"> ×{{ note.quantity }}</span>
    </div>
    <p class="text-[11px] text-gray-600 mb-1 truncate relative z-10">
      {{ note.ownerName }} · {{ note.ownerIsland }}
    </p>
    <p class="text-[10px] text-gray-500 relative z-10">
      {{ note.item_type === 'material' ? '材料' : note.item_type === 'furniture' ? '家具' : '其他' }}
    </p>
    <div class="mt-2 flex items-center justify-between text-[11px] relative z-10">
      <span v-if="note.is_fulfilled" class="text-green-700 flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
        <Icon icon="mdi:check-circle" class="w-3.5 h-3.5" />
        已完成
      </span>
      <span v-else-if="note.isMine" class="text-amber-700 bg-white/50 px-2 py-1 rounded-full">未完成</span>
      <span v-else class="text-blue-700 flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
        帮 Ta 完成
        <Icon icon="mdi:hand-heart" class="w-3.5 h-3.5" />
      </span>
      <span class="text-[10px] text-gray-400 bg-white/30 px-1 rounded">
        {{ formatShortDate(note.created_at) }}
      </span>
    </div>
    
    <!-- 撕下效果 -->
    <div v-if="note.is_fulfilled" class="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-lg pointer-events-none"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  note: { type: Object, required: true }
})

const emit = defineEmits(['click', 'item-click'])

const baseClasses = computed(() => {
  const n = props.note
  const common =
    'relative rounded-lg p-3 shadow-lg cursor-pointer transition-all duration-300 border-2 tap-lift motion-pop transform-gpu'
  const byType =
    n.item_type === 'material'
      ? n.isMine
        ? 'bg-yellow-50 border-yellow-300 shadow-yellow-200/50'
        : 'bg-green-50 border-green-300 shadow-green-200/50'
      : n.item_type === 'furniture'
      ? n.isMine
        ? 'bg-orange-50 border-orange-300 shadow-orange-200/50'
        : 'bg-amber-50 border-amber-300 shadow-amber-200/50'
      : n.isMine
      ? 'bg-blue-50 border-blue-300 shadow-blue-200/50'
      : 'bg-cyan-50 border-cyan-300 shadow-cyan-200/50'
  const done = n.is_fulfilled ? 'opacity-60 line-through scale-95 rotate-1' : 'hover:scale-105 hover:shadow-xl'
  const pinned = !n.is_fulfilled ? 'before:absolute before:top-2 before:right-2 before:w-4 before:h-4 before:bg-red-400 before:rounded-full before:shadow-sm' : ''
  return [common, byType, done, pinned].join(' ')
})

const formatShortDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>