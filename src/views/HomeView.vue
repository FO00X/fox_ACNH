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
    <Transition name="fade">
      <div v-if="showDailyTasksDrawer" class="fixed inset-0 z-40">
        <div class="absolute inset-0 bg-black/30" @click="showDailyTasksDrawer = false"></div>
        <div class="absolute right-0 top-0 h-full w-full max-w-sm bg-base-100 shadow-xl flex flex-col">
          <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
            <h2 class="text-base font-semibold">设置每日事项</h2>
            <button type="button" class="btn btn-ghost btn-sm btn-circle" aria-label="关闭" @click="showDailyTasksDrawer = false">
              <Icon icon="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm">
            <p class="text-base-content/70">点击移除已显示的事项，下方可添加回来。</p>
            <section>
              <h3 class="mb-2 font-medium">当前显示</h3>
              <ul class="space-y-2">
                <li
                  v-for="task in dailyTasks"
                  :key="task.id"
                  class="flex items-center justify-between gap-2 rounded-xl border border-base-200 bg-base-200/50 px-3 py-2"
                >
                  <span class="flex items-center gap-2">
                    <Icon :icon="task.icon" class="w-5 h-5 text-[#F9A825]" />
                    <span>{{ task.label }}</span>
                  </span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs min-h-0 h-8"
                    title="移除此项"
                    @click="removeDailyTask(task.id)"
                  >
                    移除
                  </button>
                </li>
                <li v-if="dailyTasks.length === 0" class="rounded-xl border border-dashed border-base-300 px-3 py-4 text-center text-base-content/50">
                  暂无事项，从下方添加
                </li>
              </ul>
            </section>
            <section v-if="availableDailyTasksToAdd.length > 0">
              <h3 class="mb-2 font-medium">添加事项</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in availableDailyTasksToAdd"
                  :key="t.id"
                  type="button"
                  class="btn btn-outline btn-sm rounded-xl gap-1"
                  @click="addDailyTask(t.id)"
                >
                  <Icon :icon="t.icon" class="w-4 h-4" />
                  {{ t.label }}
                </button>
              </div>
            </section>
          </div>
          <div class="px-4 py-3 border-t border-base-300">
            <button type="button" class="btn btn-primary btn-sm rounded-2xl w-full" @click="showDailyTasksDrawer = false">
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 来访者（本周活动） -->
    <div class="rounded-3xl border border-base-300 bg-base-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-base-200/80">
        <h2 class="font-bold text-base flex items-center gap-2 text-base-content">
          <Icon icon="mdi:map-marker" class="w-5 h-5 text-[#E53935]" />
          来访者
        </h2>
      </div>
      <div class="p-4 flex flex-wrap items-center justify-between gap-2">
        <div
          v-for="day in weekDays"
          :key="day.key"
          class="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <span class="text-xs font-medium text-base-content/70">{{ day.label }}</span>
          <RouterLink
            :to="'/calendar'"
            class="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center hover:bg-base-300 transition-colors"
            :title="'查看' + day.label + '活动'"
          >
            <Icon icon="mdi:calendar-blank" class="w-5 h-5 text-base-content/60" />
          </RouterLink>
        </div>
      </div>
      <div class="px-4 pb-4">
        <RouterLink to="/calendar" class="btn btn-sm btn-ghost text-[#1976D2] gap-1">
          查看日历与活动
          <Icon icon="mdi:chevron-right" class="w-4 h-4" />
        </RouterLink>
      </div>
    </div>

    <!-- 广场便签板（保留原功能） -->
    <div ref="notesSectionRef" class="acnh-card bg-base-100 p-3.5 sm:p-5">
      <div class="flex items-center justify-between mb-3 gap-2">
        <h2 class="page-title flex items-center gap-2 shrink-0">
          <Icon icon="mdi:note-text-outline" class="w-6 h-6 shrink-0" />
          广场便签板
        </h2>
        <RouterLink
          to="/dashboard"
          class="btn rounded-2xl bg-base-100 border-base-300 hover:bg-base-200/60 text-sm min-h-(--touch-min) shrink-0"
        >
          我的小岛 →
        </RouterLink>
      </div>
      <p class="page-desc mb-4">
        把你缺的东西写在便签上，大家互相帮忙；看到能帮的，也可以撕掉别人的便签。
      </p>

      <!-- 统计 -->
      <div class="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-4 text-sm motion-stagger">
        <div class="rounded-2xl bg-[#E8F5E9] border border-[#C5E1A5] px-4 py-3 flex items-center justify-between min-h-[52px] motion-pop">
          <span class="text-[#558B2F] flex items-center gap-1.5">
            <Icon icon="mdi:note-text" class="w-5 h-5 shrink-0" />
            我想要
          </span>
          <span class="font-bold text-lg">{{ myOpenCount }}</span>
        </div>
        <div class="rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] px-4 py-3 flex items-center justify-between min-h-[52px] motion-pop">
          <span class="text-[#1565C0] flex items-center gap-1.5">
            <Icon icon="mdi:hand-heart" class="w-5 h-5 shrink-0" />
            我已帮忙完成
          </span>
          <span class="font-bold text-lg">{{ myHelpCount }}</span>
        </div>
      </div>

      <!-- 新建便签 -->
      <div class="mb-4 space-y-3">
        <p class="text-sm text-base-content/60">我也贴一张便签</p>
        <div class="flex flex-col gap-3">
          <input
            v-model="newNoteName"
            type="text"
            placeholder="想要的材料/家具/物品..."
            class="input input-bordered rounded-2xl h-12 text-base"
            @keyup.enter="addNote"
          />
          <div class="flex flex-wrap gap-2 items-center">
            <select v-model="newNoteType" class="select select-bordered rounded-2xl h-11 text-base flex-1 min-w-0 max-w-[140px]">
              <option value="material">材料</option>
              <option value="furniture">家具</option>
              <option value="other">其他</option>
            </select>
            <input
              v-model.number="newNoteQty"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl h-11 w-20 text-center text-base shrink-0"
              placeholder="数量"
            />
            <button
              class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-2xl px-5 min-h-(--touch-min) acnh-btn shrink-0"
              @click="addNote"
            >
              贴上去
            </button>
          </div>
        </div>
      </div>

      <!-- 便签墙（按类型分列，支持搜索过滤） -->
      <div class="relative min-h-[120px]">
        <div
          class="absolute inset-2 rounded-3xl border border-dashed border-base-300 bg-[url('/leaf.svg')] bg-size-[160px_160px] bg-repeat opacity-20 pointer-events-none"
        ></div>
        <div class="relative grid grid-cols-1 sm:grid-cols-3 gap-4 motion-stagger">
          <!-- 材料 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-[#558B2F]">
              <Icon icon="mdi:package-variant" class="w-4 h-4" />
              <span>材料</span>
              <span class="text-base-content/40">({{ groupedNotes.material.length }})</span>
            </div>
            <div class="space-y-2">
              <NoteCard
                v-for="note in groupedNotes.material"
                :key="note.id"
                :note="note"
                color="material"
                @click="handleNoteClick(note)"
              />
            </div>
          </div>

          <!-- 家具 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-[#F9A825]">
              <Icon icon="mdi:sofa" class="w-4 h-4" />
              <span>家具</span>
              <span class="text-base-content/40">({{ groupedNotes.furniture.length }})</span>
            </div>
            <div class="space-y-2">
              <NoteCard
                v-for="note in groupedNotes.furniture"
                :key="note.id"
                :note="note"
                color="furniture"
                @click="handleNoteClick(note)"
              />
            </div>
          </div>

          <!-- 其他 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-[#1565C0]">
              <Icon icon="mdi:star-four-points" class="w-4 h-4" />
              <span>其他</span>
              <span class="text-base-content/40">({{ groupedNotes.other.length }})</span>
            </div>
            <div class="space-y-2">
              <NoteCard
                v-for="note in groupedNotes.other"
                :key="note.id"
                :note="note"
                color="other"
                @click="handleNoteClick(note)"
              />
            </div>
          </div>

          <div v-if="filteredNotes.length === 0" class="col-span-1 sm:col-span-3 text-center text-sm text-base-content/60 py-6">
            {{ searchQuery.trim() ? '没有匹配的便签' : '还没有便签，先贴一张自己的需求吧～' }}
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

const authStore = useAuthStore()
const notesSectionRef = ref(null)

const searchQuery = ref('')
const notes = ref([])
const newNoteName = ref('')
const newNoteType = ref('material')
const newNoteQty = ref(1)
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

// 来访者：周一～周五
const weekDays = [
  { key: 'mon', label: '周一' },
  { key: 'tue', label: '周二' },
  { key: 'wed', label: '周三' },
  { key: 'thu', label: '周四' },
  { key: 'fri', label: '周五' }
]

const myOpenCount = computed(() => notes.value.filter(n => n.isMine && !n.is_fulfilled).length)
const myHelpCount = computed(() => notes.value.filter(n => n.fulfilled_by === authStore.user?.id).length)

const filteredNotes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return notes.value
  return notes.value.filter(n => (n.item_name || '').toLowerCase().includes(q))
})

const groupedNotes = computed(() => {
  const groups = { material: [], furniture: [], other: [] }
  for (const n of filteredNotes.value) {
    const t = n.item_type === 'material' ? 'material' : n.item_type === 'furniture' ? 'furniture' : 'other'
    groups[t].push(n)
  }
  return groups
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

async function addNote() {
  if (!newNoteName.value.trim()) return
  await supabase.from('wishlist_items').insert({
    user_id: authStore.user.id,
    item_name: newNoteName.value.trim(),
    item_type: newNoteType.value,
    quantity: newNoteQty.value || 1
  })
  newNoteName.value = ''
  newNoteQty.value = 1
  await loadNotes()
}

async function handleNoteClick(note) {
  if (note.is_fulfilled) return
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

<script>
import { Icon } from '@iconify/vue'
// 内联便签卡组件，用于分列显示不同类型
export default {
  name: 'HomeView',
  components: {
    Icon,
    NoteCard: {
      components: { Icon },
      props: {
        note: { type: Object, required: true },
        color: { type: String, required: true }
      },
      emits: ['click'],
      computed: {
        baseClasses() {
          const n = this.note
          const common =
            'relative rounded-3xl p-3 shadow-md cursor-pointer transition-transform active:scale-95 border tap-lift motion-pop'
          const byType =
            this.color === 'material'
              ? n.isMine
                ? 'bg-[#FFFDE7] border-[#FFE082]'
                : 'bg-[#E8F5E9] border-[#C5E1A5]'
              : this.color === 'furniture'
              ? n.isMine
                ? 'bg-[#FFF3E0] border-[#FFCC80]'
                : 'bg-[#FFF8E1] border-[#FFE082]'
              : n.isMine
              ? 'bg-[#E3F2FD] border-[#90CAF9]'
              : 'bg-[#E1F5FE] border-[#81D4FA]'
          const done = n.is_fulfilled ? 'opacity-60 line-through' : ''
          return [common, byType, done].join(' ')
        }
      },
      methods: {
        formatShortDate(d) {
          if (!d) return ''
          const date = new Date(d)
          return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        }
      },
      template: `
        <div :class="baseClasses" @click="$emit('click')">
          <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-b-full bg-red-200"></div>
          <p class="font-semibold text-sm mb-1 break-words">
            {{ note.item_name }}<span v-if="note.quantity > 1"> ×{{ note.quantity }}</span>
          </p>
          <p class="text-[11px] text-base-content/60 mb-1 truncate">
            {{ note.ownerName }} · {{ note.ownerIsland }}
          </p>
          <p class="text-[10px] text-base-content/50">
            {{ note.item_type === 'material' ? '材料' : note.item_type === 'furniture' ? '家具' : '其他' }}
          </p>
          <div class="mt-2 flex items-center justify-between text-[11px]">
            <span v-if="note.is_fulfilled" class="text-emerald-700 flex items-center gap-1">
              <Icon icon="mdi:check-circle" class="w-3.5 h-3.5" />
              已完成
            </span>
            <span v-else-if="note.isMine" class="text-amber-800">点一下标记已完成</span>
            <span v-else class="text-[#1565C0] flex items-center gap-1">
              帮 Ta 完成
              <Icon icon="mdi:hand-heart" class="w-3.5 h-3.5" />
            </span>
            <span class="text-[10px] text-base-content/40">
              {{ formatShortDate(note.created_at) }}
            </span>
          </div>
        </div>
      `
    }
  }
}
</script>

<style scoped>
.plaza-page {
  padding-bottom: 0.5rem;
}
</style>
