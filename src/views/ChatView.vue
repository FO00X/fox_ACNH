<template>
  <div class="space-y-4 motion-rise">
    <!-- 在线用户头像列表 -->
    <div class="bg-base-100 rounded-2xl border border-base-300 p-3 shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500">岛民代表们</span>
        <button class="btn btn-ghost btn-xs btn-circle" @click="loadFeed" :disabled="loading">
          <Icon :icon="loading ? 'mdi:loading' : 'mdi:refresh'" class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
        </button>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <div
          v-for="user in onlineUsers"
          :key="user.id"
          class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          @click="openUserProfile(user)"
        >
          <div
            :class="[
              'w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm relative',
              getAvatarColor(user.id)
            ]"
          >
            <template v-if="user.avatar_url">
              <img :src="user.avatar_url" class="w-full h-full rounded-2xl object-cover" />
            </template>
            <template v-else>
              {{ getAvatarText(user.display_name) }}
            </template>
            <span
              v-if="isUserOnline(user.last_sign_in_at)"
              class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
            ></span>
          </div>
          <span class="text-[10px] text-gray-500 truncate max-w-[48px]">{{ user.display_name || '岛民' }}</span>
          <span class="text-[9px] text-gray-400">{{ formatLastActive(user.last_sign_in_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 用户资料弹窗 -->
    <dialog class="modal" :open="userProfileOpen" @click="closeUserProfile">
      <div class="modal-box rounded-3xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-md" @click.stop>
        <div v-if="selectedUserProfile" class="space-y-4">
          <!-- 护照卡 -->
          <div class="rounded-3xl p-4 border border-base-300 bg-base-100 relative">
            <p class="text-sm text-base-content/60 text-center mb-3">岛民护照</p>

            <div class="flex items-start gap-4">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-base-100 border border-base-300 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  v-if="selectedUserProfile.avatar_url"
                  :src="selectedUserProfile.avatar_url"
                  alt="avatar"
                  class="w-full h-full object-cover"
                />
                <div v-else :class="['w-full h-full flex items-center justify-center text-white text-2xl font-bold', getAvatarColor(selectedUserProfile.id)]">
                  {{ getAvatarText(selectedUserProfile.display_name) }}
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-xl font-extrabold tracking-wide truncate">{{ selectedUserProfile.display_name || '岛民' }}</p>
                </div>

                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-content/70">
                  <span class="truncate">{{ selectedUserProfile.island_name || '未命名小岛' }}</span>
                  <span class="opacity-40">·</span>
                  <span class="inline-flex items-center gap-1">
                    <Icon icon="mdi:leaf" class="w-4 h-4 text-[#7CB342]" />
                    {{ hemisphereLabel }}
                  </span>
                </div>

                <div class="mt-2 grid grid-cols-1 gap-1 text-sm">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-base-content/60">生日</span>
                    <span class="font-semibold truncate">{{ profileBirthdayLabel }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-base-content/60">好友码</span>
                    <span class="font-semibold truncate">{{ selectedUserProfile.friend_code || '未设置' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 居民头像行 -->
          <div class="rounded-3xl p-4 border border-base-300 bg-base-100">
            <p class="text-sm text-base-content/60 mb-3">岛上居民</p>
            <div class="grid grid-cols-5 gap-2">
              <div
                v-for="r in residentBadges"
                :key="r.key"
                class="w-12 h-12 rounded-full bg-base-100 border border-base-300 flex items-center justify-center overflow-hidden"
                :title="r.name"
              >
                <img v-if="r.photo" :src="r.photo" :alt="r.name" class="w-full h-full object-cover" />
                <span v-else class="text-sm font-bold text-base-content/70">{{ r.initial }}</span>
              </div>
              <div v-if="residentBadges.length === 0" class="col-span-5 text-sm text-base-content/60 py-2">
                暂无居民信息
              </div>
            </div>
          </div>

          <!-- 图鉴进度 -->
          <div class="rounded-3xl p-4 border border-base-300 bg-base-100">
            <p class="text-sm text-base-content/60 mb-3">图鉴进度</p>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="card in progressCards"
                :key="card.id"
                class="rounded-2xl border border-base-300 bg-base-200/50 p-3"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <div :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden', card.bg]">
                    <Icon :icon="card.icon" :class="['w-5 h-5', card.fg]" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-xs truncate">{{ card.label }}</p>
                    <p class="text-[10px] text-base-content/60">{{ card.countText }}</p>
                  </div>
                </div>
                <progress class="progress mt-2 h-1.5 w-full" :class="card.progressClass" :value="card.percent" max="100"></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- 关闭按钮 -->
        <div class="modal-action mt-4">
          <button class="btn btn-ghost rounded-2xl" @click="closeUserProfile">关闭</button>
        </div>
      </div>
    </dialog>

    <div ref="listEl" class="space-y-3 max-h-[50vh] overflow-y-auto px-1">
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg text-[#7CB342]"></span>
      </div>
      <div v-else-if="timeline.length === 0" class="text-center py-10 text-gray-500 text-sm">
        <Icon icon="mdi:chat-outline" class="w-12 h-12 mx-auto mb-2 opacity-30" />
        还没有消息或动态，来发第一条吧~
      </div>
      <template v-else>
        <div
          v-for="(group, groupIndex) in groupedTimeline"
          :key="groupIndex"
          class="space-y-3"
        >
          <div class="flex justify-center">
            <span class="text-[10px] text-gray-400 bg-gray-100/70 px-3 py-1 rounded-full">{{ group.timeLabel }}</span>
          </div>

          <template v-for="entry in group.entries" :key="entry.kind + '-' + entry.id">
            <!-- 动态：大家在做什么 -->
            <div
              v-if="entry.kind === 'activity'"
              class="flex justify-center px-2"
            >
              <div
                class="inline-flex items-start gap-2 max-w-[95%] rounded-2xl border border-[#C5E1A5]/60 bg-[#F1F8E9]/90 px-3 py-2 text-xs text-gray-700 leading-relaxed shadow-sm"
              >
                <Icon icon="mdi:lightning-bolt-outline" class="w-4 h-4 text-[#558B2F] shrink-0 mt-0.5" />
                <span class="wrap-break-word text-left">{{ formatActivityLine(entry.data) }}</span>
              </div>
            </div>

            <!-- 聊天消息 -->
            <div
              v-else
              :class="[
                'flex gap-2',
                isMyMessage(entry.data) ? 'flex-row-reverse' : 'flex-row'
              ]"
            >
              <div class="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" @click="openUserProfileFromMessage(entry.data)">
                <div
                  :class="[
                    'w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm',
                    getAvatarColor(entry.data.author_id)
                  ]"
                >
                  {{ getAvatarText(entry.data.author?.display_name) }}
                </div>
              </div>

              <div :class="['flex flex-col max-w-[75%]', isMyMessage(entry.data) ? 'items-end' : 'items-start']">
                <span v-if="!isMyMessage(entry.data)" class="text-[11px] text-gray-500 mb-0.5 ml-1">
                  {{ entry.data.author?.display_name || '岛民' }}
                </span>

                <div
                  :class="[
                    'relative px-3 py-2 text-sm leading-relaxed break-all shadow-sm whitespace-pre-wrap',
                    isMyMessage(entry.data)
                      ? 'bg-[#95EC69] rounded-2xl rounded-tr-sm text-gray-800'
                      : 'bg-white rounded-2xl rounded-tl-sm text-gray-800 border border-gray-100'
                  ]"
                >
                  {{ entry.data.content }}
                </div>

                <span class="text-[10px] text-gray-400 mt-0.5">{{ formatTime(entry.data.created_at) }}</span>
              </div>

              <div v-if="isMyMessage(entry.data)" class="flex items-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  class="btn btn-ghost btn-xs btn-circle text-red-400"
                  title="删除"
                  @click="deleteMessage(entry.data)"
                >
                  <Icon icon="mdi:delete-outline" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
      <div class="flex items-end gap-2">
        <div class="flex-1 bg-base-200/50 rounded-xl border border-base-200 focus-within:border-[#9CCC65]/50 focus-within:bg-white transition-colors">
          <textarea
            v-model="draft"
            placeholder="说点什么..."
            class="w-full px-3 py-2.5 text-sm bg-transparent resize-none outline-none rounded-xl"
            rows="1"
            style="min-height: 40px; max-height: 100px;"
            @input="autoResize"
            @keydown.enter.prevent="handleEnter"
          />
        </div>
        <button
          class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl h-10 min-h-0 px-4 tap-lift disabled:opacity-50"
          @click="send"
          :disabled="sending || !draft.trim()"
        >
          <Icon v-if="sending" icon="mdi:loading" class="w-4 h-4 animate-spin" />
          <Icon v-else icon="mdi:send" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const listEl = ref(null)
const loading = ref(false)
const sending = ref(false)
const draft = ref('')
const messages = ref([])
const activityEvents = ref([])
const onlineUsers = ref([])

// 用户资料弹窗相关
const userProfileOpen = ref(false)
const selectedUserProfile = ref(null)
const selectedUserCollectedCounts = ref({})
const selectedUserResidents = ref([])

let channel = null

// 打开用户资料弹窗
async function openUserProfile(user) {
  if (!user?.id) return

  // 获取完整的用户资料
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('加载用户资料失败:', error)
    return
  }

  selectedUserProfile.value = profile

  // 加载用户的图鉴进度
  await loadUserCollectedCounts(user.id)

  // 加载用户的居民
  await loadUserResidents(user.id)

  userProfileOpen.value = true
}

// 从消息中打开用户资料
async function openUserProfileFromMessage(message) {
  if (!message?.author_id) return
  await openUserProfile({ id: message.author_id, display_name: message.author?.display_name })
}

// 关闭用户资料弹窗
function closeUserProfile() {
  userProfileOpen.value = false
  selectedUserProfile.value = null
  selectedUserCollectedCounts.value = {}
  selectedUserResidents.value = []
}

// 加载用户图鉴进度
async function loadUserCollectedCounts(userId) {
  if (!userId) return
  const { data } = await supabase
    .from('catalogue_collected')
    .select('category')
    .eq('user_id', userId)
  const map = {}
  for (const row of data || []) {
    map[row.category] = (map[row.category] || 0) + 1
  }
  selectedUserCollectedCounts.value = map
}

// 加载用户居民
async function loadUserResidents(userId) {
  if (!userId) return
  const { data } = await supabase
    .from('island_residents')
    .select('*')
    .eq('user_id', userId)
  selectedUserResidents.value = data || []
}

// 计算属性：半球标签
const hemisphereLabel = computed(() => {
  const h = selectedUserProfile.value?.hemisphere
  if (h === 'south') return '南半球'
  if (h === 'north') return '北半球'
  return '半球未设置'
})

// 计算属性：生日标签
const profileBirthdayLabel = computed(() => {
  const raw = selectedUserProfile.value?.birthday
  if (!raw) return '未设置'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '未设置'
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

// 计算属性：居民徽章
const residentBadges = computed(() => {
  return selectedUserResidents.value.slice(0, 10).map(r => ({
    key: r.id,
    name: r.resident_name,
    photo: r.photo_url,
    initial: String(r.resident_name || '?').slice(0, 1)
  }))
})

// 图鉴分类配置
const CATALOGUE_CATEGORIES = [
  { id: 'houseware', label: '全部家具', icon: 'mdi:sofa', total: 900 },
  { id: 'misc', label: '小物件', icon: 'mdi:package-variant', total: 150 },
  { id: 'sea', label: '海洋生物', icon: 'mdi:octopus', total: 40 },
  { id: 'fish', label: '鱼类', icon: 'mdi:fish', total: 80 },
  { id: 'bugs', label: '昆虫', icon: 'mdi:butterfly', total: 80 },
  { id: 'fossils', label: '化石', icon: 'mdi:bone', total: 73 },
  { id: 'art', label: '艺术品', icon: 'mdi:image-frame', total: 43 }
]

// 计算属性：进度卡片
const progressCards = computed(() => {
  const get = (id) => selectedUserCollectedCounts.value[id] || 0
  return CATALOGUE_CATEGORIES.map(c => {
    const current = get(c.id)
    const total = c.total || 0
    const percent = total ? Math.round((current / total) * 100) : 0
    const bgColors = {
      houseware: 'bg-[#E8F5E9]',
      misc: 'bg-[#FFF8E1]',
      sea: 'bg-[#E3F2FD]',
      fish: 'bg-[#E3F2FD]',
      bugs: 'bg-[#FCE4EC]',
      fossils: 'bg-[#FFF8E1]',
      art: 'bg-[#E8F5E9]'
    }
    const fgColors = {
      houseware: 'text-[#558B2F]',
      misc: 'text-[#F9A825]',
      sea: 'text-[#1976D2]',
      fish: 'text-[#1976D2]',
      bugs: 'text-[#C2185B]',
      fossils: 'text-[#F9A825]',
      art: 'text-[#558B2F]'
    }
    const progressClasses = {
      houseware: 'progress-success',
      misc: 'progress-warning',
      sea: 'progress-info',
      fish: 'progress-info',
      bugs: 'progress-secondary',
      fossils: 'progress-warning',
      art: 'progress-success'
    }
    return {
      ...c,
      bg: bgColors[c.id] || 'bg-base-200',
      fg: fgColors[c.id] || 'text-base-content',
      progressClass: progressClasses[c.id] || 'progress-primary',
      current,
      total,
      percent,
      countText: `${current}/${total}`
    }
  })
})

const avatarColors = [
  'bg-[#7CB342]',
  'bg-[#558B2F]',
  'bg-[#9CCC65]',
  'bg-[#F9A825]',
  'bg-[#FFB300]',
  'bg-[#66BB6A]',
  'bg-[#42A5F5]',
  'bg-[#AB47BC]',
  'bg-[#EF5350]',
  'bg-[#EC407A]',
  'bg-[#26C6DA]',
  'bg-[#FFA726]'
]

function getAvatarColor(userId) {
  if (!userId) return 'bg-gray-400'
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % avatarColors.length
  return avatarColors[index]
}

function getAvatarText(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

function isMyMessage(m) {
  return m.author_id === authStore.user?.id
}

// 加载在线用户列表
async function loadOnlineUsers() {
  try {
    // 获取用户资料
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .limit(20)

    if (profileError) throw profileError

    // 获取用户的最后登录时间（需要管理员权限或使用 service role key）
    // 这里使用 auth.users 表的 last_sign_in_at 字段
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_users_last_sign_in', { user_ids: (profiles || []).map(p => p.id) })

    if (authError) {
      console.warn('获取登录时间失败，使用 updated_at 代替:', authError)
    }

    // 合并数据
    const lastSignInMap = {}
    if (authUsers) {
      for (const u of authUsers) {
        lastSignInMap[u.id] = u.last_sign_in_at
      }
    }

    onlineUsers.value = (profiles || []).map(p => ({
      ...p,
      last_sign_in_at: lastSignInMap[p.id] || null
    })).sort((a, b) => {
      const aTime = a.last_sign_in_at ? new Date(a.last_sign_in_at) : new Date(0)
      const bTime = b.last_sign_in_at ? new Date(b.last_sign_in_at) : new Date(0)
      return bTime - aTime
    })
  } catch (err) {
    console.error('加载用户列表失败:', err)
    onlineUsers.value = []
  }
}

// 判断用户是否在线（5分钟内活跃）
function isUserOnline(lastSignInAt) {
  if (!lastSignInAt) return false
  const last = new Date(lastSignInAt)
  const now = new Date()
  return (now - last) < 5 * 60 * 1000 // 5分钟
}

// 格式化最后活跃时间
function formatLastActive(lastSignInAt) {
  if (!lastSignInAt) return '未知'
  const last = new Date(lastSignInAt)
  const now = new Date()
  const diffMs = now - last
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 5) return '在线'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays === 1) return '昨天'
  if (diffDays < 3) return '3天前'
  if (diffDays < 7) return '7天前'
  return '很久前'
}

const timeline = computed(() => {
  const chats = messages.value.map((m) => ({
    kind: 'chat',
    id: m.id,
    created_at: m.created_at,
    data: m
  }))
  const acts = activityEvents.value.map((e) => ({
    kind: 'activity',
    id: e.id,
    created_at: e.created_at,
    data: e
  }))
  return [...chats, ...acts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

const groupedTimeline = computed(() => {
  const groups = []
  let currentGroup = null
  for (const entry of timeline.value) {
    const msgTime = new Date(entry.created_at)
    const timeLabel = formatGroupTime(msgTime)
    if (!currentGroup || currentGroup.timeLabel !== timeLabel) {
      currentGroup = { timeLabel, entries: [] }
      groups.push(currentGroup)
    }
    currentGroup.entries.push(entry)
  }
  return groups
})

function formatGroupTime(date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today - msgDate) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  if (diffDays === 1) {
    return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  if (diffDays < 7) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatActivityLine(ev) {
  const name = ev.user?.display_name || '岛民'
  const m = ev.meta && typeof ev.meta === 'object' ? ev.meta : {}
  switch (ev.kind) {
    case 'catalogue_view':
      return `${name} 查看了图鉴「${m.item_name || m.item_id || '…'}」${m.category ? `（${m.category}）` : ''}`
    case 'wishlist_add':
      return `${name} 将「${m.item_name || '…'}」加入心愿单`
    case 'catalogue_owned_add':
      return `${name} 标记已拥有「${m.item_name || m.item_id || '…'}」`
    case 'catalogue_owned_remove':
      return `${name} 取消已拥有「${m.item_name || m.item_id || '…'}」`
    case 'turnip_record': {
      const buy = m.buy_price != null ? `，买入价 ${m.buy_price}` : ''
      return `${name} 更新了大头菜记录（周 ${m.week_start || '—'}，已填 ${m.filled_slots ?? 0} 个时段${buy}）`
    }
    case 'daily_task_progress':
      return `${name} 记录了每日事项「${m.task_label || m.task_id || '…'}」进度 ${m.progress ?? 0}/${m.required ?? 0}`
    case 'daily_task_complete':
      return `${name} 完成了每日事项「${m.task_label || m.task_id || '…'}」`
    case 'board_post_resolved':
      return `${name} 完成了 ${m.target_name || '岛民'} 的留言：${m.content || '…'}`
    case 'wishlist_fulfilled':
      return `${name} 帮 ${m.fulfilled_for || '岛民'} 完成了心愿：${m.item_name || '…'} ${m.quantity > 1 ? `×${m.quantity}` : ''}`
    case 'villager_birthday':
      return `🎂 ${name} 的岛民 ${m.villager_name || '…'} 今天生日！`
    case 'user_birthday':
      return `🎉 今天是 ${name} 的生日！生日快乐！`
    default:
      return `${name} 进行了一项操作`
  }
}

function autoResize(e) {
  const textarea = e.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px'
}

function handleEnter(e) {
  if (!e.shiftKey) {
    send()
  } else {
    draft.value += '\n'
    nextTick(() => autoResize({ target: e.target }))
  }
}

async function loadFeed() {
  if (!authStore.user?.id) return
  loading.value = true
  try {
    const [msgRes, actRes] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('id, author_id, content, created_at, author:author_id (display_name)')
        .order('created_at', { ascending: true })
        .limit(200),
      supabase
        .from('activity_events')
        .select('id, user_id, kind, meta, created_at, user:user_id (display_name)')
        .order('created_at', { ascending: true })
        .limit(200)
    ])
    if (msgRes.error) {
      console.error('加载聊天失败:', msgRes.error)
      messages.value = []
    } else {
      messages.value = msgRes.data || []
    }
    if (actRes.error) {
      console.warn('加载动态失败（若未建表可忽略）:', actRes.error)
      activityEvents.value = []
    } else {
      activityEvents.value = actRes.data || []
    }
    // 同时加载在线用户
    await loadOnlineUsers()
    await nextTick()
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  const el = listEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function send() {
  if (!authStore.user?.id) return
  const text = draft.value.trim()
  if (!text) return
  sending.value = true
  try {
    const displayName = authStore.profile?.display_name || '我'
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ author_id: authStore.user.id, content: text })
      .select('id, author_id, content, created_at')
      .single()

    if (error) throw error

    if (data && !messages.value.some((x) => x.id === data.id)) {
      messages.value.push({
        ...data,
        author: { display_name: displayName }
      })
    }

    draft.value = ''
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.style.height = 'auto'
    }
    await nextTick()
    scrollToBottom()
  } catch (e) {
    console.error('发送失败:', e)
    alert('发送失败，请重试')
  } finally {
    sending.value = false
  }
}

async function deleteMessage(m) {
  if (!m?.id) return
  if (m.author_id !== authStore.user?.id) return
  if (!confirm('确定删除这条消息吗？')) return
  const { error } = await supabase.from('chat_messages').delete().eq('id', m.id)
  if (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

function attachRealtime() {
  if (channel) return
  channel = supabase
    .channel('global-chat-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      async (payload) => {
        const row = payload.new
        if (messages.value.some((x) => x.id === row.id)) return
        const { data: authorRow } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', row.author_id)
          .single()
        messages.value.push({
          ...row,
          author: { display_name: authorRow?.display_name || null }
        })
        await nextTick()
        scrollToBottom()
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'chat_messages' },
      (payload) => {
        const id = payload.old?.id
        if (!id) return
        messages.value = messages.value.filter((x) => x.id !== id)
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_events' },
      async (payload) => {
        const row = payload.new
        if (activityEvents.value.some((x) => x.id === row.id)) return
        const { data: userRow } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', row.user_id)
          .single()
        activityEvents.value.push({
          ...row,
          user: { display_name: userRow?.display_name || null }
        })
        await nextTick()
        scrollToBottom()
      }
    )
    .subscribe()
}

function detachRealtime() {
  if (!channel) return
  supabase.removeChannel(channel)
  channel = null
}

onMounted(async () => {
  await loadFeed()
  attachRealtime()
})

onBeforeUnmount(() => {
  detachRealtime()
})
</script>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
