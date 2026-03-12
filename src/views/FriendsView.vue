<template>
  <div class="space-y-4">
    <div class="acnh-card bg-white/95 p-4">
      <h2 class="text-lg font-bold text-[#558B2F] mb-4 flex items-center gap-2">
        <Icon icon="mdi:account-group" class="w-5 h-5" />
        好友
      </h2>

      <div class="flex flex-col gap-2 mb-4">
        <input
          v-model="searchInput"
          type="text"
          placeholder="好友邮箱或昵称"
          class="input input-bordered w-full rounded-xl h-11"
        />
        <button class="btn w-full bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 acnh-btn" @click="searchAndAddFriend">
          发送好友请求
        </button>
      </div>
      <p v-if="friendError" class="text-error text-sm mb-2">{{ friendError }}</p>
      <p v-if="friendSuccess" class="text-success text-sm mb-2">{{ friendSuccess }}</p>

      <div class="space-y-3">
        <h3 class="font-semibold text-[#558B2F] text-sm">我的好友</h3>
        <div class="space-y-2">
          <div
            v-for="f in acceptedFriends"
            :key="f.id"
            class="flex items-center justify-between p-3 rounded-xl bg-[#E8F5E9]/50 border-2 border-[#9CCC65]/30"
          >
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm truncate">{{ f.display_name }}</p>
              <p class="text-xs text-gray-600 truncate">{{ f.island_name }}</p>
            </div>
            <RouterLink
              :to="{ name: 'Board', query: { friend: f.id } }"
              class="btn btn-sm bg-[#7CB342] text-white border-0 rounded-xl flex-shrink-0 ml-2 min-h-0 h-8 text-xs"
            >
              看板
            </RouterLink>
          </div>
        </div>
        <p v-if="acceptedFriends.length === 0" class="text-gray-500 text-sm py-4">还没有好友</p>
      </div>

      <div v-if="pendingReceived.length > 0" class="mt-6 space-y-2">
        <h3 class="font-semibold text-[#558B2F] text-sm">收到的请求</h3>
        <div class="space-y-2">
          <div
            v-for="req in pendingReceived"
            :key="req.friendshipId"
            class="flex flex-col gap-2 p-3 rounded-xl bg-[#FFF8E1]/50"
          >
            <span class="text-sm">{{ req.display_name }} ({{ req.island_name }}) 想加你</span>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-success flex-1 min-h-0 h-9" @click="respondRequest(req.friendshipId, 'accepted')">接受</button>
              <button class="btn btn-sm btn-ghost flex-1 min-h-0 h-9" @click="respondRequest(req.friendshipId, 'rejected')">拒绝</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()
const searchInput = ref('')
const friendError = ref('')
const friendSuccess = ref('')
const acceptedFriends = ref([])
const pendingReceived = ref([])

async function loadFriends() {
  const { data: sent } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', authStore.user.id)
  const { data: received } = await supabase
    .from('friendships')
    .select('user_id, status, id')
    .eq('friend_id', authStore.user.id)

  const acceptedIds = [
    ...(sent || []).filter(f => f.status === 'accepted').map(f => f.friend_id),
    ...(received || []).filter(f => f.status === 'accepted').map(f => f.user_id)
  ]

  if (acceptedIds.length > 0) {
    const { data } = await supabase.from('profiles').select('id, display_name, island_name').in('id', acceptedIds)
    acceptedFriends.value = data || []
  } else {
    acceptedFriends.value = []
  }

  const pendingList = (received || []).filter(f => f.status === 'pending')
  if (pendingList.length > 0) {
    const ids = pendingList.map(f => f.user_id)
    const { data } = await supabase.from('profiles').select('id, display_name, island_name').in('id', ids)
    pendingReceived.value = (data || []).map(p => ({
      ...p,
      friendshipId: pendingList.find(r => r.user_id === p.id)?.id
    }))
  } else {
    pendingReceived.value = []
  }
}

async function searchAndAddFriend() {
  friendError.value = ''
  friendSuccess.value = ''
  const q = searchInput.value.trim()
  if (!q) return

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, island_name')
    .or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq('id', authStore.user.id)

  if (!profiles || profiles.length === 0) {
    friendError.value = '未找到该用户'
    return
  }
  if (profiles.length > 1) {
    friendError.value = '找到多个，请用邮箱精确添加'
    return
  }

  const target = profiles[0]
  const { error } = await supabase.from('friendships').insert({
    user_id: authStore.user.id,
    friend_id: target.id,
    status: 'pending'
  })

  if (error) {
    if (error.code === '23505') friendError.value = '已发送或已是好友'
    else friendError.value = error.message
    return
  }
  friendSuccess.value = `已向 ${target.display_name} 发送请求`
  searchInput.value = ''
  loadFriends()
}

async function respondRequest(friendshipId, status) {
  await supabase
    .from('friendships')
    .update({ status })
    .eq('id', friendshipId)
  loadFriends()
}

onMounted(() => {
  loadFriends()
})
</script>
