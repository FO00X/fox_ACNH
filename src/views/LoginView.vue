<template>
  <div class="py-4">
    <div class="acnh-card bg-white/95 p-6">
      <h1 class="text-xl font-bold text-[#558B2F] mb-5 text-center flex items-center justify-center gap-2">
        <Icon :icon="isLogin ? 'mdi:leaf' : 'mdi:island'" class="w-6 h-6" />
        {{ isLogin ? '欢迎回来' : '加入' }}
      </h1>

      <form @submit.prevent="submit" class="space-y-4">
        <div class="form-control">
          <label class="label py-1"><span class="label-text text-sm">邮箱</span></label>
          <input
            v-model="email"
            type="email"
            placeholder="邮箱"
            class="input input-bordered rounded-xl h-12 text-base"
            required
          />
        </div>
        <div class="form-control">
          <label class="label py-1"><span class="label-text text-sm">密码</span></label>
          <input
            v-model="password"
            type="password"
            placeholder="密码"
            class="input input-bordered rounded-xl h-12 text-base"
            required
          />
        </div>

        <p v-if="error" class="text-error text-sm">{{ error }}</p>
        <p v-if="message" class="text-success text-sm">{{ message }}</p>

        <button
          type="submit"
          class="btn w-full bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 acnh-btn h-12"
          :disabled="loading"
        >
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-gray-600">
        <button type="button" @click="isLogin = !isLogin" class="link link-primary text-[#558B2F]">
          {{ isLogin ? '没有账号？注册' : '已有账号？登录' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function submit() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    if (isLogin.value) {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
      message.value = '注册成功！'
    }
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    error.value = e.message || '操作失败'
  } finally {
    loading.value = false
  }
}
</script>
