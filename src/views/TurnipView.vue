<template>
  <div class="space-y-4">
    <div class="acnh-card bg-base-100 p-4 sm:p-5">
      <h1 class="page-title mb-1 flex items-center gap-2">
        <Icon icon="mdi:sprout" class="w-6 h-6 shrink-0" />
        大头菜价格预测
      </h1>
      <p class="page-desc">输入本周价格，给出建议与剩余时段区间预测</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="rounded-2xl border border-base-300 bg-base-100 px-4 py-3 min-h-[60px]">
          <p class="text-xs text-base-content/60 mb-0.5">本周起始（自动）</p>
          <p class="font-semibold text-base">{{ weekStart }}</p>
        </div>
        <label class="form-control">
          <span class="label-text text-sm">本岛买入价（周日）</span>
          <input v-model.number="buyPrice" type="number" min="30" max="200" class="input input-bordered rounded-2xl h-12 text-base" />
        </label>
      </div>

      <!-- 走势概率标签：移动端可换行、大触控 -->
      <div class="mt-4 flex flex-wrap gap-2">
        <div class="badge badge-lg gap-1.5 py-3 px-4 rounded-2xl bg-blue-100 text-blue-800 border-0">
          普通波动型 {{ patternPercents.fluctuating }}%
        </div>
        <div class="badge badge-lg gap-1.5 py-3 px-3 rounded-2xl bg-red-100 text-red-800 border-0">
          大高峰型 {{ patternPercents.large_spike }}%
        </div>
        <div class="badge badge-lg gap-1.5 py-3 px-3 rounded-2xl bg-emerald-100 text-emerald-800 border-0">
          递减型 {{ patternPercents.decreasing }}%
        </div>
        <div class="badge badge-lg gap-1.5 py-3 px-3 rounded-2xl bg-amber-100 text-amber-800 border-0">
          小高峰型 {{ patternPercents.small_spike }}%
        </div>
      </div>

      <!-- 预测图表 -->
      <div class="mt-4 rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
        <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
          <p class="font-semibold text-sm">预测曲线</p>
          <p class="text-xs text-base-content/60">匹配样本：{{ matchedCount }} / {{ simulationCount }}</p>
        </div>
        <div class="px-2 pt-2 pb-3">
          <div class="flex flex-wrap gap-3 px-2 pb-2 text-xs text-base-content/70">
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> 最高价
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-0.5 bg-blue-500"></span> 最低价
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-0.5 bg-emerald-500"></span> 平均价
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-0.5 bg-amber-500"></span> 买入价
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-base-content/70"></span> 输入价
            </span>
          </div>

          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="w-full h-[220px]">
            <!-- grid -->
            <g opacity="0.18">
              <line v-for="g in 6" :key="g" :x1="0" :x2="chartW" :y1="(g-1)*chartH/5" :y2="(g-1)*chartH/5" stroke="currentColor" />
            </g>

            <!-- max area -->
            <path v-if="chartPathArea" :d="chartPathArea" fill="rgba(239,68,68,0.25)" stroke="none" />

            <!-- min line -->
            <path v-if="chartPathMin" :d="chartPathMin" fill="none" stroke="rgb(59,130,246)" stroke-width="2" />
            <!-- avg line -->
            <path v-if="chartPathAvg" :d="chartPathAvg" fill="none" stroke="rgb(16,185,129)" stroke-width="2" />
            <!-- buy line -->
            <path v-if="chartPathBuy" :d="chartPathBuy" fill="none" stroke="rgb(245,158,11)" stroke-width="2" stroke-dasharray="4 4" />

            <!-- known dots -->
            <g v-for="pt in chartKnownPoints" :key="pt.key">
              <circle :cx="pt.x" :cy="pt.y" r="3.5" fill="rgba(0,0,0,0.65)" />
              <circle :cx="pt.x" :cy="pt.y" r="2" fill="rgba(255,255,255,0.9)" />
            </g>
          </svg>

          <div class="px-2 pt-1 grid grid-cols-6 gap-1 text-[10px] text-base-content/60">
            <div class="text-center">周一</div>
            <div class="text-center">周二</div>
            <div class="text-center">周三</div>
            <div class="text-center">周四</div>
            <div class="text-center">周五</div>
            <div class="text-center">周六</div>
          </div>
        </div>
      </div>

      <!-- 输入面板（按天） -->
      <div class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-700">本周卖价（周一~周六）</p>
          <button class="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0 rounded-2xl" @click="clearAllPrices">
            清空
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div v-for="d in dayInputs" :key="d.day" class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <p class="text-sm font-semibold mb-2">{{ d.day }}</p>
            <div class="grid grid-cols-1 gap-2">
              <label class="form-control">
                <span class="label-text text-xs text-base-content/60">上午</span>
                <input v-model.number="prices[d.am]" type="number" min="0" class="input input-bordered rounded-2xl h-11 text-base" />
              </label>
              <label class="form-control">
                <span class="label-text text-xs text-base-content/60">下午</span>
                <input v-model.number="prices[d.pm]" type="number" min="0" class="input input-bordered rounded-2xl h-11 text-base" />
              </label>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-3">
          <div class="flex items-center gap-2 text-xs text-base-content/60">
            <span v-if="saving" class="inline-flex items-center gap-1">
              <span class="loading loading-spinner loading-xs"></span> 自动保存中...
            </span>
            <span v-else-if="autoSavedAt">已自动保存（{{ autoSavedAt }}）</span>
            <span v-else>自动保存已开启</span>
          </div>
          <button class="btn btn-sm rounded-2xl ml-auto" :disabled="loading" @click="loadWeek">从云端重新加载</button>
          <button class="btn btn-sm btn-outline rounded-2xl" @click="fillUnknownAsNull">规范空值</button>
          <button class="btn btn-sm rounded-2xl" @click="resetAll">重置</button>
        </div>
        <p v-if="saveMessage" class="text-xs mt-2" :class="saveMessageType === 'ok' ? 'text-[#558B2F]' : 'text-amber-700'">
          {{ saveMessage }}
        </p>
      </div>
    </div>

    <div class="acnh-card bg-base-100 p-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h2 class="text-lg font-bold text-[#558B2F]">结果</h2>
        <div class="text-sm text-gray-600">
          <span class="mr-2">当前最高：<strong class="text-gray-900">{{ bestPrice ?? '-' }}</strong></span>
          <span>是否盈利：<strong :class="isProfitable ? 'text-[#558B2F]' : 'text-gray-500'">{{ isProfitable ? '是' : '否/未知' }}</strong></span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-[#E8F5E9]/50 text-sm">
        <p class="font-medium mb-1">建议</p>
        <p>{{ advice }}</p>
      </div>

      <div class="mt-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <p class="text-sm font-medium ">预测（Turnip Prophet 风格）</p>
          <p class="text-xs ">
            匹配样本：{{ matchedCount }} / {{ simulationCount }}
          </p>
        </div>

        <div v-if="buyPrice && matchedCount > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <p class="text-[11px] text-base-content/60 mb-1">大涨</p>
            <p class="font-semibold">{{ patternPercents.large_spike }}%</p>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <p class="text-[11px] text-base-content/60 mb-1">小涨</p>
            <p class="font-semibold">{{ patternPercents.small_spike }}%</p>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <p class="text-[11px] text-base-content/60 mb-1">波动</p>
            <p class="font-semibold">{{ patternPercents.fluctuating }}%</p>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <p class="text-[11px] text-base-content/60 mb-1">下跌</p>
            <p class="font-semibold">{{ patternPercents.decreasing }}%</p>
          </div>
        </div>

        <div v-else-if="buyPrice && matchedCount === 0" class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-3">
          目前输入的价格组合无法匹配任何走势样本。请检查是否有输错（尤其是 AM/PM 对应时段），或先少填几个时段再观察。
        </div>

        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>时段</th>
                <th class="text-right">已知</th>
                <th class="text-right">P10</th>
                <th class="text-right">P50</th>
                <th class="text-right">P90</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in forecastRows" :key="row.key">
                <td class="whitespace-nowrap">{{ row.label }}</td>
                <td class="text-right">{{ row.known ?? '-' }}</td>
                <td class="text-right">{{ row.p10 ?? '-' }}</td>
                <td class="text-right font-semibold">{{ row.p50 ?? '-' }}</td>
                <td class="text-right">{{ row.p90 ?? '-' }}</td>
              </tr>
              <tr v-if="forecastRows.length === 0">
                <td colspan="5" class="text-center text-gray-500 py-4">先填写周日买价即可开始预测</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="bestSellSuggestion" class="mt-3 p-3 rounded-xl bg-base-200/50 border border-base-300 text-sm">
          <p class="font-medium mb-1">推荐卖出时段</p>
          <p>{{ bestSellSuggestion }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const weekStart = ref('')
const buyPrice = ref(0)
const loading = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref('ok')
const autoSavedAt = ref('')
const isHydrating = ref(false)
const autoSaveTimer = ref(null)

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

function formatDateYYYYMMDD(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getMostRecentSunday(date = new Date()) {
  // JS: Sunday = 0
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = d.getDay()
  d.setDate(d.getDate() - diff)
  return d
}

function fillUnknownAsNull() {
  for (const s of slots) {
    const v = prices[s.key]
    if (v === '' || v === undefined || v === 0) prices[s.key] = null
  }
}

function clearAllPrices() {
  for (const s of slots) prices[s.key] = null
}

function resetAll() {
  weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
  buyPrice.value = 0
  for (const s of slots) prices[s.key] = null
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
    buyPrice.value = data?.buy_price || 0
    const p = data?.prices || {}
    for (const s of slots) prices[s.key] = p[s.key] ?? null
    saveMessageType.value = 'ok'
    saveMessage.value = data ? '已从云端加载本周数据' : '云端暂无该周记录（输入后会自动创建并保存）'
  } catch (err) {
    console.error(err)
    saveMessageType.value = 'warn'
    saveMessage.value = err?.message || '从云端加载失败'
  } finally {
    isHydrating.value = false
    loading.value = false
  }
}

async function saveWeek() {
  if (!authStore.user) return
  if (!weekStart.value) weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
  saving.value = true
  saveMessage.value = ''
  try {
    const payload = {
      user_id: authStore.user.id,
      week_start: weekStart.value,
      buy_price: Number(buyPrice.value) || 0,
      prices: snapshotPrices(),
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase
      .from('turnip_weeks')
      .upsert(payload, { onConflict: 'user_id,week_start' })
    if (error) throw error
    saveMessageType.value = 'ok'
    saveMessage.value = '已保存到云端'
    autoSavedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (err) {
    console.error(err)
    saveMessageType.value = 'warn'
    saveMessage.value = err?.message || '保存失败'
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

const isProfitable = computed(() => {
  if (!buyPrice.value || !bestPrice.value) return false
  return bestPrice.value >= buyPrice.value
})

const patternHint = computed(() => {
  const buy = Number(buyPrice.value)
  const obs = observed.value.map(o => o.value)
  if (!buy || obs.length === 0) return 'unknown'
  if (obs.some(p => p >= Math.round(buy * 2.0))) return 'large_spike'
  if (obs.some(p => p >= Math.round(buy * 1.5))) return 'small_spike'
  let decreasing = true
  for (let i = 1; i < obs.length; i++) {
    if (obs[i] > obs[i - 1]) decreasing = false
  }
  if (decreasing && obs.length >= 3) return 'decreasing'
  return 'fluctuating'
})

const advice = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return '先填写周日买入价，然后输入你已知的时段价格。'
  if (observed.value.length === 0) return '建议从周一开始记录 AM/PM 价格；出现明显高价时优先考虑卖出。'
  const best = bestPrice.value
  const hint = dominantPattern.value || patternHint.value
  if (best >= buy * 2.0) return `已出现明显高价（≥买价×2）。通常这是大涨段，建议优先卖出锁定收益。`
  if (best >= buy * 1.4) return `已有不错的盈利点（≥买价×1.4）。若你不想赌更高峰，可以考虑卖出；否则继续观察周四/周五。`
  if (hint === 'decreasing') return '当前走势更像“持续下跌”。如果后续也没有明显反弹，建议尽量早卖减少亏损。'
  if (hint === 'small_spike' || hint === 'large_spike') return '走势可能进入上涨/尖峰阶段，优先关注周四到周六的价格变化。'
  return '走势偏波动。建议继续记录后再判断，若出现超过买价的峰值可择机卖出。'
})

// ------------------------
// Turnip Prophet 风格预测（前端模拟 + 筛选）
// ------------------------
const simulationCount = 20000

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

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function randFloat(rng, min, max) {
  return rng() * (max - min) + min
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function floorPrice(x) {
  return Math.max(0, Math.floor(x))
}

function genDecreasing(buy, rng) {
  const out = []
  let rate = randFloat(rng, 0.85, 0.90)
  for (let i = 0; i < 12; i++) {
    out.push(floorPrice(buy * rate))
    rate -= randFloat(rng, 0.03, 0.05)
    rate = clamp(rate, 0.20, 1.20)
  }
  return out
}

function genFluctuating(buy, rng) {
  const out = []
  // 4 段：高/低/高/低（每段长度随机，但总和=12）
  const seg1 = randInt(rng, 2, 3)
  const seg2 = randInt(rng, 2, 4)
  const seg3 = randInt(rng, 2, 3)
  const seg4 = 12 - seg1 - seg2 - seg3

  for (let i = 0; i < seg1; i++) out.push(floorPrice(buy * randFloat(rng, 0.90, 1.40)))
  let rate = randFloat(rng, 0.80, 0.95)
  for (let i = 0; i < seg2; i++) {
    out.push(floorPrice(buy * rate))
    rate -= randFloat(rng, 0.02, 0.05)
    rate = clamp(rate, 0.35, 1.40)
  }
  for (let i = 0; i < seg3; i++) out.push(floorPrice(buy * randFloat(rng, 0.90, 1.40)))
  rate = randFloat(rng, 0.75, 0.95)
  for (let i = 0; i < seg4; i++) {
    out.push(floorPrice(buy * rate))
    rate -= randFloat(rng, 0.02, 0.05)
    rate = clamp(rate, 0.35, 1.40)
  }
  return out
}

function genSmallSpike(buy, rng) {
  const out = []
  const decLen = randInt(rng, 3, 4)
  let rate = randFloat(rng, 0.85, 0.95)
  for (let i = 0; i < decLen; i++) {
    out.push(floorPrice(buy * rate))
    rate -= randFloat(rng, 0.03, 0.05)
  }

  // 上升 2-3 格
  const riseLen = randInt(rng, 2, 3)
  let rise = randFloat(rng, 0.90, 1.20)
  for (let i = 0; i < riseLen; i++) {
    rise += randFloat(rng, 0.10, 0.20)
    out.push(floorPrice(buy * rise))
  }

  // 峰值 1 格（约 1.4x - 2.0x）
  out.push(floorPrice(buy * randFloat(rng, 1.40, 2.00)))

  // 回落 2 格
  out.push(floorPrice(buy * randFloat(rng, 1.00, 1.40)))
  out.push(floorPrice(buy * randFloat(rng, 0.80, 1.10)))

  // 填满剩余（低位波动）
  while (out.length < 12) {
    out.push(floorPrice(buy * randFloat(rng, 0.40, 0.90)))
  }
  return out.slice(0, 12)
}

function genLargeSpike(buy, rng) {
  const out = []
  const decLen = randInt(rng, 2, 3)
  let rate = randFloat(rng, 0.85, 0.95)
  for (let i = 0; i < decLen; i++) {
    out.push(floorPrice(buy * rate))
    rate -= randFloat(rng, 0.03, 0.05)
  }

  // 上升 3-4 格
  const riseLen = randInt(rng, 3, 4)
  let rise = randFloat(rng, 0.90, 1.10)
  for (let i = 0; i < riseLen; i++) {
    rise += randFloat(rng, 0.15, 0.25)
    out.push(floorPrice(buy * rise))
  }

  // 峰值 1 格（约 2.0x - 6.0x）
  out.push(floorPrice(buy * randFloat(rng, 2.00, 6.00)))

  // 回落 2-3 格
  const fallLen = randInt(rng, 2, 3)
  for (let i = 0; i < fallLen; i++) out.push(floorPrice(buy * randFloat(rng, 1.00, 2.00)))

  // 填满剩余（低位）
  while (out.length < 12) {
    out.push(floorPrice(buy * randFloat(rng, 0.35, 0.85)))
  }
  return out.slice(0, 12)
}

function genByPattern(pattern, buy, rng) {
  if (pattern === 'decreasing') return genDecreasing(buy, rng)
  if (pattern === 'fluctuating') return genFluctuating(buy, rng)
  if (pattern === 'small_spike') return genSmallSpike(buy, rng)
  return genLargeSpike(buy, rng)
}

const slotIndexMap = computed(() => Object.fromEntries(slots.map((s, i) => [s.key, i])))

const matched = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return { samples: [], patternCounts: { large_spike: 0, small_spike: 0, fluctuating: 0, decreasing: 0 } }

  const seedStr = `${weekStart.value || 'no-date'}|${buy}|${JSON.stringify(snapshotPrices())}`
  const seed = xmur3(seedStr)()
  const rng = mulberry32(seed)

  const patterns = ['large_spike', 'small_spike', 'fluctuating', 'decreasing']
  const observedMap = snapshotPrices()

  const samples = []
  const patternCounts = { large_spike: 0, small_spike: 0, fluctuating: 0, decreasing: 0 }

  for (let i = 0; i < simulationCount; i++) {
    const p = patterns[randInt(rng, 0, patterns.length - 1)]
    const series = genByPattern(p, buy, rng)

    let ok = true
    for (const s of slots) {
      const known = observedMap[s.key]
      if (known == null) continue
      if (series[slotIndexMap.value[s.key]] !== Number(known)) {
        ok = false
        break
      }
    }
    if (!ok) continue

    samples.push({ pattern: p, series })
    patternCounts[p]++
  }

  return { samples, patternCounts }
})

const matchedCount = computed(() => matched.value.samples.length)

const patternPercents = computed(() => {
  const total = matchedCount.value
  const c = matched.value.patternCounts
  const toPct = (n) => (total ? Math.round((n / total) * 100) : 0)
  return {
    large_spike: toPct(c.large_spike),
    small_spike: toPct(c.small_spike),
    fluctuating: toPct(c.fluctuating),
    decreasing: toPct(c.decreasing)
  }
})

const dominantPattern = computed(() => {
  const c = matched.value.patternCounts
  let best = null
  let bestN = -1
  for (const k of Object.keys(c)) {
    if (c[k] > bestN) {
      bestN = c[k]
      best = k
    }
  }
  return matchedCount.value ? best : null
})

function percentile(sortedArr, p) {
  if (!sortedArr.length) return null
  const idx = (sortedArr.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sortedArr[lo]
  const w = idx - lo
  return Math.round(sortedArr[lo] * (1 - w) + sortedArr[hi] * w)
}

const forecastRows = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy) return []

  const observedMap = snapshotPrices()
  const samples = matched.value.samples

  return slots.map((s, idx) => {
    const known = observedMap[s.key]
    if (known != null) {
      return { key: s.key, label: s.label, known, p10: null, p50: null, p90: null }
    }
    if (!samples.length) {
      return { key: s.key, label: s.label, known: null, p10: null, p50: null, p90: null }
    }
    const arr = samples.map(sm => sm.series[idx]).sort((a, b) => a - b)
    return {
      key: s.key,
      label: s.label,
      known: null,
      p10: percentile(arr, 0.10),
      p50: percentile(arr, 0.50),
      p90: percentile(arr, 0.90)
    }
  })
})

// 图表数据（min/max/avg + 买入价 + 已输入点）
const chartW = 360
const chartH = 180

const chartSeries = computed(() => {
  const buy = Number(buyPrice.value)
  const samples = matched.value.samples
  const knownMap = snapshotPrices()

  const points = slots.map((s, idx) => {
    const known = knownMap[s.key]
    if (known != null) {
      return { idx, key: s.key, min: known, max: known, avg: known, known }
    }
    if (!samples.length) {
      return { idx, key: s.key, min: null, max: null, avg: null, known: null }
    }
    const arr = samples.map(sm => sm.series[idx]).sort((a, b) => a - b)
    const min = arr[0]
    const max = arr[arr.length - 1]
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    return { idx, key: s.key, min, max, avg, known: null }
  })

  const maxY = Math.max(
    200,
    buy || 0,
    ...points.map(p => p.max || 0),
    ...points.map(p => p.known || 0)
  )
  const paddedMax = Math.ceil(maxY / 50) * 50

  return { points, buy: buy || null, yMax: paddedMax }
})

function toXY(idx, value) {
  const x = (idx / 11) * chartW
  const y = chartH - (value / chartSeries.value.yMax) * chartH
  return { x, y }
}

function makePath(values) {
  const pts = values.map((v, idx) => (v == null ? null : toXY(idx, v)))
  const first = pts.findIndex(Boolean)
  if (first === -1) return ''
  let d = `M ${pts[first].x} ${pts[first].y}`
  for (let i = first + 1; i < pts.length; i++) {
    if (!pts[i]) continue
    d += ` L ${pts[i].x} ${pts[i].y}`
  }
  return d
}

const chartPathMin = computed(() => makePath(chartSeries.value.points.map(p => p.min)))
const chartPathAvg = computed(() => makePath(chartSeries.value.points.map(p => p.avg)))
const chartPathBuy = computed(() => {
  if (!chartSeries.value.buy) return ''
  return makePath(new Array(12).fill(chartSeries.value.buy))
})
const chartPathArea = computed(() => {
  const maxs = chartSeries.value.points.map(p => p.max)
  const mins = chartSeries.value.points.map(p => p.min)
  const maxPts = maxs.map((v, idx) => (v == null ? null : toXY(idx, v)))
  const minPts = mins.map((v, idx) => (v == null ? null : toXY(idx, v)))
  const first = maxPts.findIndex(Boolean)
  const last = (() => {
    for (let i = maxPts.length - 1; i >= 0; i--) if (maxPts[i]) return i
    return -1
  })()
  if (first === -1 || last === -1) return ''

  let d = `M ${maxPts[first].x} ${maxPts[first].y}`
  for (let i = first + 1; i <= last; i++) {
    if (!maxPts[i]) continue
    d += ` L ${maxPts[i].x} ${maxPts[i].y}`
  }
  for (let i = last; i >= first; i--) {
    if (!minPts[i]) continue
    d += ` L ${minPts[i].x} ${minPts[i].y}`
  }
  d += ' Z'
  return d
})

const chartKnownPoints = computed(() => {
  const pts = []
  for (const p of chartSeries.value.points) {
    if (p.known == null) continue
    const { x, y } = toXY(p.idx, p.known)
    pts.push({ key: p.key, x, y })
  }
  return pts
})

const bestSellSuggestion = computed(() => {
  const buy = Number(buyPrice.value)
  if (!buy || !matchedCount.value) return ''

  const rows = forecastRows.value
  const knownMap = snapshotPrices()

  // 推荐：用 P50 最大的未发生时段；若已有已知最高价且 >= 2x，直接建议卖出
  const bestKnown = bestPrice.value || 0
  if (bestKnown >= buy * 2) {
    return `已出现接近/超过买价×2 的高价（当前最高 ${bestKnown}）。通常属于大涨段，建议尽快卖出锁定收益。`
  }

  let best = null
  for (const r of rows) {
    if (knownMap[r.key] != null) continue
    if (r.p50 == null) continue
    if (!best || r.p50 > best.p50) best = r
  }
  if (!best) return ''

  const confidence = best.p90 != null && best.p50 != null ? `（大致区间 P10~P90：${best.p10}~${best.p90}）` : ''
  const profitHint = best.p50 >= buy ? '有望盈利' : '大概率仍偏低'
  return `更推荐关注「${best.label}」：中位预测 ${best.p50}，${profitHint}${confidence}。`
})

watch(weekStart, () => {
  saveMessage.value = ''
})

function scheduleAutoSave() {
  if (!authStore.user) return
  if (loading.value || isHydrating.value) return
  // 没有任何输入就不保存
  const hasAnyPrice = Object.values(snapshotPrices()).some(v => v != null)
  if (!buyPrice.value && !hasAnyPrice) return

  if (autoSaveTimer.value) clearTimeout(autoSaveTimer.value)
  autoSaveTimer.value = setTimeout(() => {
    // 防止刚好在保存中重复触发
    if (saving.value) return
    saveWeek()
  }, 600)
}

watch(buyPrice, scheduleAutoSave)
watch(
  () => ({ ...prices }),
  () => scheduleAutoSave(),
  { deep: true }
)
watch(
  () => authStore.user,
  (u) => {
    if (!weekStart.value) weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
    if (u) loadWeek()
  },
  { immediate: true }
)

onMounted(() => {
  if (!weekStart.value) weekStart.value = formatDateYYYYMMDD(getMostRecentSunday())
})
</script>

