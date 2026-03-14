<template>
  <div
    class="min-h-dvh flex items-center justify-center p-4 sm:pt-[12vh] bg-cover bg-center bg-no-repeat bg-[#E8F5E9] dark:bg-[#0B1020]"
    :style="{ backgroundImage: `url(${bgImage})` }"
  >
    <div class="w-full max-w-sm">
      <div
        class="login-card rounded-3xl p-6 sm:p-7 border border-base-300/80 bg-base-100/70 backdrop-blur-md shadow-2xl shadow-black/10"
      >
        <!-- 标题栏 -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2.5">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-[#7CB342]/20">
              <Icon icon="mdi:leaf" class="w-6 h-6 text-[#558B2F]" />
            </div>
            <span class="font-bold text-lg tracking-tight text-base-content">欢迎回来！</span>
          </div>
          <button
            class="btn btn-ghost min-h-(--touch-min) h-11 w-11 rounded-xl transition-transform hover:scale-110 active:scale-95"
            :title="uiStore.isDark ? '切换亮色' : '切换暗色'"
            @click="uiStore.toggleTheme"
          >
            <Icon :icon="uiStore.isDark ? 'mdi:weather-night' : 'mdi:white-balance-sunny'" class="w-5 h-5" />
          </button>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="submit" class="space-y-4">
          <!-- 邮箱（validator 风格） -->
          <label class="input validator">
            <Icon icon="mdi:email-outline" class="validator-icon" />
            <input
              v-model.trim="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="请输入邮箱"
              required
              @focus="showEmailHint = true"
              @blur="showEmailHint = false"
            />
          </label>

          <!-- 密码（validator 风格） -->
          <label class="input validator">
            <Icon icon="mdi:key-outline" class="validator-icon" />
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
              required
            />
            <button
              type="button"
              class="validator-toggle"
              :title="showPw ? '隐藏密码' : '显示密码'"
              @click.prevent="showPw = !showPw"
            >
              <Icon :icon="showPw ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-5 h-5 opacity-60" />
            </button>
          </label>

            <Transition name="message-slide">
              <div v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                {{ error }}
              </div>
            </Transition>
            <Transition name="message-slide">
              <div v-if="message" class="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
                {{ message }}
              </div>
            </Transition>

            <button
              type="submit"
              class="btn w-full h-12 min-h-[48px] rounded-xl bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 font-medium shadow-lg shadow-[#7CB342]/25 hover:shadow-[#558B2F]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              :disabled="loading || !email || !password"
            >
              <span v-if="loading" class="inline-flex items-center gap-2">
                <span class="loading loading-spinner loading-sm" />
                处理中...
              </span>
              <span v-else>登录</span>
            </button>
          </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()

const bgImage = computed(() => {
  const base = import.meta.env.BASE_URL
  const name = uiStore.isDark ? 'dark_login.jpg' : 'light_login.jpg'
  return `${base}${name}`
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')
const showPw = ref(false)
const showEmailHint = ref(false)

function getRedirectTarget() {
  const r = route.query.redirect
  if (!r || typeof r !== 'string') return '/dashboard'
  const p = r.trim()
  if (!p.startsWith('/') || p.startsWith('//') || p === '/login') return '/dashboard'
  if (/^\/\w+:/.test(p)) return '/dashboard'
  return p
}

async function submit() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    const target = getRedirectTarget()
    await router.push(target)
  } catch (e) {
    error.value = e?.message || '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  animation: card-in 0.4s ease-out;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* validator 风格输入框：label 作为容器，左侧图标 + input */
.input.validator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  height: 3.25rem;
  padding: 0 1rem;
  border: 1px solid oklch(var(--b3));
  border-radius: 0.75rem;
  background: oklch(var(--b1));
  transition: box-shadow 0.2s, border-color 0.2s;
}
.input.validator:focus-within {
  outline: none;
  border-color: #7CB342;
  box-shadow: 0 0 0 2px rgb(124 179 66 / 0.25);
}
.input.validator input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: oklch(var(--bc));
}
.input.validator input::placeholder {
  color: oklch(var(--bc) / 0.5);
}
.input.validator input:focus {
  outline: none;
}
.validator-icon {
  width: 1.25em;
  height: 1.25em;
  flex-shrink: 0;
  opacity: 0.5;
  color: oklch(var(--bc));
}
.validator-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  color: oklch(var(--bc));
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}
.validator-toggle:hover {
  opacity: 1;
}
.validator-toggle:active {
  transform: scale(0.95);
}
.validator-hint {
  margin-top: 0.375rem;
  margin-bottom: 0;
  padding-left: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: oklch(var(--bc) / 0.65);
}
.validator-hint.hidden {
  display: none;
}

/* 错误/成功消息滑入 */
.message-slide-enter-active,
.message-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.message-slide-enter-from,
.message-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
