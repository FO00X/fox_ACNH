<template>
  <Teleport to="body">
    <div v-if="uiStore.sidebarOpen" class="fixed inset-0 z-60">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px]" @click="uiStore.closeSidebar"></div>

      <!-- 抽屉面板：移动端全宽感，大触控区 -->
      <div
        class="absolute right-0 top-0 h-full w-[min(320px,92vw)] max-w-[92vw] bg-base-100 shadow-2xl border-l border-base-300 safe-area-pr"
      >
        <div class="min-h-(--touch-min) flex items-center justify-between px-4 border-b border-base-300">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:leaf" class="w-5 h-5 text-[#558B2F]" />
            <span class="font-semibold">菜单</span>
          </div>
          <button class="btn btn-ghost min-h-(--touch-min) h-10 w-10 rounded-full p-0 flex items-center justify-center" @click="uiStore.closeSidebar" aria-label="close">
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 space-y-4 overflow-auto h-[calc(100%-3.5rem)]">
          <!-- 用户信息 -->
          <div class="rounded-2xl bg-base-200/50 p-3 border border-base-300">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-base-100 border border-base-300 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="authStore.profile?.avatar_url" :src="authStore.profile.avatar_url" alt="avatar" class="w-full h-full object-cover" />
                <Icon v-else icon="mdi:account-circle" class="w-9 h-9 text-base-content/60" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-semibold truncate">{{ authStore.profile?.display_name || '岛民' }}</p>
                <p class="text-xs text-base-content/60 truncate" :title="authStore.user?.email">{{ authStore.user?.email }}</p>
              </div>
            </div>
          </div>

          <!-- 主题切换 -->
          <button
            class="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-(--touch-min) rounded-2xl border border-base-300 bg-base-100 hover:bg-base-200/60 active:scale-[0.99] transition-all"
            @click="uiStore.toggleTheme"
          >
            <span class="flex items-center gap-2 text-sm">
              <Icon :icon="uiStore.isDark ? 'mdi:weather-night' : 'mdi:white-balance-sunny'" class="w-5 h-5" />
              {{ uiStore.isDark ? '暗色模式' : '亮色模式' }}
            </span>
            <span class="text-xs text-base-content/60">点击切换</span>
          </button>

          <!-- 入口 -->
          <div>
            <p class="text-xs text-base-content/60 mb-2 px-1">功能</p>
            <nav class="space-y-1">
              <RouterLink
                v-for="link in sideLinks"
                :key="link.to"
                :to="link.to"
                :class="[
                  'flex items-center gap-3 px-4 py-3 min-h-(--touch-min) rounded-2xl text-sm transition-colors',
                  isActive(link.to) ? 'bg-[#7CB342] text-white' : 'hover:bg-base-200/60 active:scale-[0.99]'
                ]"
                @click="uiStore.closeSidebar"
              >
                <Icon :icon="link.icon" class="w-5 h-5 shrink-0" />
                {{ link.label }}
              </RouterLink>
            </nav>
          </div>

          <div class="pt-2 border-t border-base-300">
            <button
              class="flex items-center gap-3 w-full px-4 py-3 min-h-(--touch-min) rounded-2xl text-sm text-base-content/70 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 transition-colors"
              @click="signOut"
            >
              <Icon icon="mdi:logout" class="w-5 h-5 shrink-0" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const sideLinks = [
  { to: '/', label: '首页', icon: 'mdi:palm-tree' },
  { to: '/dashboard', label: '我的小岛', icon: 'mdi:island' },
  { to: '/calendar', label: '日历', icon: 'mdi:calendar' },
  { to: '/catalogue', label: '图鉴', icon: 'mdi:book-open-page-variant' },
  { to: '/turnips', label: '大头菜', icon: 'mdi:sprout' },
  { to: '/board', label: '看板', icon: 'mdi:pin' }
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}

async function signOut() {
  await authStore.signOut()
  uiStore.closeSidebar()
  router.push('/login')
}
</script>
