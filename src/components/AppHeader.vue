<template>
  <header class="sticky top-0 z-40 bg-linear-to-r from-[#7CB342] to-[#8BC34A] shadow-md border-b-2 border-[#558B2F]/50 safe-area-pt">
    <div class="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
      <RouterLink to="/" class="flex items-center gap-2 active:opacity-80">
        <Icon icon="mdi:leaf" class="w-6 h-6 text-white" />
        <span class="text-base font-bold text-white">动森小岛</span>
      </RouterLink>

      <div class="flex items-center gap-2">
        <template v-if="authStore.isLoggedIn">
          <button
            class="btn btn-ghost btn-sm text-white px-2 py-1 min-h-0 h-9 w-9 rounded-full"
            :title="authStore.profile?.display_name || '账户'"
            @click="uiStore.openSidebar"
          >
            <template v-if="authStore.profile?.avatar_url">
              <img :src="authStore.profile.avatar_url" alt="avatar" class="w-8 h-8 rounded-full object-cover" />
            </template>
            <template v-else>
              <Icon icon="mdi:account-circle" class="w-7 h-7" />
            </template>
          </button>
        </template>
        <template v-else>
          <RouterLink
            v-if="route.name !== 'Login'"
            to="/login"
            class="btn btn-sm bg-white text-[#558B2F] border-0 text-sm px-4 py-2 min-h-0 h-8"
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
