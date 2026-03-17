<template>
  <div class="main flex-1 space-y-3 min-w-0">
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">分类：</span>
        <span class="badge badge-primary">{{ categoryLabel }}</span>
      </div>
      <div v-if="sourceLabel" class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">来源：</span>
        <span class="badge badge-ghost">{{ sourceLabel }}</span>
      </div>
    </div>

    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div v-if="buyPriceLabel" class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">买价：</span>
        <span class="value font-semibold">{{ buyPriceLabel }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
      <div v-if="pokiPriceLabel" class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">兑换：</span>
        <span class="value font-semibold">{{ pokiPriceLabel }}</span>
        <span class="text-[#7CB342] dark:text-[#9CCC65]">Poki</span>
      </div>
      <div v-if="sellPriceLabel" class="detail half sel flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">卖价：</span>
        <span class="value font-semibold">{{ sellPriceLabel }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
    </div>

    <div
      v-if="colorLabels.length || hhaScore != null || hasLabels.length || sizeLabel"
      class="box rounded-2xl border border-base-300 bg-base-200/30 p-3"
      data-title="快乐家协会"
    >
      <p class="text-xs text-base-content/50 mb-2">快乐家协会</p>
      <div v-if="hhaScore != null" class="detail flex items-center gap-2">
        <span class="label text-base-content/70 shrink-0">基本分数：</span>
        <span class="value">{{ hhaScore }}</span>
      </div>
      <div v-if="colorLabels.length" class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">颜色：</span>
        <span v-for="c in colorLabels" :key="c" class="badge badge-ghost badge-sm">{{ c }}</span>
      </div>
      <div v-if="hasLabels.length" class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">场景：</span>
        <span v-for="h in hasLabels" :key="h" class="badge badge-ghost badge-sm">{{ h }}</span>
      </div>
      <div v-if="sizeLabel" class="detail flex items-center gap-2">
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
  catalogueRaw: { type: Object, default: null },
  category: { type: String, default: '' }
})

const CATEGORY_LABELS = {
  houseware: '家具',
  misc: '小物件',
  wallmounted: '墙挂'
}

const categoryLabel = computed(() => CATEGORY_LABELS[props.category] || '家具')

const sourceLabel = computed(() => {
  const src = props.rawItem?.src
  if (!src) return ''
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'src', src) : src
  return mapToCatalogueLabel(props.catalogueRaw, 'src', code) || String(code)
})

const buyPriceLabel = computed(() => {
  const buy = props.rawItem?.buy
  if (buy == null) return ''
  const n = Array.isArray(buy) ? buy[0] : buy
  return Number(n).toLocaleString()
})

const pokiPriceLabel = computed(() => {
  const poc = props.rawItem?.poc
  if (poc == null) return ''
  const n = Array.isArray(poc) ? poc[0] : poc
  return Number(n).toLocaleString()
})

const sellPriceLabel = computed(() => {
  const sel = props.rawItem?.sel
  if (sel == null) return ''
  const n = Array.isArray(sel) ? sel[0] : sel
  return Number(n).toLocaleString()
})

const hhaScore = computed(() => {
  const hha = props.rawItem?.hha
  if (hha == null) return null
  return typeof hha === 'number' ? hha : Number(hha)
})

const colorLabels = computed(() => {
  const clr = props.rawItem?.clr
  if (!clr) return []
  const arr = Array.isArray(clr) ? clr : [clr]
  return arr
    .map((c) => (props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'clr', c) : c))
    .map((code) => mapToCatalogueLabel(props.catalogueRaw, 'clr', code) || String(code))
    .filter(Boolean)
})

const hasLabels = computed(() => {
  const has = props.rawItem?.has
  if (!has) return []
  const arr = Array.isArray(has) ? has : [has]
  return arr
    .map((h) => (props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'has', h) : h))
    .map((code) => mapToCatalogueLabel(props.catalogueRaw, 'has', code) || String(code))
    .filter(Boolean)
})

const sizeLabel = computed(() => {
  const sze = props.rawItem?.sze
  if (!sze) return ''
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'sze', sze) : sze
  return formatSizeText(code) || String(code)
})
</script>

