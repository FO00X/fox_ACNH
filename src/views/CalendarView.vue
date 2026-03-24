<template>
  <div class="calendar-page">
    <div v-if="loadError" class="p-4 mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <p class="text-amber-800 dark:text-amber-200 text-sm mb-2">{{ loadError }}</p>
      <button class="btn btn-sm bg-[#7CB342] text-white" @click="loadData">重试</button>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-sm rounded-xl"
            :title="calendarDisplayMode === 'compact' ? '当前：简洁，点击切换为全部展开' : '当前：全部展开，点击切换为简洁'"
            @click="calendarDisplayMode = calendarDisplayMode === 'compact' ? 'full' : 'compact'"
          >
            <Icon icon="mdi:exchange" width="24" height="24" class="shrink-0" />
            <span class="hidden sm:inline">{{ calendarDisplayMode === 'compact' ? '简洁' : '全部' }}</span>
          </button>
          <h2 class="text-lg font-bold text-[#558B2F]">{{ displayYear }}年{{ displayMonth + 1 }}月</h2>
        </div>
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

      <div class="container" :class="{ 'calendar-full-mode': calendarDisplayMode === 'full' }">
          <div class="calendar-grid">
            <!-- 星期标题：星期日 … 星期六 -->
            <div class="header">
              <div v-for="w in weekDayLabels" :key="w" class="weekday">{{ w }}</div>
            </div>

            <!-- 月历：每周一行 -->
            <template v-for="(week, wi) in calendarWeeks" :key="'m-' + wi">
              <div class="week">
                <!-- 第一行：日期格（1-7 / 8-14 / …） -->
                <template v-for="(cell, ci) in week.days" :key="'d-' + wi + '-' + ci">
                  <button
                    v-if="cell.isCurrentMonth"
                    :class="['day', 'day-' + (ci + 1), 'span-1', calendarDisplayMode === 'compact' ? 'day-with-icons' : '', cell.isToday ? 'now' : '']"
                    :data-day="cell.dayNum"
                    :title="(calendarDisplayMode === 'compact' && (cell.hasBirthdays || cell.hasEvents)) ? '点击查看详情' : ''"
                    @click="openDetail(cell)"
                  >
                    <template v-if="calendarDisplayMode === 'compact'">
                      <span class="day-num">{{ cell.dayNum }}</span>
                      <span v-if="cell.hasBirthdays || cell.hasEvents" class="day-icons">
                        <Icon v-if="cell.hasBirthdays" icon="mdi:cake-variant" class="day-icon birthday-icon" title="生日" />
                        <Icon v-if="cell.hasEvents" icon="mdi:calendar-star" class="day-icon event-icon" title="节日/活动" />
                      </span>
                    </template>
                    <template v-else>{{ cell.dayNum }}</template>
                  </button>
                  <div
                    v-else
                    :class="['day', 'outside', 'day-' + (ci + 1), 'span-1']"
                    :data-day="cell.dayNum"
                  >
                    {{ cell.dayNum }}
                  </div>
                </template>

                <!-- 全部模式：展开显示生日与活动 -->
                <template v-if="calendarDisplayMode === 'full'">
                  <button
                    v-for="b in week.birthdays"
                    :key="'b-' + b.key"
                    :class="['item-link', 'birthday', 'day-' + b.weekday, 'span-1']"
                    :data-id="b.id"
                    @click="openDetail(b.dateCell)"
                  >
                    <img v-if="b.icon" :src="b.icon" loading="lazy" :alt="b.name" @error="onImgError" />
                    <Icon v-else icon="mdi:account" class="icon-fallback" />
                    <span class="name">{{ b.name }}</span>
                  </button>
                  <button
                    v-for="ev in week.events"
                    :key="'e-' + ev.id + '-' + wi + '-' + (ev.startCol || 1)"
                    :class="['event-btn', 'day-' + (ev.startCol || 1), 'span-' + (ev.span || 7), ev.noSearch ? 'no-search' : '', eventCategoryClass(ev.id)]"
                    :data-id="ev.id"
                    @click="openDetail(ev.anyDate)"
                  >
                    <img v-if="ev.icon" :src="ev.icon" loading="lazy" class="icon" alt="" @error="onImgError" />
                    <Icon v-else icon="mdi:calendar-star" class="icon icon-fallback" />
                    <span class="name">{{ ev.title }}</span>
                    <span v-if="ev.region" class="region" :data-region="ev.region">{{ ev.region }}</span>
                  </button>
                </template>
              </div>
            </template>
          </div>
        </div>
    </div>

    <!-- 选中日期详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetailDialog" class="calendar-detail-backdrop" @click.self="closeDetail">
        <div class="calendar-detail-dialog" role="dialog" aria-modal="true" :aria-label="detailDialogTitle">
          <div class="calendar-detail-header">
            <h3 class="calendar-detail-title">{{ detailDialogTitle }}</h3>
            <button type="button" class="btn btn-ghost btn-circle btn-sm" aria-label="关闭" @click="closeDetail">
              <Icon icon="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          <div class="calendar-detail-body">
            <div v-if="detailApiEvents.length > 0" class="space-y-2">
              <h4 class="text-sm font-medium text-gray-600">🎉 节日/活动</h4>
              <div
                v-for="e in detailApiEvents"
                :key="e.id"
                class="flex items-center gap-2 p-2 rounded-xl bg-blue-50 border border-blue-100"
              >
                <img v-if="e.icon" :src="e.icon" class="w-8 h-8 rounded-lg object-contain" alt="" />
                <Icon v-else icon="mdi:calendar-star" class="w-8 h-8 text-blue-500" />
                <p class="font-medium text-sm">{{ e.title }}</p>
              </div>
            </div>
            <div v-if="detailBirthdays.length > 0" class="space-y-2 mt-4">
              <h4 class="text-sm font-medium text-gray-600">🎂 生日</h4>
              <div
                v-for="v in detailBirthdays"
                :key="v.fileName"
                class="flex items-center gap-2 p-2 rounded-xl bg-pink-50 border border-pink-100"
              >
                <img :src="getVillagerIcon(v.fileName)" :alt="getVillagerName(v)" class="w-10 h-10 rounded-lg object-cover" />
                <div>
                  <p class="font-medium text-sm">{{ getVillagerName(v) }}</p>
                  <p class="text-xs text-gray-500">{{ getSpeciesName(v.species) }}</p>
                </div>
              </div>
            </div>
            <div v-if="detailUserBirthdays.length > 0" class="space-y-2 mt-4">
              <h4 class="text-sm font-medium text-gray-600">岛民生日</h4>
              <div
                v-for="u in detailUserBirthdays"
                :key="u.id"
                class="flex items-center gap-2 p-2 rounded-xl bg-violet-50 border border-violet-100"
              >
                <img v-if="u.avatar_url" :src="u.avatar_url" :alt="u.display_name" class="w-10 h-10 rounded-lg object-cover" />
                <div v-else class="w-10 h-10 rounded-lg bg-violet-200/70 flex items-center justify-center text-violet-700">
                  <Icon icon="mdi:account" class="w-5 h-5" />
                </div>
                <div>
                  <p class="font-medium text-sm">{{ u.display_name || '岛民' }}</p>
                  <p class="text-xs text-gray-500">{{ u.island_name || '未命名小岛' }}</p>
                </div>
              </div>
            </div>
            <div
              v-if="detailBirthdays.length === 0 && detailUserBirthdays.length === 0 && detailApiEvents.length === 0"
              class="text-center py-8 text-gray-500 text-sm"
            >
              <Icon icon="mdi:calendar-blank" class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>该日没有生日或节日</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, onMounted, watch } from 'vue'
