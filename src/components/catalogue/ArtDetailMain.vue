<template>
  <div class="main flex-1 space-y-3 min-w-0">
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">分类：</span>
        <span class="badge badge-success">艺术品</span>
        <span v-if="isFake" class="badge badge-error">赝品</span>
      </div>
      <div v-if="subLabel" class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">子分类：</span>
        <span class="badge badge-ghost">{{ subLabel }}</span>
      </div>
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">来源：</span>
        <span class="badge badge-ghost">{{ sourceLabel }}</span>
      </div>
    </div>
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">买价：</span>
        <span class="value font-semibold">{{ buyPriceLabel }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
      <div class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">卖价：</span>
        <span class="value font-semibold">{{ sellPriceLabel }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
    </div>
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3" data-title="快乐家协会">
      <p class="text-xs text-base-content/50 mb-2">快乐家协会</p>
      <div v-if="hhaScore != null" class="detail flex items-center gap-2">
        <span class="label text-base-content/70 shrink-0">基本分数：</span>
        <span class="value">{{ hhaScore }}</span>
      </div>
      <div v-if="hasLabels.length" class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">场景：</span>
        <span v-for="h in hasLabels" :key="h" class="badge badge-ghost badge-sm">{{ h }}</span>
      </div>
      <div class="detail flex items-center gap-2">
        <span class="label text-base-content/70 shrink-0">尺寸：</span>
        <span class="badge badge-ghost">{{ sizeLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mapFromCatalogueMaps, mapToCatalogueLabel, formatSizeText } from '../../lib/acnh-api'

const props = defineProps({
  rawItem: { type: Object, default: null },
  /** 是否为赝品（赝品卖价固定为 0） */
  isFake: { type: Boolean, default: false },
  catalogueRaw: { type: Object, default: null }
})

const SUB_NAMES = { wall_mounted: '壁挂物', housewares: '家具', miscellaneous: '杂项' }
const subLabel = computed(() => {
  const sub = props.rawItem?.sub
  if (!sub) return ''
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'sub', sub) : sub
  return SUB_NAMES[code] ?? mapToCatalogueLabel(props.catalogueRaw, 'sub', sub) ?? String(code)
})

const SOURCE_NAMES = { redd_ship: '九尾市场', nook: '豆粒商店' }
const sourceLabel = computed(() => {
  const src = props.rawItem?.src
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'src', src) : src
  if (!code) return '九尾市场'
  return SOURCE_NAMES[code] ?? mapToCatalogueLabel(props.catalogueRaw, 'src', src) ?? String(code)
})

// 艺术品买价/卖价：有数据用数据，无数据用固定默认值（参考 catalogue）
const ART_DEFAULT_BUY = 4980
const ART_DEFAULT_SELL = 1245

const buyPriceLabel = computed(() => {
  const buy = props.rawItem?.buy
  if (buy == null) return ART_DEFAULT_BUY.toLocaleString()
  const n = Array.isArray(buy) ? buy[0] : buy
  return Number(n).toLocaleString()
})

const sellPriceLabel = computed(() => {
  if (props.isFake) return '0'
  const sel = props.rawItem?.sel
  if (sel == null) return ART_DEFAULT_SELL.toLocaleString()
  const n = Array.isArray(sel) ? sel[0] : sel
  return Number(n).toLocaleString()
})

const hhaScore = computed(() => {
  const hha = props.rawItem?.hha
  if (hha != null) return typeof hha === 'number' ? hha : Number(hha)
  return null
})

const HAS_NAMES = { expensive: '富裕', harmonious: '东洋风', natural: '自然', cute: '可爱', cool: '酷炫', trendy: '时尚', historical: '历史', sporty: '运动' }
const hasLabels = computed(() => {
  const has = props.rawItem?.has
  if (!has) return []
  const arr = Array.isArray(has) ? has : [has]
  return arr
    .map((h) => (props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'has', h) : h))
    .map((code) => HAS_NAMES[code] || mapToCatalogueLabel(props.catalogueRaw, 'has', code) || String(code))
    .filter(Boolean)
})

const sizeLabel = computed(() => {
  const sze = props.rawItem?.sze
  if (sze != null) {
    const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'sze', sze) : sze
    return formatSizeText(code) || String(code)
  }
  return '1×1'
})
</script>
