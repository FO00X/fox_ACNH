<template>
  <header class="sticky top-0 z-40 bg-linear-to-r from-[#7CB342] to-[#8BC34A] shadow-md border-b-2 border-[#558B2F]/50 safe-area-pt">
    <div class="flex items-center justify-between min-h-(--header-height) h-14 px-4 max-w-lg mx-auto touch-row">
      <RouterLink to="/" class="flex items-center gap-2 active:opacity-80 min-h-(--touch-min) -ml-1 pl-1">
        <Icon icon="mdi:leaf" class="w-7 h-7 text-white shrink-0" />
        <span class="text-base font-bold text-white">动森小岛</span>
      </RouterLink>

      <div class="flex items-center gap-1">
        <template v-if="authStore.isLoggedIn">
          <button
            class="btn btn-ghost text-white min-h-(--touch-min) h-10 w-10 rounded-full p-0 flex items-center justify-center"
            :title="authStore.profile?.display_name || '账户'"
            @click="uiStore.openSidebar"
          >
            <template v-if="authStore.profile?.avatar_url">
              <img :src="authStore.profile.avatar_url" alt="avatar" class="w-9 h-9 rounded-full object-cover" />
            </template>
            <template v-else>
              <Icon icon="mdi:account-circle" class="w-8 h-8" />
            </template>
          </button>
        </template>
        <template v-else>
          <RouterLink
            v-if="route.name !== 'Login'"
            :to="{ path: '/login', query: { redirect: route.fullPath } }"
            class="btn bg-white text-[#558B2F] border-0 text-sm px-4 min-h-(--touch-min) h-10"
          >
            登录
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
  </template>
<script setup>
import { Icon } from '@iconify/vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()
</script>
