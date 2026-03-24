<template>
  <div
    :class="[
      'min-h-dvh flex flex-col bg-linear-to-b from-[#E8F5E9] via-[#FFF8E1] to-[#E3F2FD] dark:from-[#0B1020] dark:via-[#0B1B14] dark:to-[#0A1220]',
      isLoginPage ? 'h-dvh overflow-hidden' : 'pb-safe'
    ]"
  >
    <AppHeader v-if="authStore.isLoggedIn && !isLoginPage" />
    <main
      :class="[
        isLoginPage ? 'flex-1 w-full p-0 max-w-none overflow-hidden' : 'flex-1 overflow-auto w-full app-page',
        authStore.isLoggedIn && 'pb-20'
      ]"
    >
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppNav v-if="authStore.isLoggedIn && !isLoginPage" />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
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
.page-enter-active,
.page-leave-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: opacity 1ms linear;
  }

  .page-enter-from,
  .page-leave-to {
    transform: none;
  }
}
</style>
