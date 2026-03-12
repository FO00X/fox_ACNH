<template>
  <div class="py-6">
    <div v-if="authStore.isLoggedIn" class="mb-4">
      <RouterLink to="/dashboard" class="btn w-full bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 acnh-btn">
        进入我的小岛 →
      </RouterLink>
    </div>
    <div class="acnh-card bg-white/95 p-6">
      <h1 class="text-2xl font-bold text-[#558B2F] mb-3 text-center flex items-center justify-center gap-2">
        <Icon icon="mdi:palm-tree" class="w-7 h-7" />
        欢迎
      </h1>
      <p class="text-gray-600 text-sm mb-6 text-center">
        记录材料、家具、岛建、居民、图鉴，与好友互相帮忙
      </p>

      <div v-show="!authStore.isLoggedIn" class="space-y-3 mb-6">
        <div class="grid grid-cols-2 gap-3">
        <RouterLink to="/calendar" class="block p-3 rounded-xl bg-[#E8F5E9]/80 border-2 border-[#9CCC65]/50 text-center">
          <Icon icon="mdi:calendar" class="w-8 h-8 text-[#558B2F] mx-auto mb-1" />
          <span class="font-semibold text-[#558B2F] text-sm">小动物日历</span>
          <p class="text-xs text-gray-600 mt-0.5">生日提醒</p>
        </RouterLink>
        <RouterLink to="/catalogue" class="block p-3 rounded-xl bg-[#E3F2FD]/80 border-2 border-[#64B5F6]/50 text-center">
          <Icon icon="mdi:book-open-page-variant" class="w-8 h-8 text-[#1976D2] mx-auto mb-1" />
          <span class="font-semibold text-[#1976D2] text-sm">全图鉴清单</span>
          <p class="text-xs text-gray-600 mt-0.5">鱼类·昆虫·海洋·化石·艺术品·小动物·家具</p>
        </RouterLink>
        </div>
        <div class="grid grid-cols-2 gap-3">
        <div class="p-3 rounded-2xl bg-[#E8F5E9] border-2 border-[#9CCC65]/50">
          <Icon icon="mdi:package-variant" class="w-8 h-8 text-[#558B2F] mb-1" />
          <h3 class="font-semibold text-[#558B2F] text-sm">材料/家具</h3>
        </div>
        <div class="p-3 rounded-2xl bg-[#FFF8E1] border-2 border-[#FFE082]/50">
          <Icon icon="mdi:island" class="w-8 h-8 text-[#F9A825] mb-1" />
          <h3 class="font-semibold text-[#F9A825] text-sm">岛建</h3>
        </div>
        <div class="p-3 rounded-2xl bg-[#E3F2FD] border-2 border-[#64B5F6]/50">
          <Icon icon="mdi:cat" class="w-8 h-8 text-[#1976D2] mb-1" />
          <h3 class="font-semibold text-[#1976D2] text-sm">居民</h3>
        </div>
        <div class="p-3 rounded-2xl bg-[#FCE4EC] border-2 border-[#F48FB1]/50">
          <Icon icon="mdi:book-open-page-variant" class="w-8 h-8 text-[#C2185B] mb-1" />
          <h3 class="font-semibold text-[#C2185B] text-sm">图鉴</h3>
        </div>
        </div>
      </div>

      <RouterLink
        v-if="!authStore.isLoggedIn"
        to="/login"
        class="btn w-full bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 acnh-btn"
      >
        开始 →
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>
