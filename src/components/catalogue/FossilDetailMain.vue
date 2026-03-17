<template>
  <div class="main flex-1 space-y-3 min-w-0">
    <!-- 分类 + 来源 -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">分类：</span>
        <span class="badge badge-warning">化石</span>
      </div>
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">来源：</span>
        <span class="badge badge-ghost">{{ sourceLabel }}</span>
      </div>
    </div>
    <!-- 卖价 -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3 space-y-2">
      <div class="detail half flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">卖价：</span>
        <span class="value font-semibold">{{ rawItem.sel != null ? Number(rawItem.sel).toLocaleString() : '—' }}</span>
        <img src="/bells.png" alt="铃钱" class="w-4 h-4 object-contain" loading="lazy" />
      </div>
    </div>
    <!-- 成套的化石 -->
    <div v-if="fossilGroupName" class="box rounded-2xl border border-base-300 bg-base-200/30 p-3">
      <div class="detail flex items-center gap-2 flex-wrap">
        <span class="label text-base-content/70 shrink-0">成套的化石：</span>
        <span class="badge badge-ghost">{{ fossilGroupName }}</span>
      </div>
    </div>
    <!-- 快乐家协会 -->
    <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-3" data-title="快乐家协会">
      <p class="text-xs text-base-content/50 mb-2">快乐家协会</p>
      <div v-if="hhaScore != null" class="detail flex items-center gap-2">
        <span class="label text-base-content/70 shrink-0">基本分数：</span>
        <span class="value">{{ hhaScore }}</span>
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
  catalogueRaw: { type: Object, default: null }
})

const SOURCE_MAP = { check_fossil: '鉴定化石', nook: '豆粒商店' }
const sourceLabel = computed(() => {
  const src = props.rawItem?.src
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'src', src) : src
  if (!code) return '鉴定化石'
  return SOURCE_MAP[code] ?? mapToCatalogueLabel(props.catalogueRaw, 'src', src) ?? String(code)
})

const fossilGroupName = computed(() => {
  const fgr = props.rawItem?.fgr
  if (!fgr) return ''
  if (typeof fgr === 'string') {
    const t = FOSSIL_GROUP_NAMES[fgr]
    if (t) return t
    return fgr.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
  return ''
})

const FOSSIL_GROUP_NAMES = {
  t_rex: '暴龙',
  brachio: '腕龙',
  diplo: '大眼鱼龙',
  mammoth: '猛犸象',
  megacero: '巨角犀',
  pachy: '厚头龙',
  parasaur: '副栉龙',
  plesio: '蛇颈龙',
  raptor: '迅猛龙',
  spino: '棘龙',
  stego: '剑龙',
  tricera: '三角龙',
  archelon: '古海龟',
  australopith: '南方古猿',
  deinony: '恐爪龙',
  dimetrodon: '异齿龙',
  iguanodon: '禽龙',
  megalo: '巨齿龙',
  ophthalmo: '眼龙',
  ptera: '翼龙',
  quetzal: '风神翼龙',
  sabertooth: '剑齿虎',
  shark: '鲨鱼',
  ankylo: '甲龙',
  archaeopteryx: '始祖鸟',
  coprolite: '粪化石',
  dunkleosteus: '邓氏鱼',
  eusthenopteron: '真掌鳍鱼',
  myllokunmingia: '昆明鱼',
  acanthostega: '棘螈',
  ammonite: '菊石',
  anomalocaris: '奇虾',
  dinosaur_track: '恐龙脚印',
  juramaia: '侏罗兽'
}
const hhaScore = computed(() => {
  const hha = props.rawItem?.hha
  if (hha != null) return typeof hha === 'number' ? hha : Number(hha)
  return null
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
