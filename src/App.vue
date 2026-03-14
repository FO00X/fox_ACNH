<template>
  <div class="min-h-dvh pb-safe flex flex-col bg-gradient-to-b from-[#E8F5E9] via-[#FFF8E1] to-[#E3F2FD] dark:from-[#0B1020] dark:via-[#0B1B14] dark:to-[#0A1220]">
    <AppHeader v-if="authStore.isLoggedIn && !isLoginPage" />
    <main
      :class="[
        'flex-1 overflow-auto w-full',
        isLoginPage ? 'p-0 max-w-none' : 'app-page',
        authStore.isLoggedIn && 'pb-20'
      ]"
    >
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppNav v-if="authStore.isLoggedIn && !isLoginPage" />

    <!-- 右侧抽屉侧边栏（登录后，点击头像打开） -->
    <AppSidebar v-if="authStore.isLoggedIn && !isLoginPage" />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useAuthStore } from './stores/auth'
import { useUiStore } from './stores/ui'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()
uiStore.init()

const isLoginPage = computed(() => route.path === '/login')
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
