<template>
  <div class="main flex-1 space-y-3 min-w-0">
    <!-- 分类 -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">分类：</span>
        <span :class="['badge', categoryBadgeClass]">{{ categoryLabel }}</span>
      </div>
    </div>
    <!-- 卖价 + 特殊收购价（鱼/虫有俞司廷/龙克斯，海洋生物仅卖价） -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">卖价：</span>
        <span class="value font-semibold">{{ rawItem.sel ?? '—' }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
      <div v-if="showSpecialBuyer" class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">卖价（{{ specialBuyerLabel }}）：</span>
        <span class="value font-semibold">{{ specialPrice }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
    </div>
    <!-- 栖息地 / 天气 等 -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">栖息地：</span>
        <span class="badge badge-info">{{ locationText || '—' }}</span>
      </div>
      <template v-if="category === 'bugs' && weatherText">
        <div class="detail flex items-center gap-2 flex-wrap">
          <span class="label text-base-content/70 shrink-0">天气：</span>
          <span class="badge badge-ghost">{{ weatherText }}</span>
        </div>
      </template>
      <template v-if="(category === 'fish' || category === 'sea') && shadowSizeLabel !== '—'">
        <div class="detail flex items-center gap-2 flex-wrap">
          <span class="label text-base-content/70 shrink-0">影子大小：</span>
          <span class="badge badge-ghost">{{ shadowSizeLabel }}</span>
        </div>
      </template>
      <template v-if="category === 'sea' && speedLabel">
        <div class="detail flex items-center gap-2 flex-wrap">
          <span class="label text-base-content/70 shrink-0">行动速度：</span>
          <span class="badge badge-ghost">{{ speedLabel }}</span>
        </div>
      </template>
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">出现率：</span>
        <span class="value">{{ appearanceRateText }}</span>
      </div>
      <!-- 月份 -->
      <div class="months flex flex-wrap gap-1 mt-2">
        <span
          v-for="(m, idx) in monthLabels"
          :key="idx"
          :class="['badge badge-sm', northMonthActive(idx) ? 'badge-warning' : 'badge-ghost', currentMonthIndex === idx ? 'ring-2 ring-primary ring-offset-2' : '']"
        >
          {{ m }}
        </span>
      </div>
      <!-- 时间轴 -->
      <div class="timeline mt-3 relative h-8 flex items-center">
        <span class="time text-[10px] text-base-content/50 absolute left-0">0:00</span>
        <span class="time text-[10px] text-base-content/50 absolute left-1/4">6:00</span>
        <span class="time text-[10px] text-base-content/50 absolute left-1/2">12:00</span>
        <span class="time text-[10px] text-base-content/50 absolute right-0">18:00</span>
        <div class="absolute inset-0 flex items-center px-2">
          <div class="flex-1 h-2 rounded-full bg-warning/30 overflow-hidden">
            <div class="h-full rounded-full bg-warning/80" :style="timelineBarStyle" />
          </div>
        </div>
        <span class="now absolute top-0 bottom-0 w-0.5 bg-error" :style="{ left: timelineNowPercent + '%' }" title="当前时间" />
      </div>
      <div class="detail flex items-center gap-2 mt-1">
        <span class="label text-warning shrink-0">北半球：</span>
        <span class="value text-warning">{{ northTimeText || '—' }}</span>
      </div>
      <div class="detail flex items-center gap-2">
        <span class="label text-info shrink-0">南半球：</span>
        <span class="value text-info">{{ southTimeText || '—' }}</span>
      </div>
    </div>
    <!-- 模型（鱼/虫有，海洋生物无） -->
    <div v-if="showModelBlock" class="box rounded-2xl border border-base-300 bg-base-200/30 p-3">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">模型：</span>
        <div class="flex items-center gap-2">
          <img :src="modelIconUrl" alt="模型" class="w-8 h-8 object-contain" loading="lazy" @error="onImgError" />
          <span class="font-medium">{{ displayName }}模型</span>
        </div>
      </div>
    </div>
    <!-- 海洋生物：DIY 手册 -->
    <div v-if="category === 'sea' && diyCount != null" class="box rounded-2xl border border-base-300 bg-base-200/30 p-3">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="badge badge-ghost">可在 {{ diyCount }} 个DIY手册使用</span>
      </div>
    </div>
    <!-- 快乐家协会 -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3" data-title="快乐家协会">
      <p class="text-xs text-base-content/50 mb-2">快乐家协会</p>
      <div class="detail flex items-center gap-2"><span class="label text-base-content/70 shrink-0">分类：</span><span class="badge badge-ghost">宠物</span></div>
      <div class="detail flex items-center gap-2"><span class="label text-base-content/70 shrink-0">尺寸：</span><span class="badge badge-ghost">1×1</span></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: { type: String, required: true }, // 'fish' | 'bugs' | 'sea'
  rawItem: { type: Object, default: null },
  displayName: { type: String, default: '' },
  modelIconUrl: { type: String, default: '' }
})