import { fetchAcnhData, getIconUrl, parseCalendarEvents } from '../lib/acnh-api'
import { VILLAGER_SPECIES_ZH } from '../lib/acnh-api'
import { useAuthStore } from '../stores/auth'
import { useCatalogueStore } from '../stores/catalogue'
import { supabase } from '../lib/supabase'
import { logActivity, ACTIVITY_KIND } from '../lib/activityLog'

const NPC_ICON_CDN = 'https://nh-cdn.catalogue.ac/NpcIcon'

const authStore = useAuthStore()
const catalogueStore = useCatalogueStore()

const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六']

const calendarDisplayMode = ref('compact') // 'compact' 仅图标 | 'full' 全部展开
const currentDate = ref(new Date())
const selectedDate = ref(null)
const showDetailDialog = ref(false)
const villagers = ref([])
const usersWithBirthday = ref([])
const apiEventsMap = ref({})
const loadError = ref(null)
const myCollectedVillagers = ref([]) // 用户拥有的村民

const displayYear = computed(() => currentDate.value.getFullYear())
const displayMonth = computed(() => currentDate.value.getMonth())

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}/${d.getDate()}`
})

const detailDateStr = computed(() => selectedDate.value || todayStr.value)

const detailDialogTitle = computed(() => {
  if (!selectedDate.value) return ''
  const [m, d] = selectedDate.value.split('/').map(Number)
  const today = new Date()
  const isToday = m === today.getMonth() + 1 && d === today.getDate()
  return isToday ? `今天 ${m}月${d}日` : `${m}月${d}日`
})

const birthdayMap = computed(() => {
  const map = {}
  for (const v of villagers.value) {
    const b = v.birthday
    if (!b) continue
    const parts = b.split('/').map(Number)
    // villagers 的 birthday 来自 vbd: [month(0-11), day]，transformVillagers 组装为 `${month}/${day}`
    // 这里需要按 month/day 解析，并将 0-based month 转为 1-based，才能对齐 dateKey（如 "3/17"）
    const [rawMonth, day] = parts.length >= 2 ? [parts[0], parts[1]] : [0, 1]
    const month = (Number.isFinite(rawMonth) ? rawMonth : 0) + 1
    const key = `${month}/${day}`
    if (!map[key]) map[key] = []
    map[key].push({ ...v, fileName: v['file-name'] })
  }
  return map
})

const userBirthdayMap = computed(() => {
  const map = {}
  for (const u of usersWithBirthday.value) {
    if (!u?.birthday) continue
    const date = new Date(u.birthday)
    if (Number.isNaN(date.getTime())) continue
    const key = `${date.getMonth() + 1}/${date.getDate()}`
    if (!map[key]) map[key] = []
    map[key].push(u)
  }
  return map
})

// 按周拆分：每周 7 格（日→六），每格可空（上月/下月）
const calendarWeeks = computed(() => {
  const year = displayYear.value
  const month = displayMonth.value
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const daysInMonth = last.getDate()
  const today = new Date()
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const flatCells = []
  for (let i = 0; i < startPad; i++) {
    const prev = new Date(year, month, -startPad + i + 1)
    flatCells.push({
      dayNum: prev.getDate(),
      dateKey: `${prev.getMonth() + 1}/${prev.getDate()}`,
      isCurrentMonth: false,
      isToday: false,
      date: prev
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    flatCells.push({
      dayNum: d,
      dateKey: `${month + 1}/${d}`,
      isCurrentMonth: true,
      isToday: isToday(d),
      date
    })
  }
  const remaining = 42 - flatCells.length
  for (let i = 0; i < remaining; i++) {
    const next = new Date(year, month + 1, i + 1)
    flatCells.push({
      dayNum: next.getDate(),
      dateKey: `${next.getMonth() + 1}/${next.getDate()}`,
      isCurrentMonth: false,
      isToday: false,
      date: next
    })
  }

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const start = w * 7
    const days = flatCells.slice(start, start + 7)
    const weekDates = days.map((c) => c.dateKey)
    const weekDateCells = days.map((c) => {
      const key = c.dateKey
      const hasBirthdays = ((birthdayMap.value[key] || []).length + (userBirthdayMap.value[key] || []).length) > 0
      const hasEvents = (apiEventsMap.value[key] || []).length > 0
      return {
        ...c,
        weekday: c.date.getDay() + 1,
        hasBirthdays,
        hasEvents
      }
    })

    const birthdays = []
    days.forEach((cell, col) => {
      const key = cell.dateKey
      const vb = (birthdayMap.value[key] || []).map((v) => ({
        key: 'v-' + v.id + '-' + key,
        id: v.id || v.fileName,
        name: getVillagerName(v),
        icon: `${NPC_ICON_CDN}/${v.id || v.fileName}.png`,
        weekday: col + 1,
        dateCell: cell
      }))
      const ub = (userBirthdayMap.value[key] || []).map((u) => ({
        key: 'u-' + u.id + '-' + key,
        id: u.id,
        name: u.display_name || '岛民',
        icon: u.avatar_url || null,
        weekday: col + 1,
        dateCell: cell
      }))
      birthdays.push(...vb, ...ub)
    })

    const eventsInWeek = []
    const eventIdToKeys = {}
    for (const key of Object.keys(apiEventsMap.value || {})) {
      for (const ev of apiEventsMap.value[key] || []) {
        if (ev.type !== 'event' || !ev.id) continue
        if (!eventIdToKeys[ev.id]) eventIdToKeys[ev.id] = []
        if (!eventIdToKeys[ev.id].includes(key)) eventIdToKeys[ev.id].push(key)
      }
    }
    const addedEventIds = new Set()
    for (const key of weekDates) {
      if (!key) continue
      for (const ev of apiEventsMap.value[key] || []) {
        if (ev.type !== 'event' || !ev.id || addedEventIds.has(ev.id)) continue
        addedEventIds.add(ev.id)
        const keysThisWeek = (eventIdToKeys[ev.id] || []).filter((k) => weekDates.includes(k))
        if (keysThisWeek.length === 0) continue
        const cols = keysThisWeek.map((k) => weekDates.indexOf(k) + 1)
        const startCol = Math.min(...cols)
        const endCol = Math.max(...cols)
        const span = endCol - startCol + 1
        const anyDate = days[cols[0] - 1]
        eventsInWeek.push({
          id: ev.id,
          title: ev.title,
          icon: ev.icon,
          startCol,
          span,
          noSearch: /season|seasonal/i.test(ev.id),
          region: ev.region || null,
          anyDate
        })
      }
    }
    weeks.push({ days: weekDateCells, birthdays, events: eventsInWeek })
  }
  return weeks
})

function eventCategoryClass(id) {
  if (!id) return 'event'
  const s = String(id).toLowerCase()
  if (s.includes('season') || /^(spring|summer|fall|winter)/.test(s)) return 'season'
  if (s.includes('craft') || s.includes('acorn') || s.includes('pinecone')) return 'crafting'
  if (s.includes('zodiac') || /aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces/.test(s)) return 'zodiac'
  if (s.includes('bush') || s.includes('plumeria') || s.includes('hibiscus') || s.includes('tea_olive')) return 'bush'
  if (s.includes('shopping') && !s.includes('nook')) return 'shopping'
  if (s.includes('nook') || s.includes('pi_day') || s.includes('shamrock') || s.includes('april_fools') || s.includes('hinamatsuri')) return 'nook_shopping'
  return 'event'
}

const detailBirthdays = computed(() => {
  const key = selectedDate.value
  return key ? (birthdayMap.value[key] || []) : []
})
const detailUserBirthdays = computed(() => (selectedDate.value ? (userBirthdayMap.value[selectedDate.value] || []) : []))
const detailApiEvents = computed(() => (selectedDate.value ? (apiEventsMap.value[selectedDate.value] || []) : []))

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
function onImgError(e) {
  e.target?.style?.setProperty('display', 'none')
}

function prevMonth() {
  currentDate.value = new Date(displayYear.value, displayMonth.value - 1)
}
function nextMonth() {
  currentDate.value = new Date(displayYear.value, displayMonth.value + 1)
}
function goToday() {
  currentDate.value = new Date()
  closeDetail()
}
function openDetail(cell) {
  if (!cell?.dateKey) return
  selectedDate.value = cell.dateKey
  showDetailDialog.value = true
}
function closeDetail() {
  showDetailDialog.value = false
}

async function loadMyCollectedVillagers() {
  if (!authStore.user?.id) return
  try {
    const { data } = await supabase
      .from('catalogue_collected')
      .select('item_id')
      .eq('user_id', authStore.user.id)
      .eq('category', 'villagers')
    myCollectedVillagers.value = (data || []).map(r => r.item_id)
  } catch (err) {
    console.error('加载拥有的村民失败:', err)
    myCollectedVillagers.value = []
  }
}

async function loadData() {
  loadError.value = null
  try {
    const hemisphere = authStore.profile?.hemisphere === 'south' ? 'south' : 'north'
    const rawData = await catalogueStore.prefetch()
    apiEventsMap.value = parseCalendarEvents(rawData, hemisphere)

    const raw = await fetchAcnhData('villagers')
    villagers.value = Array.isArray(raw) ? raw : Object.values(raw)

    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, island_name, avatar_url, birthday')
      .not('birthday', 'is', null)
    if (profileError) throw profileError
    usersWithBirthday.value = profileRows || []

    // 加载用户拥有的村民
    await loadMyCollectedVillagers()

    // 检查今天是否有生日并记录动态
    checkAndLogBirthdays()
  } catch (err) {
    console.error(err)
    loadError.value = err?.message || '数据加载失败，请检查网络后重试'
    villagers.value = []
    usersWithBirthday.value = []
  }
}

// 检查并记录生日动态
function checkAndLogBirthdays() {
  if (!authStore.user?.id) return

  const today = new Date()
  const todayKey = `${today.getMonth() + 1}/${today.getDate()}`

  // 检查用户拥有的村民生日
  const myVillagerBirthdays = (birthdayMap.value[todayKey] || []).filter(v =>
    myCollectedVillagers.value.includes(v['file-name'] || v.id)
  )

  for (const v of myVillagerBirthdays) {
    const villagerName = getVillagerName(v)
    logActivity(
      authStore.user.id,
      ACTIVITY_KIND.VILLAGER_BIRTHDAY,
      { villager_name: villagerName, villager_id: v['file-name'] || v.id },
      86400000, // 24小时内只记录一次
      `villager_birthday:${v['file-name'] || v.id}`
    )
  }

  // 检查用户自己的生日
  const myBirthday = authStore.profile?.birthday
  if (myBirthday) {
    const bDate = new Date(myBirthday)
    const bKey = `${bDate.getMonth() + 1}/${bDate.getDate()}`
    if (bKey === todayKey) {
      logActivity(
        authStore.user.id,
        ACTIVITY_KIND.USER_BIRTHDAY,
        { user_name: authStore.profile?.display_name || '岛民' },
        86400000, // 24小时内只记录一次
        'user_birthday'
      )
    }
  }
}

onMounted(loadData)
</script>

<style scoped>
.calendar-page {
  padding-bottom: 1rem;
}

.container {
  width: 100%;
  overflow-x: hidden;
  min-width: 0;
}

/* 全部模式：允许横向滑动 */
.container.calendar-full-mode {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
}

.container.calendar-full-mode .calendar-grid {
  min-width: 560px;
}

.calendar-grid .header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.calendar-grid .weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--acnh-green-dark);
  padding: 6px 4px;
}

.calendar-grid .week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(28px, auto);
  gap: 2px;
  align-items: start;
  margin-bottom: 4px;
}

.calendar-grid .day {
  min-height: 32px;
  padding: 4px 6px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}

.calendar-grid .day.day-with-icons {
  flex-direction: column;
  gap: 2px;
  justify-content: center;
}

.calendar-grid .day .day-num {
  line-height: 1.2;
}

.calendar-grid .day .day-icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
}

.calendar-grid .day .day-icon {
  width: 14px;
  height: 14px;
  opacity: 0.9;
}

.calendar-grid .day .birthday-icon {
  color: #c2185b;
}

.calendar-grid .day .event-icon {
  color: #1565c0;
}

.calendar-grid .day:hover {
  background: #f5f5f5;
}

.calendar-grid .day.now {
  border-color: var(--acnh-green);
  background: rgba(124, 179, 66, 0.12);
  color: var(--acnh-green-dark);
}

.calendar-grid .day.outside {
  background: #fafafa;
  color: #bbb;
  cursor: default;
  border: 1px solid transparent;
}

.calendar-grid .day.outside:hover {
  background: #fafafa;
}

/* 网格定位：day-N 表示第 N 列，span-N 表示占 N 列 */
.calendar-grid .day-1 { grid-column: 1; }
.calendar-grid .day-2 { grid-column: 2; }
.calendar-grid .day-3 { grid-column: 3; }
.calendar-grid .day-4 { grid-column: 4; }
.calendar-grid .day-5 { grid-column: 5; }
.calendar-grid .day-6 { grid-column: 6; }
.calendar-grid .day-7 { grid-column: 7; }

.calendar-grid .span-1 { grid-column-end: span 1; }
.calendar-grid .span-2 { grid-column-end: span 2; }
.calendar-grid .span-3 { grid-column-end: span 3; }
.calendar-grid .span-4 { grid-column-end: span 4; }
.calendar-grid .span-5 { grid-column-end: span 5; }
.calendar-grid .span-6 { grid-column-end: span 6; }
.calendar-grid .span-7 { grid-column-end: span 7; }

.calendar-grid .item-link,
.calendar-grid .event-btn {
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}

.calendar-grid .item-link {
  background: rgba(255, 182, 193, 0.35);
  color: #c2185b;
}

.calendar-grid .item-link:hover {
  background: rgba(255, 182, 193, 0.55);
}

.calendar-grid .item-link img,
.calendar-grid .event-btn img.icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.calendar-grid .item-link .name,
.calendar-grid .event-btn .name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-grid .event-btn {
  background: rgba(187, 222, 251, 0.5);
  color: #1565c0;
}

.calendar-grid .event-btn:hover {
  background: rgba(187, 222, 251, 0.75);
}

.calendar-grid .event-btn.season {
  background: rgba(255, 248, 225, 0.8);
  color: #f57f17;
}

.calendar-grid .event-btn.crafting {
  background: rgba(232, 245, 233, 0.8);
  color: #2e7d32;
}

.calendar-grid .event-btn.zodiac {
  background: rgba(227, 242, 253, 0.8);
  color: #1565c0;
}

.calendar-grid .event-btn.bush {
  background: rgba(232, 245, 233, 0.6);
  color: #388e3c;
}

.calendar-grid .event-btn.shopping,
.calendar-grid .event-btn.nook_shopping {
  background: rgba(243, 229, 245, 0.6);
  color: #7b1fa2;
}

.calendar-grid .event-btn .region {
  font-size: 0.65rem;
  opacity: 0.85;
  margin-left: 4px;
}

.calendar-grid .icon-fallback {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* 选中日期详情弹窗 */
.calendar-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: calendar-detail-fade-in 0.2s ease;
}

.calendar-detail-dialog {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  max-width: 24rem;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: calendar-detail-scale-in 0.25s var(--ease-out-smooth);
}

.calendar-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.calendar-detail-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--acnh-green-dark);
  margin: 0;
}

.calendar-detail-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

@keyframes calendar-detail-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes calendar-detail-scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
</style>
