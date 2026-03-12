<template>
  <div class="min-h-screen pb-safe flex flex-col">
    <AppHeader />
    <main :class="['flex-1 overflow-auto px-4 py-4 max-w-lg mx-auto w-full', authStore.isLoggedIn && 'pb-20']">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppNav v-if="authStore.isLoggedIn" />

    <!-- 右侧抽屉侧边栏（登录后，点击头像打开） -->
    <AppSidebar v-if="authStore.isLoggedIn" />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useAuthStore } from './stores/auth'
import { useUiStore } from './stores/ui'

const authStore = useAuthStore()
const uiStore = useUiStore()
uiStore.init()
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
