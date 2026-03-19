<template>
  <div class="space-y-3 motion-rise">
    <!-- 顶部信息栏 -->
    <div class="flex items-center justify-between p-3 rounded-2xl bg-base-100 border border-base-300">
      <div>
        <p class="text-xs text-base-content/50">本周起始</p>
        <p class="font-semibold text-sm">{{ weekStart }}</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-xs text-base-content/50">买入价</p>
          <p class="font-semibold text-sm" :class="buyPrice ? 'text-[#558B2F]' : 'text-gray-400'">{{ buyPrice || '-' }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-base-content/50">最高价</p>
          <p class="font-semibold text-sm" :class="bestPrice ? 'text-red-500' : 'text-gray-400'">{{ bestPrice || '-' }}</p>
        </div>
      </div>
    </div>

    <!-- 走势概率 -->
    <div class="flex flex-wrap gap-1.5">
      <div v-for="p in patternList" :key="p.key" 
           class="badge badge-md gap-1 py-2 px-3 rounded-xl border-0"
           :class="p.class">
        {{ p.label }} {{ p.percent }}%
      </div>
    </div>

    <!-- 建议卡片 -->
    <div class="p-3 rounded-2xl bg-[#E8F5E9]/60 border border-[#558B2F]/20">
      <p class="text-xs text-[#558B2F] font-medium mb-1">💡 建议</p>
      <p class="text-sm text-gray-700">{{ advice }}</p>
    </div>

    <!-- 输入区域 -->
    <div class="rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
      <div class="px-3 py-2 border-b border-base-300 flex items-center justify-between bg-base-200/30">
        <p class="font-medium text-sm">价格记录</p>
        <div class="flex items-center gap-1">
          <span v-if="saving" class="loading loading-spinner loading-xs text-primary"></span>
          <span v-else-if="autoSavedAt" class="text-[10px] text-base-content/50">已保存 {{ autoSavedAt }}</span>
          <button class="btn btn-ghost btn-xs px-2" @click="clearAllPrices" title="清空">
            <Icon icon="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div class="p-3">
        <!-- 买入价输入 -->
        <label class="form-control">
          <span class="label-text text-xs text-base-content/60 mb-1">周日买入价</span>
          <input v-model.number="buyPrice" type="number" min="30" max="200" 
                 placeholder="输入买入价" 
                 class="input-bordered rounded-xl h-10 text-base w-full" />
        </label>

        <!-- 每日价格输入 -->
        <div class="grid grid-cols-3 gap-2 pt-2">
          <div v-for="d in dayInputs" :key="d.day" class="space-y-1">
            <p class="text-xs font-medium text-center text-base-content/70">{{ d.day }}</p>
            <div class="grid grid-cols-2 gap-1">
              <input v-model.number="prices[d.am]" type="number" min="0" placeholder="AM" 
                     class="input-bordered rounded-lg text-center text-sm" />
              <input v-model.number="prices[d.pm]" type="number" min="0" placeholder="PM" 
                     class="input-bordered rounded-lg text-center text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预测图表 -->
    <div class="rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
      <div class="px-3 py-2 border-b border-base-300 flex items-center justify-between bg-base-200/30">
        <p class="font-medium text-sm">预测曲线</p>
        <p class="text-xs text-base-content/50">样本 {{ matchedCount }}</p>
      </div>
      <div class="p-2">
        <!-- 图例 -->
        <div class="flex flex-wrap gap-2 mb-2 text-[10px] text-base-content/60 justify-center">
          <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>最高</span>
          <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 bg-blue-500"></span>最低</span>
          <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 bg-emerald-500"></span>平均</span>
          <span class="inline-flex items-center gap-1"><span class="w-2 h-0.5 bg-amber-500"></span>买入</span>
        </div>

        <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="w-full h-[180px]">
          <g opacity="0.15">
            <line v-for="g in 6" :key="g" :x1="0" :x2="chartW" :y1="(g-1)*chartH/5" :y2="(g-1)*chartH/5" stroke="currentColor" />
          </g>
          <path v-if="chartPathArea" :d="chartPathArea" fill="rgba(239,68,68,0.2)" />
          <path v-if="chartPathMin" :d="chartPathMin" fill="none" stroke="rgb(59,130,246)" stroke-width="1.5" />
          <path v-if="chartPathAvg" :d="chartPathAvg" fill="none" stroke="rgb(16,185,129)" stroke-width="1.5" />
          <path v-if="chartPathBuy" :d="chartPathBuy" fill="none" stroke="rgb(245,158,11)" stroke-width="1.5" stroke-dasharray="3 3" />
          <g v-for="pt in chartKnownPoints" :key="pt.key">
            <circle :cx="pt.x" :cy="pt.y" r="3" fill="#558B2F" />
          </g>
        </svg>

        <div class="grid grid-cols-6 gap-1 text-[10px] text-base-content/50 text-center mt-1">
          <div>周一</div><div>周二</div><div>周三</div><div>周四</div><div>周五</div><div>周六</div>
        </div>
      </div>
    </div>

    <!-- 预测表格 -->
    <div v-if="forecastRows.length > 0" class="rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
      <div class="px-3 py-2 border-b border-base-300 bg-base-200/30">
        <p class="font-medium text-sm">预测区间</p>
      </div>
      <div class="overflow-x-auto">
        <table class="table table-xs w-full">
          <thead>
            <tr class="text-[10px] text-base-content/50">
              <th class="font-normal pl-3">时段</th>
              <th class="font-normal text-right">已知</th>
              <th class="font-normal text-right">最低</th>
              <th class="font-normal text-right">预期</th>
              <th class="font-normal text-right pr-3">最高</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in forecastRows" :key="row.key" class="text-xs">
              <td class="pl-3 py-1.5">{{ row.label }}</td>
              <td class="text-right font-medium" :class="row.known ? 'text-[#558B2F]' : 'text-gray-300'">
                {{ row.known ?? '-' }}
              </td>
              <td class="text-right text-blue-600">{{ row.p10 ?? '-' }}</td>
              <td class="text-right font-semibold text-emerald-600">{{ row.p50 ?? '-' }}</td>
              <td class="text-right text-red-500 pr-3">{{ row.p90 ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="flex items-center justify-between pt-2">
      <p v-if="saveMessage" class="text-xs" :class="saveMessageType === 'ok' ? 'text-[#558B2F]' : 'text-amber-600'">
        {{ saveMessage }}
      </p>
      <div v-else></div>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-ghost rounded-xl" :disabled="loading" @click="loadWeek">
          <Icon icon="lucide:refresh-cw" class="w-4 h-4" />
        </button>
        <button class="btn btn-sm rounded-xl bg-[#558B2F] hover:bg-[#4a7c28] text-white border-0" @click="resetAll">
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { analyzeTurnipPossibilities, TURNIP_PATTERNS } from '../lib/turnip-prophet'

const weekStart = ref('')
const buyPrice = ref(null)
const loading = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref('ok')
const autoSavedAt = ref('')
const isHydrating = ref(false)

const authStore = useAuthStore()

const slots = [
  { key: 'mon_am', label: '周一 AM' },
  { key: 'mon_pm', label: '周一 PM' },
  { key: 'tue_am', label: '周二 AM' },
  { key: 'tue_pm', label: '周二 PM' },
  { key: 'wed_am', label: '周三 AM' },
  { key: 'wed_pm', label: '周三 PM' },
  { key: 'thu_am', label: '周四 AM' },
  { key: 'thu_pm', label: '周四 PM' },
  { key: 'fri_am', label: '周五 AM' },
  { key: 'fri_pm', label: '周五 PM' },
  { key: 'sat_am', label: '周六 AM' },
  { key: 'sat_pm', label: '周六 PM' }
]

const prices = reactive(Object.fromEntries(slots.map(s => [s.key, null])))

const dayInputs = [
  { day: '周一', am: 'mon_am', pm: 'mon_pm' },
  { day: '周二', am: 'tue_am', pm: 'tue_pm' },
  { day: '周三', am: 'wed_am', pm: 'wed_pm' },
  { day: '周四', am: 'thu_am', pm: 'thu_pm' },
  { day: '周五', am: 'fri_am', pm: 'fri_pm' },
  { day: '周六', am: 'sat_am', pm: 'sat_pm' }
]

const patternConfig = {
  fluctuating: { label: '波动', class: 'bg-blue-100 text-blue-700' },
  large_spike: { label: '大高峰', class: 'bg-red-100 text-red-700' },
  decreasing: { label: '递减', class: 'bg-emerald-100 text-emerald-700' },
  small_spike: { label: '小高峰', class: 'bg-amber-100 text-amber-700' }
}

function formatDateYYYYMMDD(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getMostRecentSunday(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function clearAllPrices() {
  for (const s of slots) prices[s.key] = null
}

function resetAll() {
  weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
  buyPrice.value = null
  clearAllPrices()
  saveMessage.value = ''
  autoSavedAt.value = ''
}

function snapshotPrices() {
  const out = {}
  for (const s of slots) {
    const v = Number(prices[s.key])
    out[s.key] = Number.isFinite(v) && v > 0 ? v : null
  }
  return out
}

async function loadWeek() {
  if (!authStore.user) return
  if (!weekStart.value) weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
  loading.value = true
  saveMessage.value = ''
  isHydrating.value = true
  try {
    const { data, error } = await supabase
      .from('turnip_weeks')
      .select('buy_price, prices')
      .eq('user_id', authStore.user.id)
      .eq('week_start', weekStart.value)
      .maybeSingle()
    if (error) throw error
    buyPrice.value = data?.buy_price || null
    const p = data?.prices || {}
    for (const s of slots) prices[s.key] = p[s.key] ?? null
    saveMessageType.value = 'ok'
    saveMessage.value = data ? '已加载' : '无记录'
    setTimeout(() => saveMessage.value = '', 2000)
  } catch (err) {
    saveMessageType.value = 'warn'
    saveMessage.value = '加载失败'
  } finally {
    isHydrating.value = false
    loading.value = false
  }
}

async function saveWeek() {
  if (!authStore.user) return
  if (!weekStart.value) weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
  saving.value = true
  try {
    const payload = {
      user_id: authStore.user.id,
      week_start: weekStart.value,
      buy_price: Number(buyPrice.value) || null,
      prices: snapshotPrices(),
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('turnip_weeks').upsert(payload, { onConflict: 'user_id,week_start' })
    if (error) throw error
    autoSavedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

const observed = computed(() => {
  const arr = []
  for (const s of slots) {
    const v = Number(prices[s.key])
    if (Number.isFinite(v) && v > 0) arr.push({ key: s.key, label: s.label, value: v })
  }
  return arr
})

const bestPrice = computed(() => {
  if (observed.value.length === 0) return null
  return Math.max(...observed.value.map(o => o.value))
})

const advice = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return '请先输入周日买入价，然后开始记录每日价格。'
  if (observed.value.length === 0) return '开始记录周一到周六的价格，出现高价时建议卖出。'
  const best = bestPrice.value
  const hint = dominantPattern.value
  if (best >= buy * 2) return `已出现高价（${best}铃钱），建议立即卖出锁定收益！`
  if (best >= buy * 1.5) return `价格不错（${best}铃钱），可考虑卖出或继续观察。`
  if (hint === 'decreasing') return '走势呈递减，建议尽早卖出避免亏损。'
  if (hint === 'large_spike' || hint === 'small_spike') return '可能进入高峰阶段，关注周四到周六的价格。'
  return '继续观察价格走势，等待更好的卖出时机。'
})

function xmur3(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sampleInt(rng, min, max) {
  if (min >= max) return min
  return Math.floor(rng() * (max - min + 1)) + min
}

const prophetAnalysis = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return { possibilities: [], patternCounts: { large_spike: 0, small_spike: 0, fluctuating: 0, decreasing: 0 } }
  const p14 = [buy, buy, ...slots.map((s) => (prices[s.key] == null || Number(prices[s.key]) <= 0 ? Number.NaN : Number(prices[s.key])))]
  const possibilities = analyzeTurnipPossibilities({ prices14: p14, previousPattern: null })
  const list = possibilities.slice(1)
  const counts = { large_spike: 0, small_spike: 0, fluctuating: 0, decreasing: 0 }
  for (const p of list) {
    if (p.pattern_number === TURNIP_PATTERNS.LARGE_SPIKE) counts.large_spike++
    else if (p.pattern_number === TURNIP_PATTERNS.SMALL_SPIKE) counts.small_spike++
    else if (p.pattern_number === TURNIP_PATTERNS.DECREASING) counts.decreasing++
    else if (p.pattern_number === TURNIP_PATTERNS.FLUCTUATING) counts.fluctuating++
  }
  return { possibilities: list, patternCounts: counts }
})

const matchedCount = computed(() => prophetAnalysis.value.possibilities.length)

const patternPercents = computed(() => {
  const total = matchedCount.value
  const c = prophetAnalysis.value.patternCounts
  const toPct = (n) => (total ? Math.round((n / total) * 100) : 0)
  return {
    large_spike: toPct(c.large_spike),
    small_spike: toPct(c.small_spike),
    fluctuating: toPct(c.fluctuating),
    decreasing: toPct(c.decreasing)
  }
})

const patternList = computed(() => [
  { key: 'fluctuating', ...patternConfig.fluctuating, percent: patternPercents.value.fluctuating },
  { key: 'large_spike', ...patternConfig.large_spike, percent: patternPercents.value.large_spike },
  { key: 'decreasing', ...patternConfig.decreasing, percent: patternPercents.value.decreasing },
  { key: 'small_spike', ...patternConfig.small_spike, percent: patternPercents.value.small_spike }
])

const dominantPattern = computed(() => {
  const c = prophetAnalysis.value.patternCounts
  let best = null, bestN = -1
  for (const k of Object.keys(c)) {
    if (c[k] > bestN) { bestN = c[k]; best = k }
  }
  return matchedCount.value ? best : null
})

function percentile(sortedArr, p) {
  if (!sortedArr.length) return null
  const idx = (sortedArr.length - 1) * p
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  if (lo === hi) return sortedArr[lo]
  return Math.round(sortedArr[lo] * (1 - idx + lo) + sortedArr[hi] * (idx - lo))
}

const forecastRows = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return []
  const observedMap = snapshotPrices()
  const poss = prophetAnalysis.value.possibilities
  if (!poss.length) {
    return slots.map((s) => ({ key: s.key, label: s.label.replace(' ', ''), known: observedMap[s.key] ?? null, p10: null, p50: null, p90: null }))
  }
  const seedStr = `${weekStart.value || 'no-date'}|${buy}|${JSON.stringify(snapshotPrices())}`
  const rng = mulberry32(xmur3(seedStr)())
  const N = 3000
  return slots.map((s, idx) => {
    const known = observedMap[s.key]
    if (known != null) return { key: s.key, label: s.label.replace(' ', ''), known, p10: null, p50: null, p90: null }
    const arr = []
    for (let i = 0; i < N; i++) {
      const p = poss[Math.floor(rng() * poss.length)]
      const range = p.prices[idx + 2]
      arr.push(sampleInt(rng, range.min, range.max))
    }
    arr.sort((a, b) => a - b)
    return { key: s.key, label: s.label.replace(' ', ''), known: null, p10: percentile(arr, 0.1), p50: percentile(arr, 0.5), p90: percentile(arr, 0.9) }
  })
})

const chartW = 360
const chartH = 160

const chartSeries = computed(() => {
  const buy = Number(buyPrice.value)
  const knownMap = snapshotPrices()
  const poss = prophetAnalysis.value.possibilities
  return slots.map((s, idx) => {
    const known = knownMap[s.key]
    if (known != null) return { idx, key: s.key, min: known, max: known, avg: known, known }
    if (!poss.length) return { idx, key: s.key, min: null, max: null, avg: null, known: null }
    let min = 999, max = 0
    for (const p of poss) {
      const r = p.prices[idx + 2]
      if (r.min < min) min = r.min
      if (r.max > max) max = r.max
    }
    const seedStr = `${weekStart.value || 'no-date'}|${buy}|${JSON.stringify(snapshotPrices())}|avg|${idx}`
    const rng = mulberry32(xmur3(seedStr)())
    let sum = 0
    for (let i = 0; i < 1000; i++) {
      const p = poss[Math.floor(rng() * poss.length)]
      const r = p.prices[idx + 2]
      sum += sampleInt(rng, r.min, r.max)
    }
    return { idx, key: s.key, min, max, avg: Math.round(sum / 1000), known: null }
  })
})

function yForPrice(price, minP, maxP) {
  if (price == null) return null
  const pad = (maxP - minP) * 0.1 || 10
  const minY = chartH - 10, maxY = 10
  const range = maxP - minP + 2 * pad
  const t = (price - minP + pad) / range
  return minY - t * (minY - maxY)
}

const chartStats = computed(() => {
  const series = chartSeries.value
  const buy = Number(buyPrice.value) || 100
  const allValues = series.flatMap(p => [p.min, p.max, p.avg].filter(v => v != null))
  allValues.push(buy)
  const valid = allValues.filter(v => Number.isFinite(v))
  if (valid.length === 0) return { min: 0, max: 200 }
  return { min: Math.min(...valid), max: Math.max(...valid) }
})

const chartPathArea = computed(() => {
  const series = chartSeries.value
  const { min, max } = chartStats.value
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * (chartW - 20) + 10
    const yMax = yForPrice(p.max, min, max)
    const yMin = yForPrice(p.min, min, max)
    return { x, yMax, yMin }
  }).filter(p => p.yMax != null && p.yMin != null)
  if (pts.length < 2) return ''
  const top = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yMax}`).join(' ')
  const bottom = [...pts].reverse().map(p => `L ${p.x} ${p.yMin}`).join(' ')
  return `${top} ${bottom} Z`
})

const chartPathMin = computed(() => {
  const series = chartSeries.value
  const { min, max } = chartStats.value
  const pts = series.map((p, i) => ({ x: (i / (series.length - 1)) * (chartW - 20) + 10, y: yForPrice(p.min, min, max) })).filter(p => p.y != null)
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const chartPathAvg = computed(() => {
  const series = chartSeries.value
  const { min, max } = chartStats.value
  const pts = series.map((p, i) => ({ x: (i / (series.length - 1)) * (chartW - 20) + 10, y: yForPrice(p.avg, min, max) })).filter(p => p.y != null)
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const chartPathBuy = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return ''
  const { min, max } = chartStats.value
  const y = yForPrice(buy, min, max)
  if (y == null) return ''
  return `M 10 ${y} L ${chartW - 10} ${y}`
})

const chartKnownPoints = computed(() => {
  const series = chartSeries.value
  const { min, max } = chartStats.value
  return series.filter(p => p.known != null).map(p => ({
    key: p.key,
    x: (p.idx / (series.length - 1)) * (chartW - 20) + 10,
    y: yForPrice(p.known, min, max)
  }))
})

let autoSaveDebounce
watch([buyPrice, () => ({ ...prices })], () => {
  if (isHydrating.value) return
  clearTimeout(autoSaveDebounce)
  autoSaveDebounce = setTimeout(saveWeek, 800)
}, { deep: true })

onMounted(() => {
  weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
  loadWeek()
})
</script>
