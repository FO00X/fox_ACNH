<template>
  <div class="plaza-page space-y-4 motion-rise">

    <!-- 日期与时间 -->
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <p class="text-lg font-bold text-base-content">{{ dateLabel }}</p>
      <span class="badge badge-lg rounded-2xl bg-[#EFE0E0] text-base-content border-0 px-4 py-2">
        {{ timeLabel }}
      </span>
    </div>

    <!-- 每日事项 -->
    <div class="rounded-3xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b border-base-200/80">
        <h2 class="font-bold text-base flex items-center gap-2 text-base-content">
          <Icon icon="mdi:format-list-checks" class="w-5 h-5 text-[#558B2F]" />
          每日事项
        </h2>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle min-h-0 h-9 w-9 ml-auto"
          title="设置每日事项"
          aria-label="设置每日事项"
          @click="showDailyTasksDrawer = true"
        >
          <Icon icon="mdi:cog-outline" class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4 grid grid-cols-4 gap-3">
        <RouterLink
          v-for="task in dailyTasks"
          :key="task.to"
          :to="task.to"
          class="flex flex-col items-center gap-1.5 rounded-2xl p-2 hover:bg-base-200/60 active:scale-95 transition-transform tap-lift"
        >
          <div class="w-12 h-12 rounded-full border-2 border-[#FFE082] bg-[#FFFDE7] flex items-center justify-center overflow-hidden shrink-0">
            <Icon :icon="task.icon" class="w-6 h-6 text-[#F9A825]" />
          </div>
          <span class="text-xs font-medium text-center leading-tight">{{ task.label }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- 每日事项设置抽屉 -->
    <Transition name="slide-up">
      <div v-if="showDailyTasksDrawer" class="fixed inset-0 z-60">
        <div class="absolute inset-0 bg-black/30" @click="showDailyTasksDrawer = false"></div>
        <div class="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-base-100 shadow-2xl rounded-t-3xl flex flex-col">
          <!-- 拖拽指示器 -->
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-12 h-1 bg-base-300 rounded-full"></div>
          </div>
          
          <div class="px-6 py-4 border-b border-base-300 flex items-center justify-between">
            <h2 class="text-lg font-semibold">设置每日事项</h2>
            <button type="button" class="btn btn-ghost btn-sm btn-circle" aria-label="关闭" @click="showDailyTasksDrawer = false">
              <Icon icon="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <p class="text-sm text-base-content/70">点击移除已显示的事项，下方可添加回来。</p>
            
            <section>
              <h3 class="mb-3 font-medium text-base">当前显示</h3>
              <div class="space-y-3">
                <div
                  v-for="task in dailyTasks"
                  :key="task.id"
                  class="flex items-center justify-between gap-3 rounded-2xl border border-base-200 bg-base-200/50 px-4 py-3"
                >
                  <span class="flex items-center gap-3">
                    <Icon :icon="task.icon" class="w-6 h-6 text-[#F9A825]" />
                    <span class="font-medium">{{ task.label }}</span>
                  </span>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm rounded-xl min-h-0 h-9"
                    title="移除此项"
                    @click="removeDailyTask(task.id)"
                  >
                    移除
                  </button>
                </div>
                <div v-if="dailyTasks.length === 0" class="rounded-2xl border-2 border-dashed border-base-300 px-4 py-6 text-center text-base-content/50">
                  暂无事项，从下方添加
                </div>
              </div>
            </section>
            
            <section v-if="availableDailyTasksToAdd.length > 0" class="pt-2">
              <h3 class="mb-3 font-medium text-base">添加事项</h3>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="t in availableDailyTasksToAdd"
                  :key="t.id"
                  type="button"
                  class="btn btn-outline btn-sm rounded-2xl gap-2 min-h-0 h-11"
                  @click="addDailyTask(t.id)"
                >
                  <Icon :icon="t.icon" class="w-5 h-5" />
                  <span class="text-sm">{{ t.label }}</span>
                </button>
              </div>
            </section>
          </div>
          
          <div class="px-6 py-4 border-t border-base-300 bg-base-100/95 backdrop-blur-sm">
            <button type="button" class="btn btn-success rounded-2xl w-full h-12 text-base" @click="showDailyTasksDrawer = false">
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 广场便签板 -->
    <div ref="notesSectionRef" class="acnh-card bg-base-100 p-3.5 sm:p-5">
      <div class="flex items-center justify-between mb-3 gap-2">
        <h2 class="page-title flex items-center gap-2 shrink-0">
          <Icon icon="mdi:note-text-outline" class="w-6 h-6 shrink-0" />
          广场便签板
        </h2>
        <RouterLink
          to="/catalogue"
          class="btn rounded-2xl bg-base-100 border-base-300 hover:bg-base-200/60 text-sm min-h-(--touch-min) shrink-0"
        >
          去图鉴添加 →
        </RouterLink>
      </div>
      <p class="page-desc mb-4">
        {{ hasUnfulfilledNotes ? '岛民代表有新的心愿哩！快帮她们完成吧！' : '目前岛民待办的心愿都实现哩！' }}
      </p>

      <!-- 木板便签墙 -->
      <div class="relative min-h-[200px] rounded-3xl overflow-hidden">
        
        <!-- 便签墙 -->
        <div class="relative p-2 min-h-[200px]">
          <div class="grid grid-cols-2 gap-4 motion-stagger">
            <NoteCard
              v-for="note in filteredNotes"
              :key="note.id"
              :note="note"
              @click="handleNoteClick(note)"
            />
            <div v-if="filteredNotes.length === 0" class="col-span-2 text-center text-sm text-white/60 py-8">
              {{ searchQuery.trim() ? '没有匹配的便签' : '还没有便签，先贴一张自己的需求吧～' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { CATALOGUE_CATEGORIES } from '../lib/acnh-api'
import NoteCard from '../components/NoteCard.vue'

const authStore = useAuthStore()
const notesSectionRef = ref(null)

const searchQuery = ref('')
const notes = ref([])
const collectedCounts = ref({})

// 日期与时间
const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dateLabel = computed(() => {
  const d = new Date()
  return `${weekDayNames[d.getDay()]}，${d.getMonth() + 1}月${d.getDate()}日`
})
const timeLabel = computed(() => {
  const d = new Date()
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
})

// 每日事项：可配置，持久化到 localStorage
const DAILY_TASKS_STORAGE_KEY = 'acnh_daily_task_ids'
const DAILY_TASKS_POOL = [
  { id: 'dialogue', icon: 'mdi:account-group', label: '对话', to: '/dashboard' },
  { id: 'fossil', icon: 'mdi:bone', label: '挖化石', to: '/catalogue' },
  { id: 'rock', icon: 'mdi:hammer', label: '敲石头', to: '/dashboard' },
  { id: 'turnips', icon: 'mdi:sprout', label: '大头菜', to: '/turnips' },
  { id: 'tree', icon: 'mdi:leaf-maple', label: '摇钱树', to: '/dashboard' },
  { id: 'diy', icon: 'mdi:file-document-outline', label: '找DIY', to: '/board' }
]
const defaultTaskIds = DAILY_TASKS_POOL.map((t) => t.id)

function loadDailyTaskIds() {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  return [...defaultTaskIds]
}

const dailyTaskIds = ref(loadDailyTaskIds())
const showDailyTasksDrawer = ref(false)

const dailyTasks = computed(() => {
  const ids = new Set(dailyTaskIds.value)
  return DAILY_TASKS_POOL.filter((t) => ids.has(t.id))
})

const availableDailyTasksToAdd = computed(() => {
  const ids = new Set(dailyTaskIds.value)
  return DAILY_TASKS_POOL.filter((t) => !ids.has(t.id))
})

function saveDailyTaskIds() {
  try {
    localStorage.setItem(DAILY_TASKS_STORAGE_KEY, JSON.stringify(dailyTaskIds.value))
  } catch (_) {}
}

function removeDailyTask(id) {
  dailyTaskIds.value = dailyTaskIds.value.filter((x) => x !== id)
  saveDailyTaskIds()
}

function addDailyTask(id) {
  if (!dailyTaskIds.value.includes(id)) {
    dailyTaskIds.value = [...dailyTaskIds.value, id]
    saveDailyTaskIds()
  }
}

const myOpenCount = computed(() => notes.value.filter(n => n.isMine && !n.is_fulfilled).length)
const myHelpCount = computed(() => notes.value.filter(n => n.fulfilled_by === authStore.user?.id).length)
const hasUnfulfilledNotes = computed(() => notes.value.some(n => !n.is_fulfilled))

const filteredNotes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return notes.value
  return notes.value.filter(n => (n.item_name || '').toLowerCase().includes(q))
})



async function loadCollectedCounts() {
  if (!authStore.user) return
  const { data } = await supabase
    .from('catalogue_collected')
    .select('category')
    .eq('user_id', authStore.user.id)
  const map = {}
  for (const row of data || []) {
    map[row.category] = (map[row.category] || 0) + 1
  }
  collectedCounts.value = map
}

async function loadNotes() {
  const { data } = await supabase
    .from('wishlist_items')
    .select('*, user_id')
    .order('created_at', { ascending: false })

  const rows = data || []
  const ownerIds = [...new Set(rows.map(r => r.user_id))]
  let owners = {}
  if (ownerIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, island_name')
      .in('id', ownerIds)
    owners = Object.fromEntries((profiles || []).map(p => [p.id, p]))
  }

  notes.value = rows.map(r => {
    const owner = owners[r.user_id] || {}
    return {
      ...r,
      isMine: r.user_id === authStore.user?.id,
      ownerName: owner.display_name || '岛民',
      ownerIsland: owner.island_name || '小岛'
    }
  })
}



async function handleNoteClick(note) {
  if (note.is_fulfilled) {
    // 已完成的便签：切换回未完成状态
    await supabase
      .from('wishlist_items')
      .update({
        is_fulfilled: false,
        fulfilled_by: null,
        fulfilled_at: null
      })
      .eq('id', note.id)
  } else {
    // 未完成的便签：标记为已完成
    if (note.isMine) {
      await supabase
        .from('wishlist_items')
        .update({
          is_fulfilled: true,
          fulfilled_by: authStore.user.id,
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', note.id)
    } else {
      await supabase
        .from('wishlist_items')
        .update({
          is_fulfilled: true,
          fulfilled_by: authStore.user.id,
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', note.id)
    }
  }
  await loadNotes()
}

function scrollToNotes() {
  notesSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    loadNotes()
    loadCollectedCounts()
  }
})
</script>

<style scoped>
.plaza-page {
  padding-bottom: 0.5rem;
}

/* 便签动画效果 */
@keyframes note-pin {
  0% {
    transform: translateY(-20px) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateY(-10px) scale(1.1);
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes note-tear {
  0% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
  50% {
    transform: scale(0.95) rotate(-2deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.9) rotate(-5deg);
    opacity: 0.6;
  }
}

.note-card {
  animation: note-pin 0.5s ease-out;
}

.note-card.tear-effect {
  animation: note-tear 0.3s ease-out forwards;
}

/* 便签悬停效果 */
.note-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px) scale(1.02);
}

/* 木板纹理动画 */
@keyframes wood-grain {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

.wood-background {
  animation: wood-grain 20s linear infinite;
}
</style>
