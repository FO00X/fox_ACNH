<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-base-100/95 backdrop-blur-md border-t border-[#9CCC65]/30 safe-area-pb z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
    <div class="flex justify-around items-stretch max-w-lg mx-auto" style="min-height: var(--nav-height);">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="[
          'flex flex-col items-center justify-center flex-1 min-h-(--touch-min) py-2 transition-colors relative',
          isActive(link.to) ? 'text-[#558B2F] font-medium' : 'text-gray-400'
        ]"
      >
        <span :class="['inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors', isActive(link.to) ? 'bg-[#7CB342]/15' : '']">
          <Icon :icon="link.icon" class="w-6 h-6" />
        </span>
        <span class="text-xs mt-1">{{ link.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navLinks = [
  { to: '/', label: '广场', icon: 'mdi:palm-tree' },
  { to: '/turnips', label: '大头菜', icon: 'mdi:sprout' },
  { to: '/catalogue', label: '图鉴', icon: 'mdi:book-open-page-variant' },
  { to: '/dashboard', label: '小岛', icon: 'mdi:island' }
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
