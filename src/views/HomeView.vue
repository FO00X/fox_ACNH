<template>
  <div class="plaza-page space-y-4 motion-rise">

    <!-- 日期与时间 -->
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 flex-wrap text-left rounded-2xl p-1 -m-1 hover:bg-base-200/60 active:scale-[0.99] transition-transform tap-lift"
      aria-label="打开日历"
      @click="goCalendar"
    >
      <p class="text-lg font-bold text-base-content">{{ dateLabel }}</p>
      <span class="badge badge-lg rounded-2xl bg-[#EFE0E0] text-base-content border-0 px-4 py-2">
        {{ timeLabel }}
      </span>
    </button>

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
      <div class="px-4 grid grid-cols-4 gap-3">
        <button
          v-for="task in dailyTasks"
          :key="task.to"
          type="button"
          class="flex flex-col items-center gap-1.5 rounded-2xl p-2 hover:bg-base-200/60 active:scale-95 transition-transform tap-lift"
          @click="onDailyTaskClick(task)"
        >
          <div
            class="progress-ring w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            :class="isTaskDone(task.id) ? 'is-done' : ''"
            :style="getTaskRingStyle(task.id)"
            :title="`${getTaskProgress(task.id)}/${getTaskRequiredCount(task.id)}`"
          >
            <div class="progress-ring__inner w-10 h-10 rounded-full bg-[#FFFDE7] flex items-center justify-center">
              <Icon :icon="task.icon" class="w-6 h-6 text-[#F9A825]" />
            </div>
          </div>
          <span class="text-xs font-medium text-center leading-tight">
            {{ task.label }}
          </span>
        </button>
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
                  <div class="flex items-center gap-3 min-w-0">
                    <Icon :icon="task.icon" class="w-6 h-6 text-[#F9A825] shrink-0" />
                    <div class="min-w-0">
                      <p class="font-medium truncate">{{ task.label }}</p>
                      <p class="text-xs opacity-70">
                        今日：{{ getTaskProgress(task.id) }}/{{ getTaskRequiredCount(task.id) }}
                        <span v-if="isTaskDone(task.id)" class="text-success font-medium">（已完成）</span>
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-xs opacity-70 hidden sm:inline">次数</label>
                    <input
                      type="number"
                      class="input input-bordered input-sm w-20 rounded-xl"
                      min="1"
                      max="99"
                      :value="getTaskRequiredCount(task.id)"
                      @change="setTaskRequiredCount(task.id, $event.target.value)"
                      title="设置需要完成的次数（默认 1）"
                    />
                  <button
                    type="button"
                    class="btn btn-outline btn-sm rounded-xl min-h-0 h-9"
                    title="移除此项"
                    @click="removeDailyTask(task.id)"
                  >
                    移除
                  </button>
                  </div>
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
            <div class="flex gap-2">
              <button type="button" class="btn btn-outline rounded-2xl flex-1 h-12" @click="resetTodayProgress">
                重置今日进度
              </button>
              <button type="button" class="btn btn-success rounded-2xl flex-1 h-12 text-base" @click="showDailyTasksDrawer = false">
              完成
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 广场便签板 -->
    <div ref="notesSectionRef">
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
              @item-click="openItemDetail"
            />
            <div v-if="filteredNotes.length === 0" class="col-span-2 text-center text-sm text-white/60 py-8">
              {{ searchQuery.trim() ? '没有匹配的便签' : '还没有便签，先贴一张自己的需求吧～' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 便签弹窗 -->
    <dialog
      ref="noteDialogRef"
      class="modal"
      aria-label="便签详情"
      @close="onNoteDialogClose"
    >
      <div class="modal-box max-w-lg w-11/12 p-0 overflow-hidden">
        <div class="p-4 border-b border-base-200 flex items-start gap-3">
          <div class="w-14 h-14 rounded-2xl bg-base-200/60 border border-base-300 flex items-center justify-center overflow-hidden shrink-0">
            <img
              v-if="noteResolved?.iconUrl"
              :src="noteResolved.iconUrl"
              :alt="noteResolved.displayName || activeNote?.item_name || ''"
              class="w-full h-full object-contain"
              loading="lazy"
            />
            <Icon v-else icon="mdi:package-variant-closed" class="w-7 h-7 opacity-60" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-base leading-snug wrap-break-word">
              {{ noteResolved?.displayName || activeNote?.item_name || '' }}
              <span v-if="activeNote?.quantity > 1" class="font-semibold opacity-70"> ×{{ activeNote.quantity }}</span>
            </p>
            <p class="text-xs opacity-70 mt-1">
              {{ activeNote?.ownerName || '岛民' }} · {{ activeNote?.ownerIsland || '小岛' }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span
                v-if="activeNote?.is_fulfilled"
                class="badge badge-success badge-sm rounded-xl"
              >
                已完成
              </span>
              <span
                v-else
                class="badge badge-warning badge-sm rounded-xl"
              >
                未完成
              </span>
              <span v-if="noteResolveLoading" class="badge badge-ghost badge-sm rounded-xl">匹配中…</span>
              <span v-else-if="noteResolved && !noteResolved.matched" class="badge badge-ghost badge-sm rounded-xl">未匹配到图鉴条目</span>
              <span v-else-if="noteResolved?.matched" class="badge badge-ghost badge-sm rounded-xl">已匹配：{{ noteResolved.categoryLabel }}</span>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm btn-circle" aria-label="关闭" @click="closeNoteDialog">
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 space-y-3">
          <div class="rounded-2xl bg-base-200/40 border border-base-200 p-3 text-sm leading-relaxed">
            <p class="opacity-80">
              点击下方按钮可以去图鉴查看该物品/生物的详细信息，并在这里标记完成状态。
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-outline rounded-2xl"
              :disabled="!noteResolved?.matched"
              @click="openResolvedDetail"
            >
              <Icon icon="mdi:information-outline" class="w-5 h-5" />
              查看详情（弹窗）
            </button>
            <button
              type="button"
              class="btn btn-primary rounded-2xl"
              :disabled="!noteResolved?.matched"
              @click="jumpToCatalogue"
            >
              <Icon icon="mdi:book-open-page-variant" class="w-5 h-5" />
              跳转到图鉴
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              class="btn rounded-2xl"
              :class="activeNote?.is_fulfilled ? 'btn-outline' : 'btn-success'"
              :disabled="noteActionLoading || !activeNote"
              @click="toggleFulfilledFromDialog"
            >
              <Icon :icon="activeNote?.is_fulfilled ? 'mdi:undo-variant' : 'mdi:check-circle-outline'" class="w-5 h-5" />
              {{ activeNote?.is_fulfilled ? '标记为未完成' : '标记为已完成' }}
            </button>
            <button type="button" class="btn btn-ghost rounded-2xl" @click="closeNoteDialog">关闭</button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="关闭">关闭</button>
      </form>
    </dialog>

    <!-- 物品详情弹窗 -->
    <dialog
      ref="detailDialogRef"
      class="modal catalogue-detail-modal"
      aria-label="物品详情"
      @close="onDetailDialogClose"
    >
      <div class="modal-box flex flex-col max-h-[90vh] p-0 overflow-hidden w-11/12 max-w-2xl sm:w-[95vw] sm:max-w-[95vw] sm:rounded-none sm:m-0 sm:h-screen">
        <CatalogueDetailContent
          :category="detailCategory"
          :item-id="detailItemId"
          @close="closeDetailDialog"
        />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="关闭">关闭</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, ref, onMounted, nextTick } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { CATALOGUE_CATEGORIES, fetchAcnhData, getIconUrl as getIconUrlFromApi } from '../lib/acnh-api'
import NoteCard from '../components/NoteCard.vue'
import CatalogueDetailContent from '../components/catalogue/CatalogueDetailContent.vue'

const authStore = useAuthStore()
const router = useRouter()
const notesSectionRef = ref(null)

// 物品详情弹窗状态
const showDetailDialog = ref(false)
const detailCategory = ref('')
const detailItemId = ref('')
const detailDialogRef = ref(null)

// 便签弹窗状态
const noteDialogRef = ref(null)
const activeNote = ref(null)
const noteResolveLoading = ref(false)
const noteActionLoading = ref(false)
const noteResolved = ref(null)
const noteResolveCache = new Map()

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
const DAILY_TASKS_REQUIRED_COUNTS_KEY = 'acnh_daily_task_required_counts'
const DAILY_TASKS_PROGRESS_KEY = 'acnh_daily_task_progress'
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

const todayKey = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function loadRequiredCounts() {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_REQUIRED_COUNTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

function saveRequiredCounts(map) {
  try {
    localStorage.setItem(DAILY_TASKS_REQUIRED_COUNTS_KEY, JSON.stringify(map || {}))
  } catch (_) {}
}

function loadProgressAll() {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_PROGRESS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

function saveProgressAll(map) {
  try {
    localStorage.setItem(DAILY_TASKS_PROGRESS_KEY, JSON.stringify(map || {}))
  } catch (_) {}
}

const requiredCounts = ref(loadRequiredCounts())
const progressAll = ref(loadProgressAll())

const todayProgress = computed(() => {
  const all = progressAll.value || {}
  const row = all[todayKey.value]
  return row && typeof row === 'object' ? row : {}
})

function getTaskRequiredCount(taskId) {
  const n = Number(requiredCounts.value?.[taskId])
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 99) : 1
}

function setTaskRequiredCount(taskId, value) {
  const n = Number(value)
  const val = Number.isFinite(n) ? Math.min(Math.max(1, Math.floor(n)), 99) : 1
  requiredCounts.value = { ...(requiredCounts.value || {}), [taskId]: val }
  saveRequiredCounts(requiredCounts.value)
}

function getTaskProgress(taskId) {
  const n = Number(todayProgress.value?.[taskId] || 0)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function isTaskDone(taskId) {
  return getTaskProgress(taskId) >= getTaskRequiredCount(taskId)
}

function bumpTaskProgress(taskId) {
  const all = { ...(progressAll.value || {}) }
  const day = todayKey.value
  const row = { ...(all[day] || {}) }
  row[taskId] = Math.min(getTaskProgress(taskId) + 1, 999)
  all[day] = row
  progressAll.value = all
  saveProgressAll(all)
}

function resetTodayProgress() {
  const all = { ...(progressAll.value || {}) }
  all[todayKey.value] = {}
  progressAll.value = all
  saveProgressAll(all)
}

function onDailyTaskClick(task) {
  if (!task?.id) return
  bumpTaskProgress(task.id)
}

function getTaskRingStyle(taskId) {
  const required = getTaskRequiredCount(taskId)
  const done = getTaskProgress(taskId)
  const ratio = required > 0 ? Math.max(0, Math.min(1, done / required)) : 0
  const deg = Math.round(ratio * 360)
  return {
    background: `conic-gradient(var(--acnh-ring, #7CB342) ${deg}deg, rgba(0,0,0,0.12) 0deg)`
  }
}

function goCalendar() {
  router.push('/calendar')
}

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
  activeNote.value = note
  noteResolved.value = null
  noteResolveLoading.value = true
  nextTick(() => {
    noteDialogRef.value?.showModal()
  })
  await resolveNoteToCatalogueEntry(note)
}

function scrollToNotes() {
  notesSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 物品详情弹窗方法
function openItemDetail(note) {
  // 根据便签类型确定对应的图鉴分类
  const categoryMap = {
    material: 'misc',
    furniture: 'housewares',
    other: 'misc'
  }
  
  detailCategory.value = categoryMap[note.item_type] || 'misc'
  detailItemId.value = note.item_name
  showDetailDialog.value = true
  nextTick(() => {
    detailDialogRef.value?.showModal()
  })
}

function closeDetailDialog() {
  detailDialogRef.value?.close()
}

function onDetailDialogClose() {
  showDetailDialog.value = false
}

function closeNoteDialog() {
  noteDialogRef.value?.close()
}

function onNoteDialogClose() {
  activeNote.value = null
  noteResolved.value = null
  noteResolveLoading.value = false
  noteActionLoading.value = false
}

function getItemDisplayName(item) {
  const n = item?.name
  if (!n) return ''
  return n['name-CNzh'] || n['name-TWzh'] || n['name-USen'] || n['name-JPja'] || Object.values(n)[0] || ''
}

function normalizeName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·•\u00b7]/g, '')
}

function getItemIdForCategory(categoryId, item) {
  if (['houseware', 'misc', 'wallmounted'].includes(categoryId) && item?.baseKey != null) return String(item.baseKey)
  return item?.['file-name'] || item?.fileName || item?.id || ''
}

async function resolveNoteToCatalogueEntry(note) {
  const name = (note?.item_name || '').trim()
  const cacheKey = `${name}`
  if (!name) {
    noteResolved.value = { matched: false }
    noteResolveLoading.value = false
    return
  }
  if (noteResolveCache.has(cacheKey)) {
    noteResolved.value = noteResolveCache.get(cacheKey)
    noteResolveLoading.value = false
    return
  }

  const target = normalizeName(name)
  const categoryOrder = CATALOGUE_CATEGORIES.map((c) => c.id)
  for (const categoryId of categoryOrder) {
    try {
      const items = await fetchAcnhData(categoryId)
      if (!Array.isArray(items) || items.length === 0) continue

      // 先精确匹配（去空格/点号）
      let hit = items.find((it) => normalizeName(getItemDisplayName(it)) === target)
      if (!hit && categoryId === 'villagers') {
        // villagers 有时展示为 "名字 · 物种"
        hit = items.find((it) => target.startsWith(normalizeName(getItemDisplayName(it))))
      }
      if (!hit) continue

      const itemId = getItemIdForCategory(categoryId, hit)
      const iconUrl = getIconUrlFromApi(categoryId, hit?.iconPath || hit?.['file-name'] || hit?.fileName || hit?.id || '')
      const resolved = {
        matched: true,
        categoryId,
        categoryLabel: CATALOGUE_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId,
        itemId,
        displayName: getItemDisplayName(hit) || name,
        iconUrl
      }
      noteResolveCache.set(cacheKey, resolved)
      noteResolved.value = resolved
      noteResolveLoading.value = false
      return
    } catch (_) {
      // ignore and continue
    }
  }

  const resolved = { matched: false, displayName: name }
  noteResolveCache.set(cacheKey, resolved)
  noteResolved.value = resolved
  noteResolveLoading.value = false
}

function openResolvedDetail() {
  if (!noteResolved.value?.matched) return
  detailCategory.value = noteResolved.value.categoryId
  detailItemId.value = noteResolved.value.itemId
  showDetailDialog.value = true
  nextTick(() => {
    detailDialogRef.value?.showModal()
  })
}

function jumpToCatalogue() {
  if (!noteResolved.value?.matched) return
  try {
    localStorage.setItem(
      'acnh_catalogue_jump',
      JSON.stringify({
        categoryId: noteResolved.value.categoryId,
        itemId: noteResolved.value.itemId,
        search: activeNote.value?.item_name || ''
      })
    )
  } catch (_) {}
  closeNoteDialog()
  router.push('/catalogue')
}

async function setFulfilled(note, fulfilled) {
  if (!note?.id || !authStore.user) return
  const payload = fulfilled
    ? { is_fulfilled: true, fulfilled_by: authStore.user.id, fulfilled_at: new Date().toISOString() }
    : { is_fulfilled: false, fulfilled_by: null, fulfilled_at: null }
  await supabase.from('wishlist_items').update(payload).eq('id', note.id)
}

async function toggleFulfilledFromDialog() {
  if (!activeNote.value) return
  noteActionLoading.value = true
  try {
    await setFulfilled(activeNote.value, !activeNote.value.is_fulfilled)
    await loadNotes()
    // 重新定位 activeNote（loadNotes 生成了新对象）
    activeNote.value = notes.value.find((n) => n.id === activeNote.value.id) || activeNote.value
  } finally {
    noteActionLoading.value = false
  }
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

/* 每日事项：圆环进度 */
.progress-ring {
  --acnh-ring: #7cb342;
  padding: 2px;
}

.progress-ring.is-done {
  --acnh-ring: #22c55e;
}
</style>
