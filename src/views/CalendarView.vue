<template>
  <div class="calendar-page">
    <!-- 加载失败提示 -->
    <div v-if="loadError" class="acnh-card bg-white/95 p-4 mb-4">
      <p class="text-amber-800 text-sm mb-2">{{ loadError }}</p>
      <button class="btn btn-sm bg-[#7CB342] text-white" @click="loadVillagers">重试</button>
    </div>

    <!-- 主布局：左侧月历 + 右侧今日 -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- 左侧：月历 -->
      <div class="acnh-card bg-white/95 p-4 flex-1 min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 class="text-lg font-bold text-[#558B2F]">{{ displayYear }}年{{ displayMonth }}月</h2>
          <div class="flex items-center gap-1">
            <button class="btn btn-ghost btn-sm min-h-0 h-8 w-8 p-0" @click="prevMonth">
              <Icon icon="mdi:chevron-left" class="w-5 h-5" />
            </button>
            <button class="btn btn-ghost btn-sm min-h-0 h-8 px-3" @click="goToday">今天</button>
            <button class="btn btn-ghost btn-sm min-h-0 h-8 w-8 p-0" @click="nextMonth">
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

        <!-- 日期网格 -->
        <div class="grid grid-cols-7 gap-0.5">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            :class="[
              'min-h-[60px] sm:min-h-[70px] p-1 rounded-lg border',
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
              <div class="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                <div
                  v-for="(evt, ei) in (day.events || []).slice(0, 2)"
                  :key="ei"
                  :class="[
                    'text-[10px] px-1 py-0.5 rounded truncate',
                    evt.type === 'birthday' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                  ]"
                  :title="evt.title"
                >
                  {{ evt.title }}
                </div>
                <span
                  v-if="(day.events?.length || 0) > 2"
                  class="text-[10px] text-gray-500"
                >
                  +{{ day.events.length - 2 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：今日 -->
      <div class="acnh-card bg-white/95 p-4 w-full lg:w-80 shrink-0">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-[#558B2F]">今天</h3>
          <span class="text-sm text-gray-500">{{ todayStr }}</span>
        </div>

        <!-- 今日生日 -->
        <div v-if="todayBirthdays.length > 0" class="space-y-2">
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
        <div v-else class="text-center py-8 text-gray-500 text-sm">
          <Icon icon="mdi:calendar-blank" class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>今天没有小动物生日</p>
        </div>

        <!-- 选中日期详情 -->
        <div v-if="selectedDate && selectedDate !== todayStr" class="mt-6 pt-4 border-t">
          <h4 class="text-sm font-medium text-gray-600 mb-2">{{ selectedDate }}</h4>
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
          <p v-else class="text-sm text-gray-500">无生日</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted } from 'vue'
import { fetchAcnhData, getIconUrl } from '../lib/acnh-api'
import { VILLAGER_SPECIES_ZH } from '../lib/acnh-api'

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const currentDate = ref(new Date())
const selectedDate = ref(null)
const villagers = ref([])
const loadError = ref(null)

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

const selectedDateBirthdays = computed(() => {
  if (!selectedDate.value) return []
  return birthdayMap.value[selectedDate.value] || []
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
  return births.map(v => ({
    type: 'birthday',
    title: getVillagerName(v),
    ...v
  }))
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

async function loadVillagers() {
  loadError.value = null
  try {
    const raw = await fetchAcnhData('villagers')
    villagers.value = Object.values(raw)
  } catch (err) {
    console.error(err)
    loadError.value = err?.message || '小动物生日数据加载失败，请检查网络后重试'
    villagers.value = []
  }
}

onMounted(loadVillagers)
</script>

<style scoped>
.calendar-page {
  padding-bottom: 1rem;
}
</style>
