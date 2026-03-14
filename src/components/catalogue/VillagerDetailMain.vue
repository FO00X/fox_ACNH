<template>
  <div class="w-full">
    <div class="flex flex-col gap-4">
      <!-- 头部：名字 + 仅愿望单、已拥有、关闭 -->
      <div class="hdr flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-3 mb-4">
        <h2 class="npc text-xl font-bold text-base-content/80">
          {{ displayName }}
        </h2>
        <div class="controls multi-btn flex items-center gap-1">
          <button type="button" class="btn btn-ghost btn-sm gap-1" title="愿望单" @click="$emit('wishlist')">
            <Icon icon="mdi:heart-outline" class="w-5 h-5" />
            <span class="hidden sm:inline text-sm">愿望单</span>
          </button>
          <button type="button" class="btn btn-ghost btn-sm gap-1" title="已拥有" @click="$emit('owned')">
            <Icon icon="mdi:check-circle-outline" class="w-5 h-5" />
            <span class="hidden sm:inline text-sm">已拥有</span>
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-square" title="关闭" @click="$emit('close')">
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="tabs flex flex-col gap-4">
        <div class="default flex flex-col lg:flex-row gap-4">
          <!-- 左侧：头像 + 口头禅 -->
          <div class="side shrink-0">
            <div class="box rounded-2xl border border-base-300 bg-base-200/50 p-4 space-y-3">
              <div class="check-container relative">
                <div class="icon w-20 h-20 rounded-xl bg-base-100 flex items-center justify-center overflow-hidden mx-auto">
                  <img :src="npcIconUrl" :alt="displayName" loading="lazy" class="w-full h-full object-contain" @error="onImgError" />
                </div>
                <button
                  v-if="isCollected"
                  type="button"
                  class="absolute top-0 right-0 btn btn-circle btn-success btn-xs"
                  aria-label="已收集"
                >
                  <Icon icon="mdi:check" class="w-4 h-4" />
                </button>
              </div>
              <div v-if="catchphrase" class="vcp text-sm text-center text-base-content/80">「{{ catchphrase }}」</div>
            </div>
          </div>

          <!-- 主内容：分类、种族、性格、照片/海报、服饰、家装、快乐家乐园、追加版本 -->
          <div class="main flex-1 min-w-0 space-y-4">
            <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2">
              <div class="detail flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">分类：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">小动物</button>
              </div>
              <div v-if="amiiboSeries" class="detail flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">amiibo系列：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ amiiboSeries }}</button>
              </div>
            </div>

            <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2 flex flex-wrap gap-x-4 gap-y-2">
              <div class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">种族：</span>
                <button v-if="speciesLabel" type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ speciesLabel }}</button>
              </div>
              <div v-if="genderLabel" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">性别：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ genderLabel }}</button>
              </div>
              <div v-if="personalityLabel" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">性格：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ personalityLabel }}</button>
              </div>
              <div v-if="personalitySubLabel" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">性格分类：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ personalitySubLabel }}</button>
              </div>
              <div class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">生日：</span>
                <span class="text-sm">{{ birthdayLabel }}</span>
                <Icon icon="mdi:gift-outline" class="w-4 h-4 text-base-content/60" />
              </div>
              <div v-if="hobbyLabel" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">爱好：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ hobbyLabel }}</button>
              </div>
              <div v-if="heightText" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">身高：</span>
                <span class="text-sm">{{ heightText }}</span>
              </div>
            </div>

            <div v-if="styleItems.length || colorItems.length" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2">
              <div v-if="styleItems.length" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">风格：</span>
                <template v-for="(s, i) in styleItems" :key="s.value">
                  <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ s.label }}</button>
                  <span v-if="i < styleItems.length - 1" class="text-base-content/50">、</span>
                </template>
              </div>
              <div v-if="colorItems.length" class="inline-block w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">颜色：</span>
                <template v-for="(c, i) in colorItems" :key="c.value">
                  <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ c.label }}</button>
                  <span v-if="i < colorItems.length - 1" class="text-base-content/50">、</span>
                </template>
              </div>
            </div>

            <!-- 照片、海报 -->
            <div v-if="photoItem || posterItem" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2 flex flex-wrap gap-x-4 gap-y-2">
              <div v-if="photoItem" class="inline-block w-full sm:w-[calc(50%-0.5rem)]">
                <span class="label text-base-content/70 text-sm">照片：</span>
                <button type="button" class="item-link btn btn-ghost btn-sm gap-1.5 inline-flex items-center mt-1">
                  <img :src="photoItem.iconUrl" :alt="photoItem.name" loading="lazy" class="w-8 h-8 object-contain rounded" @error="onFtrImgError" />
                  <span class="name text-sm">{{ photoItem.name }}</span>
                </button>
              </div>
              <div v-if="posterItem" class="inline-block w-full sm:w-[calc(50%-0.5rem)]">
                <span class="label text-base-content/70 text-sm">海报：</span>
                <button type="button" class="item-link btn btn-ghost btn-sm gap-1.5 inline-flex items-center mt-1">
                  <img :src="posterItem.iconUrl" :alt="posterItem.name" loading="lazy" class="w-8 h-8 object-contain rounded" @error="onFtrImgError" />
                  <span class="name text-sm">{{ posterItem.name }}</span>
                </button>
              </div>
            </div>

            <!-- 服饰 -->
            <div v-if="topsItems.length || umbrellaItem" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2" data-title="服饰">
              <div v-if="topsItems.length" class="inline-block w-full sm:w-[calc(50%-0.5rem)]">
                <span class="label text-base-content/70 text-sm">服饰：</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <button
                    v-for="t in topsItems"
                    :key="t.id"
                    type="button"
                    class="item-link big btn btn-ghost btn-sm gap-1.5 inline-flex flex-col items-center"
                  >
                    <img :src="t.iconUrl" :alt="t.name" loading="lazy" class="w-10 h-10 object-contain rounded" @error="onFtrImgError" />
                    <span class="name text-xs">{{ t.name }}</span>
                  </button>
                </div>
              </div>
              <div v-if="umbrellaItem" class="inline-block w-full sm:w-[calc(50%-0.5rem)]">
                <span class="label text-base-content/70 text-sm">雨伞：</span>
                <button type="button" class="item-link big btn btn-ghost btn-sm gap-1.5 inline-flex flex-col items-center mt-1">
                  <img :src="umbrellaItem.iconUrl" :alt="umbrellaItem.name" loading="lazy" class="w-10 h-10 object-contain rounded" @error="onFtrImgError" />
                  <span class="name text-xs">{{ umbrellaItem.name }}</span>
                </button>
              </div>
            </div>

            <!-- 家装 -->
            <div v-if="houseItems.some(g => g.items.length)" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2" data-title="家装">
              <div v-for="g in houseItems" :key="g.key" v-show="g.items.length" class="detail">
                <span class="label text-base-content/70 text-sm">{{ g.label }}：</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <button
                    v-for="it in g.items"
                    :key="it.id"
                    type="button"
                    class="item-link big btn btn-ghost btn-sm gap-1.5 inline-flex flex-col items-center"
                  >
                    <img :src="it.iconUrl" :alt="it.name" loading="lazy" class="w-10 h-10 object-contain rounded" @error="onFtrImgError" />
                    <span class="name text-xs">{{ it.name }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 快乐家乐园（可折叠） -->
            <div v-if="hhpGroups.some(g => g.items.length)" class="box collapsible rounded-2xl border border-base-300 bg-base-200/30 overflow-hidden" data-title="集合啦！动物森友会 快乐家乐园">
              <button type="button" class="toggle flex items-center justify-between w-full p-4 text-left font-medium" @click="hhpOpen = !hhpOpen">
                <span>集合啦！动物森友会 快乐家乐园</span>
                <Icon :icon="hhpOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-5 h-5" />
              </button>
              <div v-show="hhpOpen" class="px-4 pb-4 space-y-2">
                <div v-for="g in hhpGroups" :key="g.key" v-show="g.items.length" class="detail">
                  <span class="label text-base-content/70 text-sm">{{ g.label }}：</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <button
                      v-for="it in g.items"
                      :key="it.id"
                      type="button"
                      class="item-link big btn btn-ghost btn-sm gap-1.5 inline-flex flex-col items-center"
                    >
                      <img :src="it.iconUrl" :alt="it.name" loading="lazy" class="w-10 h-10 object-contain rounded" @error="onFtrImgError" />
                      <span class="name text-xs">{{ it.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 追加版本 -->
            <div v-if="versionLabel" class="footer box rounded-2xl border border-base-300 bg-base-200/30 p-4">
              <div class="detail">
                <span class="label text-base-content/70 text-sm">追加版本：</span>
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7">{{ versionLabel }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed } from 'vue'
import { VILLAGER_SPECIES_ZH } from '../../lib/acnh-api'

const FTR_ICON = 'https://nh-cdn.catalogue.ac/FtrIcon'
const NPC_ICON_CDN = 'https://nh-cdn.catalogue.ac/NpcIcon'

const props = defineProps({
  item: { type: Object, default: null },
  rawItem: { type: Object, default: null },
  displayName: { type: String, default: '' },
  isCollected: { type: Boolean, default: false }
})
defineEmits(['close', 'wishlist', 'owned'])

const hhpOpen = ref(false)

const villagerId = computed(() => {
  const it = props.item
  return it?.['file-name'] || it?.fileName || it?.id || ''
})

const npcIconUrl = computed(() => {
  const id = villagerId.value
  return id ? `${NPC_ICON_CDN}/${id}.png` : ''
})

const catchphrase = computed(() => {
  const vcp = props.rawItem?.vcp
  if (!vcp) return ''
  return typeof vcp === 'string' ? vcp : (vcp['zh-cn'] || vcp.zh || vcp.en || Object.values(vcp)[0] || '')
})

function toItemLink(obj, fallbackName = '') {
  if (!obj) return null
  const id = obj.id ?? obj.key ?? obj
  const img = (typeof obj === 'object' && (obj.img ?? obj.ipf ?? obj.fileName)) || (typeof id === 'string' ? id : '')
  const name = (typeof obj === 'object' && (obj.loc?.['zh-cn'] ?? obj.loc?.zh ?? obj.name ?? obj.loc?.en)) || fallbackName
  const iconPath = typeof img === 'string' ? img.replace(/\.png$/, '') : ''
  return { id: String(id), iconUrl: iconPath ? `${FTR_ICON}/${iconPath}.png` : '', name: name || String(id) }
}

function toItemLinks(val, fallbackName = '') {
  if (!val) return []
  const arr = Array.isArray(val) ? val : [val]
  return arr.map((o) => toItemLink(o, fallbackName)).filter(Boolean)
}

const photoItem = computed(() => {
  const r = props.rawItem
  const raw = r?.bromide ?? r?.photo ?? r?.Photo
  return toItemLink(raw, `${props.displayName}的照片`)
})

const posterItem = computed(() => {
  const r = props.rawItem
  const raw = r?.poster ?? r?.Poster
  return toItemLink(raw, `${props.displayName}的海报`)
})

const topsItems = computed(() => toItemLinks(props.rawItem?.tops ?? props.rawItem?.Tops, '服饰'))
const umbrellaItem = computed(() => {
  const r = props.rawItem
  const raw = r?.umbrella ?? r?.Umbrella
  return toItemLink(raw, '雨伞')
})

const houseItems = computed(() => {
  const house = props.rawItem?.house ?? props.rawItem?.House ?? {}
  return [
    { key: 'mjk', label: '音乐', items: toItemLinks(house.mjk ?? house.Mjk) },
    { key: 'wall', label: '墙壁', items: toItemLinks(house.wall ?? house.Wall) },
    { key: 'floor', label: '地板', items: toItemLinks(house.floor ?? house.Floor) },
    { key: 'diy', label: 'DIY 工作台', items: toItemLinks(house.diy ?? house.Diy) },
    { key: 'kitchen', label: '厨房设备', items: toItemLinks(house.kitchen ?? house.Kitchen) },
    { key: 'ftr', label: '家具', items: toItemLinks(house.ftr ?? house.Ftr) }
  ]
})

const hhpGroups = computed(() => {
  const hhp = props.rawItem?.hhp ?? props.rawItem?.HHP ?? {}
  return [
    { key: 'indoor', label: '室内家具要求', items: toItemLinks(hhp.indoor ?? hhp.Indoor) },
    { key: 'outdoor', label: '室外家具要求', items: toItemLinks(hhp.outdoor ?? hhp.Outdoor) },
    { key: 'mjk', label: '音乐', items: toItemLinks(hhp.mjk ?? hhp.Mjk) },
    { key: 'unlock', label: '可解锁的物品', items: toItemLinks(hhp.unlock ?? hhp.Unlock) }
  ]
})

const versionLabel = computed(() => props.rawItem?.vad ?? '')

const speciesLabel = computed(() => {
  const sp = props.item?.species || ''
  return sp ? (VILLAGER_SPECIES_ZH[sp] || sp) : ''
})

const birthdayLabel = computed(() => {
  const vbd = props.rawItem?.vbd
  if (vbd && Array.isArray(vbd) && vbd.length >= 2) return `${vbd[0]}月${vbd[1]}日`
  const bd = props.item?.birthday
  if (!bd) return ''
  const parts = String(bd).split('/').map(Number)
  if (parts.length >= 2) return `${parts[0]}月${parts[1]}日`
  return bd
})

const genderLabel = computed(() => {
  const v = props.rawItem?.vge
  if (v === 1 || v === '1') return '女'
  if (v === 0 || v === '0') return '男'
  return ''
})

const PERSONALITY_ZH = {
  big: '大姐姐',
  cranky: '暴躁',
  jock: '运动',
  lazy: '悠闲',
  normal: '普通',
  peppy: '元气',
  smug: '自恋',
  snooty: '成熟'
}
const personalityLabel = computed(() => {
  const v = props.rawItem?.vpe
  return v ? (PERSONALITY_ZH[v] || v) : ''
})

const personalitySubLabel = computed(() => {
  const v = props.rawItem?.vps
  return v ? String(v).toUpperCase() : ''
})

const hobbyLabel = computed(() => {
  const v = props.rawItem?.vhb
  const map = { education: '教育', fashion: '时尚', fitness: '健身', music: '音乐', nature: '自然', play: '玩耍' }
  return v ? (map[v] || v) : ''
})

const heightText = computed(() => props.rawItem?.vht ?? '')

const STYLE_MAP = { simple: '简单', cute: '可爱', cool: '酷', elegant: '优雅', gorgeous: '华丽', formal: '正式', active: '活泼', rustic: '乡村' }
const styleItems = computed(() => {
  const arr = props.rawItem?.stl
  if (!Array.isArray(arr) || arr.length === 0) return []
  return arr.map((s) => ({ value: s, label: STYLE_MAP[s] || s }))
})

const COLOR_MAP = { aqua: '水色', beige: '米色', black: '黑色', blue: '蓝色', brown: '棕色', colorful: '彩色', gray: '灰色', green: '绿色', orange: '橙色', pink: '粉色', purple: '紫色', red: '红色', white: '白色', yellow: '黄色' }
const colorItems = computed(() => {
  const arr = props.rawItem?.clr
  if (!Array.isArray(arr) || arr.length === 0) return []
  return arr.map((c) => ({ value: c, label: COLOR_MAP[c] || c }))
})

const amiiboSeries = computed(() => {
  const ase = props.rawItem?.ase
  const map = { series1: '第一弹', series2: '第二弹', series3: '第三弹', series4: '第四弹', series5: '第五弹' }
  return ase ? (map[ase] || ase) : ''
})

function onImgError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>'
}

function onFtrImgError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
}
</script>

<style scoped>
</style>
