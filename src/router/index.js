import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/catalogue',
    name: 'Catalogue',
    component: () => import('../views/CatalogueView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/catalogue/:category/:itemId',
    name: 'CatalogueDetail',
    component: () => import('../views/CatalogueDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../views/CalendarView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/turnips',
    name: 'Turnips',
    component: () => import('../views/TurnipView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/design-codes',
    name: 'DesignCodes',
    component: () => import('../views/DesignCodeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/** 校验 redirect 为站内路径，防止开放重定向 */
function isValidRedirect(path) {
  if (!path || typeof path !== 'string') return false
  const p = path.trim()
  if (!p.startsWith('/') || p.startsWith('//')) return false
  if (/^\/\w+:/.test(p)) return false // 禁止 javascript: 等协议
  return true
}

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  // 刷新或首次进入时先确保 auth 已从 storage 恢复，再判断是否跳登录
  await authStore.init()

  const isPublic = to.meta.requiresAuth === false

  // 已登录用户访问登录页 → 重定向到目标页或首页
  if (to.name === 'Login' && authStore.user) {
    const redirect = to.query.redirect
    next(isValidRedirect(redirect) ? redirect : { name: 'Dashboard' })
    return
  }

  // 未登录访问需认证页面 → 跳转登录并携带 redirect
  if (!isPublic && !authStore.user) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
