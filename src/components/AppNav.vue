<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-[#9CCC65]/30 safe-area-pb z-50">
    <div class="flex justify-around items-center h-14 max-w-lg mx-auto">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="[
          'flex flex-col items-center justify-center flex-1 py-2 min-h-[44px] transition-colors',
          isActive(link.to) ? 'text-[#558B2F]' : 'text-gray-400'
        ]"
      >
        <Icon :icon="link.icon" class="w-6 h-6" />
        <span class="text-xs mt-0.5">{{ link.label }}</span>
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
  { to: '/dashboard', label: '我的小岛', icon: 'mdi:island' },
  { to: '/turnips', label: '大头菜', icon: 'mdi:sprout' },
  { to: '/catalogue', label: '图鉴', icon: 'mdi:book-open-page-variant' }
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