const categoryLabel = computed(() => ({ fish: '鱼', bugs: '虫', sea: '海洋生物' }[props.category] || props.category))

const categoryBadgeClass = computed(() => ({
  fish: 'badge-success',
  bugs: 'badge-secondary',
  sea: 'badge-info'
}[props.category] || 'badge-ghost'))

const showSpecialBuyer = computed(() => props.category === 'fish' || props.category === 'bugs')

const specialBuyerLabel = computed(() => (props.category === 'fish' ? '俞司廷' : '龙克斯'))

const specialPrice = computed(() => {
  const sel = props.rawItem?.sel
  if (sel == null || typeof sel !== 'number') return '—'
  return (sel * 1.5).toLocaleString()
})

// 鱼类：ltp 河流/池塘等；昆虫：飞着/树上等；海洋：大海等
const FISH_LOCATION_MAP = { 1: '河流', 2: '河口', 3: '池塘', 4: '悬崖', 5: '大海', 6: '码头', 7: '河流（悬崖）', 8: '沙滩' }
const BUGS_LOCATION_MAP = { 1: '地面', 2: '飞着', 3: '树上', 4: '树桩', 5: '树（摇）', 6: '花', 7: '朽木', 8: '石头', 9: '沙滩', 10: '垃圾' }
const SEA_LOCATION_MAP = { 1: '大海', 2: '码头', 3: '沙滩' }
const locationText = computed(() => {
  const ltp = props.rawItem?.ltp
  if (ltp == null) return ''
  const map = props.category === 'fish' ? FISH_LOCATION_MAP : props.category === 'bugs' ? BUGS_LOCATION_MAP : SEA_LOCATION_MAP
  return map[ltp] ?? `地点${ltp}`
})

const WEATHER_MAP = { 1: '任何天气', 2: '任何天气除了雨', 3: '仅雨天' }
const weatherText = computed(() => {
  const wea = props.rawItem?.wea
  if (wea == null) return ''
  return WEATHER_MAP[wea] ?? `天气${wea}`
})

const SHADOW_LABELS = { 0: '最小 (1)', 1: '小 (2)', 2: '中 (3)', 3: '大 (4)', 4: '最大 (5)' }
const shadowSizeLabel = computed(() => {
  if (props.category !== 'fish' && props.category !== 'sea') return '—'
  const sha = props.rawItem?.sha
  if (sha == null) return '—'
  return SHADOW_LABELS[sha] ?? `大小 ${sha}`
})

const SPEED_LABELS = { 0: '静止', 1: '慢', 2: '快', 3: '很快' }
const speedLabel = computed(() => {
  if (props.category !== 'sea') return ''
  const spd = props.rawItem?.spd
  if (spd == null) return ''
  return SPEED_LABELS[spd] ?? `速度 ${spd}`
})

const showModelBlock = computed(() => props.category === 'fish' || props.category === 'bugs')

const diyCount = computed(() => {
  const mat = props.rawItem?.mat
  if (mat == null) return null
  if (typeof mat === 'number') return mat > 100 ? 1 : mat
  return 1
})

const appearanceRateText = computed(() => (props.rawItem?.rar != null ? String(props.rawItem.rar) : '—'))

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const currentMonthIndex = computed(() => new Date().getMonth())

function northMonthActive(idx) {
  const nhd = props.rawItem?.nhd
  if (!nhd || !Array.isArray(nhd) || nhd.length < 2) return false
  const [a, b] = nhd
  return idx >= a && idx <= b
}

const timelineBarStyle = computed(() => {
  const nht = props.rawItem?.nht
  if (!nht || !Array.isArray(nht) || nht.length < 2) return { transform: 'translateX(0) scaleX(0)', transformOrigin: 'left' }
  const [a, b] = nht
  const start = (a / 24) * 100
  const widthRatio = Math.min(1, (b - a + 1) / 24)
  return { transform: `translateX(${start}%) scaleX(${widthRatio})`, transformOrigin: 'left' }
})

const timelineNowPercent = computed(() => {
  const d = new Date()
  return ((d.getHours() + d.getMinutes() / 60) / 24) * 100
})

const formatTimeRange = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length < 2) return ''
  const [a, b] = arr
  if (a === 0 && b === 23) return '全天'
  return `${a}:00 - ${(b + 1) % 24}:00`
}
const northTimeText = computed(() => formatTimeRange(props.rawItem?.nht))
const southTimeText = computed(() => formatTimeRange(props.rawItem?.sht))

const fallbackSrc = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
function onImgError(e) {
  e.target.src = fallbackSrc
}
</script>
