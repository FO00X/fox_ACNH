<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-base-100/92 backdrop-blur-md border-t border-[#9CCC65]/30 safe-area-pb z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
    <div class="flex justify-around items-stretch max-w-lg mx-auto" style="min-height: var(--nav-height);">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="[
          'flex flex-col items-center justify-center flex-1 min-h-(--touch-min) py-2 transition-colors relative tap-lift',
          isActive(link.to) ? 'text-[#558B2F] font-medium' : 'text-gray-400'
        ]"
      >
        <span :class="['inline-flex items-center justify-center w-9 h-9 xs:w-10 xs:h-10 rounded-xl transition-all', isActive(link.to) ? 'bg-[#7CB342]/15 scale-105' : '']">
          <Icon :icon="link.icon" class="w-5 h-5 xs:w-6 xs:h-6" />
        </span>
        <span class="text-xs xs:text-xs mt-1">{{ link.label }}</span>
        <span
          :class="[
            'absolute top-0 left-1/2 h-0.5 w-6 xs:w-8 -translate-x-1/2 rounded-full transition-opacity',
            isActive(link.to) ? 'opacity-100 bg-[#558B2F]' : 'opacity-0'
          ]"
        ></span>
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
  { to: '/design-codes', label: '设计码', icon: 'mdi:palette' },
  { to: '/chat', label: '聊天', icon: 'mdi:chat' },
  { to: '/catalogue', label: '图鉴', icon: 'mdi:book-open-page-variant' },
  { to: '/dashboard', label: '小岛', icon: 'mdi:island' }
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
