<template>
  <div class="calendar-page">
    <!-- 加载失败提示 -->
    <div v-if="loadError" class="acnh-card bg-white/95 p-4 mb-4">
      <p class="text-amber-800 text-sm mb-2">{{ loadError }}</p>
      <button class="btn btn-sm bg-[#7CB342] text-white" @click="loadData">重试</button>
    </div>

    <!-- 主布局：移动端上下堆叠，大屏左右 -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- 左侧：月历 -->
      <div class="acnh-card bg-white/95 p-4 sm:p-5 flex-1 min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 class="text-lg font-bold text-[#558B2F]">{{ displayYear }}年{{ displayMonth }}月</h2>
          <div class="flex items-center gap-1">
            <button class="btn btn-ghost min-h-(--touch-min) h-10 w-10 p-0 rounded-xl" @click="prevMonth" aria-label="上月">
              <Icon icon="mdi:chevron-left" class="w-5 h-5" />
            </button>
            <button class="btn btn-ghost min-h-(--touch-min) h-10 px-4 rounded-xl" @click="goToday">今天</button>
            <button class="btn btn-ghost min-h-(--touch-min) h-10 w-10 p-0 rounded-xl" @click="nextMonth" aria-label="下月">
              <Icon icon="mdi:chevron-right" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- 星期标题 -->
        <div class="grid grid-cols-7 gap-0.5 mb-2">
          <div v-for="d in weekDays" :key="d" class="text-center text-xs font-medium text-gray-500 py-1">
            {{ d }}
          </div>
        </div>

        <!-- 日期网格：移动端略大便于点击 -->
        <div class="calendar-grid grid grid-cols-7 gap-0.5">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            :class="[
              'min-h-[56px] sm:min-h-[70px] p-1.5 rounded-lg border overflow-visible',
              day?.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50',
              day?.isToday ? 'ring-2 ring-[#7CB342] ring-inset' : 'border-gray-100',
              day?.date ? 'cursor-pointer' : ''
            ]"
            @click="day?.date && selectDate(day)"
          >
            <div v-if="day" class="h-full flex flex-col">
              <span
                :class="[
                  'text-sm font-medium',
                  day.isToday ? 'text-[#558B2F]' : day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                ]"
              >
                {{ day.day }}
              </span>
              <div class="flex-1 mt-0.5 space-y-0.5 overflow-visible">
                <div
                  v-for="(evt, ei) in (day.events || []).slice(0, 3)"
                  :key="evt.id || evt.fileName || ei"
                  :class="[
                    'text-[10px] px-1 py-0.5 truncate flex items-center gap-0.5 event-block',
                    evt.type === 'birthday' ? 'bg-pink-100 text-pink-800 rounded' : 'bg-blue-100 text-blue-800',
                    evt.type === 'event' && getEventSpanClass(day, evt)
                  ]"
                  :title="evt.title"
                >
                  <img v-if="evt.icon" :src="evt.icon" class="w-3 h-3 object-contain shrink-0" alt="" />
                  <Icon v-else-if="evt.type === 'event'" icon="mdi:calendar-star" class="w-3 h-3 shrink-0" />
                  {{ evt.title }}
                </div>
                <span
                  v-if="(day.events?.length || 0) > 3"
                  class="text-[10px] text-gray-500"
                >
                  +{{ day.events.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：今日（移动端在上方月历下方） -->
      <div class="acnh-card bg-white/95 p-4 sm:p-5 w-full lg:w-80 shrink-0">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-[#558B2F]">今天</h3>
          <span class="text-sm text-gray-500">{{ todayStr }}</span>
        </div>

        <!-- 今日事件（节日+活动） -->
        <div v-if="todayApiEvents.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-600">🎉 节日/活动</h4>
          <div
            v-for="e in todayApiEvents"
            :key="e.id"
            class="flex items-center gap-2 p-2 rounded-xl bg-blue-50 border border-blue-100"
          >
            <img v-if="e.icon" :src="e.icon" class="w-8 h-8 rounded-lg object-contain" alt="" />
            <Icon v-else icon="mdi:calendar-star" class="w-8 h-8 text-blue-500" />
            <p class="font-medium text-sm">{{ e.title }}</p>
          </div>
        </div>

        <!-- 今日生日 -->
        <div v-if="todayBirthdays.length > 0" class="space-y-2 mt-4">
          <h4 class="text-sm font-medium text-gray-600">🎂 生日</h4>
          <div
            v-for="v in todayBirthdays"
            :key="v.fileName"
            class="flex items-center gap-2 p-2 rounded-xl bg-pink-50 border border-pink-100"
          >
            <img
              :src="getVillagerIcon(v.fileName)"
              :alt="getVillagerName(v)"
              class="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <p class="font-medium text-sm">{{ getVillagerName(v) }}</p>
              <p class="text-xs text-gray-500">{{ getSpeciesName(v.species) }}</p>
            </div>
          </div>
        </div>

        <!-- 无事件 -->
        <div v-else-if="todayBirthdays.length === 0 && todayApiEvents.length === 0" class="text-center py-8 text-gray-500 text-sm">
          <Icon icon="mdi:calendar-blank" class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>今天没有生日或节日</p>
        </div>

        <!-- 选中日期详情 -->
        <div v-if="selectedDate && selectedDate !== todayStr" class="mt-6 pt-4 border-t">
          <h4 class="text-sm font-medium text-gray-600 mb-2">{{ selectedDate }}</h4>
          <div v-if="selectedDateApiEvents.length > 0" class="space-y-2 mb-3">
            <div
              v-for="e in selectedDateApiEvents"
              :key="e.id"
              class="flex items-center gap-2 p-2 rounded-xl bg-blue-50"
            >
              <img v-if="e.icon" :src="e.icon" class="w-6 h-6 rounded object-contain" alt="" />
              <p class="font-medium text-sm">{{ e.title }}</p>
            </div>
          </div>
          <div v-if="selectedDateBirthdays.length > 0" class="space-y-2">
            <div
              v-for="v in selectedDateBirthdays"
              :key="v.fileName"
              class="flex items-center gap-2 p-2 rounded-xl bg-gray-50"
            >
              <img
                :src="getVillagerIcon(v.fileName)"
                :alt="getVillagerName(v)"
                class="w-8 h-8 rounded-lg object-cover"
              />
              <p class="font-medium text-sm">{{ getVillagerName(v) }}</p>
            </div>
          </div>
          <p v-else-if="selectedDateBirthdays.length === 0 && selectedDateApiEvents.length === 0" class="text-sm text-gray-500">无生日或节日</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted } from 'vue'
import { fetchAcnhData, getIconUrl, parseCalendarEvents } from '../lib/acnh-api'
import { VILLAGER_SPECIES_ZH } from '../lib/acnh-api'
import { useAuthStore } from '../stores/auth'
import { useCatalogueStore } from '../stores/catalogue'

const authStore = useAuthStore()
const catalogueStore = useCatalogueStore()

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const currentDate = ref(new Date())
const selectedDate = ref(null)
const villagers = ref([])
const apiEventsMap = ref({})
const loadError = ref(null)

// 计算多日事件的连续区间，用于「连在一起」展示
// 返回 { "month/day": { eventId: { isStart, isEnd, spanLength } } }
const eventSpanInfo = computed(() => {
  const info = {}
  const dates = Object.keys(apiEventsMap.value).sort((a, b) => {
    const [ma, da] = a.split('/').map(Number)
    const [mb, db] = b.split('/').map(Number)
    return ma !== mb ? ma - mb : da - db
  })
  for (const key of dates) {
    const evts = apiEventsMap.value[key] || []
    for (const evt of evts) {
      if (evt.type !== 'event' || !evt.id) continue
      if (!info[key]) info[key] = {}
      info[key][evt.id] = { isStart: true, isEnd: true, spanLength: 1 }
    }
  }
  for (const key of dates) {
    const evts = apiEventsMap.value[key] || []
    for (const evt of evts) {
      if (evt.type !== 'event' || !evt.id) continue
      const [m, d] = key.split('/').map(Number)
      const prevKey = d > 1 ? `${m}/${d - 1}` : (m > 1 ? `${m - 1}/${new Date(2000, m - 1, 0).getDate()}` : null)
      const lastDay = new Date(2000, m, 0).getDate()
      const nextKey = d < lastDay ? `${m}/${d + 1}` : (m < 12 ? `${m + 1}/1` : null)
      const prevHas = prevKey && (apiEventsMap.value[prevKey] || []).some(e => e.id === evt.id)
      const nextHas = nextKey && (apiEventsMap.value[nextKey] || []).some(e => e.id === evt.id)
      if (prevHas || nextHas) {
        let spanLen = 1
        let k = key
        while (true) {
          const [mm, dd] = k.split('/').map(Number)
          const lastD = new Date(2000, mm, 0).getDate()
          const nk = dd < lastD ? `${mm}/${dd + 1}` : (mm < 12 ? `${mm + 1}/1` : null)
          if (!nk || !(apiEventsMap.value[nk] || []).some(e => e.id === evt.id)) break
          spanLen++
          k = nk
        }
        info[key][evt.id] = {
          isStart: !prevHas,
          isEnd: !nextHas,
          spanLength: spanLen
        }
      }
    }
  }
  return info
})

const displayYear = computed(() => currentDate.value.getFullYear())
const displayMonth = computed(() => currentDate.value.getMonth())

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()}`
})

const birthdayMap = computed(() => {
  const map = {}
  for (const v of villagers.value) {
    const b = v.birthday
    if (!b) continue
    const parts = b.split('/').map(Number)
    const [day, month] = parts.length >= 2 ? [parts[0], parts[1]] : [1, 1]
    const key = `${month}/${day}`
    if (!map[key]) map[key] = []
    map[key].push({ ...v, fileName: v['file-name'] })
  }
  return map
})

const todayBirthdays = computed(() => birthdayMap.value[todayStr.value] || [])

const todayApiEvents = computed(() => apiEventsMap.value[todayStr.value] || [])

const selectedDateBirthdays = computed(() => {
  if (!selectedDate.value) return []
  return birthdayMap.value[selectedDate.value] || []
})

const selectedDateApiEvents = computed(() => {
  if (!selectedDate.value) return []
  return apiEventsMap.value[selectedDate.value] || []
})

const calendarDays = computed(() => {
  const year = displayYear.value
  const month = displayMonth.value
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = last.getDate()

  const today = new Date()
  const isToday = (d, m) => d === today.getDate() && m === today.getMonth() && year === today.getFullYear()

  const result = []
  for (let i = 0; i < startPad; i++) {
    const prev = new Date(year, month, -startPad + i + 1)
    result.push({
      day: prev.getDate(),
      date: prev,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(prev.getMonth() + 1, prev.getDate())
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    result.push({
      day: d,
      date,
      isCurrentMonth: true,
      isToday: isToday(d, month),
      events: getEventsForDate(month + 1, d)
    })
  }
  const remaining = 42 - result.length
  for (let i = 0; i < remaining; i++) {
    const next = new Date(year, month + 1, i + 1)
    result.push({
      day: next.getDate(),
      date: next,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(next.getMonth() + 1, next.getDate())
    })
  }
  return result
})

function getEventsForDate(month, day) {
  const key = `${month}/${day}`
  const births = birthdayMap.value[key] || []
  const apiEvts = apiEventsMap.value[key] || []
  return [
    ...births.map(v => ({ type: 'birthday', title: getVillagerName(v), ...v })),
    ...apiEvts
  ]
}

function getEventSpanClass(day, evt) {
  if (evt.type !== 'event' || !evt.id) return 'rounded'
  const key = `${day.date.getMonth() + 1}/${day.date.getDate()}`
  const span = eventSpanInfo.value[key]?.[evt.id]
  if (!span || span.spanLength <= 1) return 'rounded'
  const classes = []
  if (span.isStart) classes.push('rounded-l')
  if (span.isEnd) classes.push('rounded-r')
  if (!span.isStart) classes.push('-ml-px')
  if (!span.isEnd) classes.push('-mr-px')
  return classes.join(' ') || 'rounded'
}

function getVillagerName(v) {
  const n = v?.name
  if (!n) return ''
  return n['name-CNzh'] || n['name-TWzh'] || n['name-USen'] || Object.values(n)[0] || ''
}

function getSpeciesName(s) {
  return VILLAGER_SPECIES_ZH[s] || s || ''
}

function getVillagerIcon(fileName) {
  return getIconUrl('villagers', fileName)
}

function prevMonth() {
  currentDate.value = new Date(displayYear.value, displayMonth.value - 1)
}

function nextMonth() {
  currentDate.value = new Date(displayYear.value, displayMonth.value + 1)
}

function goToday() {
  currentDate.value = new Date()
  selectedDate.value = null
}

function selectDate(day) {
  selectedDate.value = `${day.date.getMonth() + 1}/${day.date.getDate()}`
}

async function loadData() {
  loadError.value = null
  try {
    const hemisphere = authStore.profile?.hemisphere === 'south' ? 'south' : 'north'
    const rawData = await catalogueStore.prefetch()
    apiEventsMap.value = parseCalendarEvents(rawData, hemisphere)

    const raw = await fetchAcnhData('villagers')
    villagers.value = Array.isArray(raw) ? raw : Object.values(raw)
  } catch (err) {
    console.error(err)
    loadError.value = err?.message || '数据加载失败，请检查网络后重试'
    villagers.value = []
  }
}

onMounted(loadData)
</script>

<style scoped>
.calendar-page {
  padding-bottom: 1rem;
}
</style>
