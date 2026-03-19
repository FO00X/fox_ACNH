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
                <button type="button" class="btn btn-ghost btn-sm min-h-0 h-7" data-filter="category" data-filter-value="villagers">小动物</button>
              </div>
              <div v-if="amiiboSeries" class="detail flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">amiibo系列：</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm min-h-0 h-7"
                  data-filter="ase"
                  :data-filter-value="amiiboSeriesCode"
                >
                  {{ amiiboSeries }}
                </button>
              </div>
            </div>

            <div class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2 flex flex-wrap gap-x-4 gap-y-2">
              <div class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">种族：</span>
                <button
                  v-if="speciesLabel"
                  type="button"
                  class="btn btn-ghost btn-sm min-h-0 h-7"
                  data-filter="vsp"
                  :data-filter-value="speciesCode"
                >
                  {{ speciesLabel }}
                </button>
              </div>
              <div v-if="genderLabel" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">性别：</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm min-h-0 h-7"
                  data-filter="vge"
                  :data-filter-value="genderCode"
                >
                  {{ genderLabel }}
                </button>
              </div>
              <div v-if="personalityLabel" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">性格：</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm min-h-0 h-7"
                  data-filter="vpe"
                  :data-filter-value="personalityCode"
                >
                  {{ personalityLabel }}
                </button>
              </div>
              <div v-if="personalitySubLabel" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">性格分类：</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm min-h-0 h-7"
                  data-filter="vps"
                  :data-filter-value="personalitySubCode"
                >
                  {{ personalitySubLabel }}
                </button>
              </div>
              <div class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">生日：</span>
                <span class="text-sm">{{ birthdayLabel }}</span>
              </div>
              <div v-if="hobbyLabel" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">爱好：</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm min-h-0 h-7"
                  data-filter="vhb"
                  :data-filter-value="hobbyCode"
                >
                  {{ hobbyLabel }}
                </button>
              </div>
              <div v-if="heightText" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">身高：</span>
                <span class="text-sm">{{ heightText }}</span>
              </div>
            </div>

            <div v-if="styleItems.length || colorItems.length" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2">
              <div v-if="styleItems.length" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">风格：</span>
                <template v-for="(s, i) in styleItems" :key="s.value">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm min-h-0 h-7"
                    data-filter="stl"
                    :data-filter-value="s.value"
                  >
                    {{ s.label }}
                  </button>
                  <span v-if="i < styleItems.length - 1" class="text-base-content/50">、</span>
                </template>
              </div>
              <div v-if="colorItems.length" class="detail half w-full sm:w-[calc(50%-0.5rem)] flex flex-wrap items-center gap-1">
                <span class="label text-base-content/70 text-sm">颜色：</span>
                <template v-for="(c, i) in colorItems" :key="c.value">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm min-h-0 h-7"
                    data-filter="clr"
                    :data-filter-value="c.value"
                  >
                    {{ c.label }}
                  </button>
                  <span v-if="i < colorItems.length - 1" class="text-base-content/50">、</span>
                </template>
              </div>
            </div>

            <!-- 照片、海报 -->
            <div v-if="photoItem || posterItem" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2 flex flex-wrap gap-x-4 gap-y-2">
              <div v-if="photoItem" class="detail half w-full sm:w-[calc(50%-0.5rem)]">
                <span class="label text-base-content/70 text-sm">照片：</span>
                <button type="button" class="item-link btn btn-ghost btn-sm gap-1.5 inline-flex items-center mt-1" :data-id="photoItem.id">
                  <img :src="photoItem.iconUrl" :alt="photoItem.name" loading="lazy" class="w-8 h-8 object-contain rounded" @error="onFtrImgError" />
                  <span class="name text-sm">{{ photoItem.name }}</span>
                </button>
              </div>
              <div v-if="posterItem" class="detail half w-full sm:w-[calc(50%-0.5rem)]">
                <span class="label text-base-content/70 text-sm">海报：</span>
                <button type="button" class="item-link btn btn-ghost btn-sm gap-1.5 inline-flex items-center mt-1" :data-id="posterItem.id">
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

            <!-- 室内/室外家具要求 + 可解锁物品 -->
            <div v-if="requirementsGroups.some(g => g.items.length)" class="box rounded-2xl border border-base-300 bg-base-200/30 p-4 space-y-2" data-title="需求与解锁">
              <div v-for="g in requirementsGroups" :key="g.key" v-show="g.items.length" class="detail">
                <span class="label text-base-content/70 text-sm">{{ g.label }}：</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <button
                    v-for="it in g.items"
                    :key="it.id"
                    type="button"
                    class="item-link big btn btn-ghost btn-sm gap-1.5 inline-flex flex-col items-center"
                    :title="it.id"
                  >
                    <img v-if="it.iconUrl" :src="it.iconUrl" :alt="it.name" loading="lazy" class="w-10 h-10 object-contain rounded" @error="onFtrImgError" />
                    <div v-else class="w-10 h-10 rounded bg-base-100/80 border border-base-200 flex items-center justify-center text-base-content/50">
                      <Icon icon="mdi:help-circle-outline" class="w-5 h-5" />
                    </div>
                    <span class="name text-xs">{{ it.name }}</span>
                    <span
                      v-if="!it.iconUrl"
                      class="mt-0.5 max-w-26 break-all text-[10px] leading-tight text-base-content/50"
                    >
                      {{ it.debugName || it.name }}<br />
                      {{ it.debugIconUrl || '(no iconUrl)' }}<br />
                      <span v-if="it.debugTriedIds?.length">try: {{ it.debugTriedIds.join(',') }}</span>
                    </span>
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
import { VILLAGER_SPECIES_ZH, mapFromCatalogueMaps, mapToCatalogueLabel } from '../../lib/acnh-api'

const FTR_ICON = 'https://nh-cdn.catalogue.ac/FtrIcon'
const NPC_ICON_CDN = 'https://nh-cdn.catalogue.ac/NpcIcon'

const props = defineProps({
  item: { type: Object, default: null },
  rawItem: { type: Object, default: null },
  catalogueRaw: { type: Object, default: null },
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

  const tryResolveIconPath = () => {
    // 1) 字符串 img（最常见：FtrIcon/xxx 或 xxx）
    if (typeof img === 'string' && img) return img.replace(/\.png$/i, '')

    // 2) 变体数组：配合 ipf 拼接出第一张图（规则参考 catalogue 的家具图标策略）
    if (Array.isArray(obj?.img) && obj.img.length > 0) {
      const firstSuffix = String(obj.img[0] ?? '')
      const ipf = typeof obj?.ipf === 'string' ? obj.ipf.replace(/\.png$/i, '') : ''
      // ipf 常见：FtrIcon/FtrBoomerang_Remake_
      if (ipf) {
        const ipfClean = ipf.replace(/^FtrIcon\//i, '')
        return `${ipfClean}${firstSuffix}`
      }
      return firstSuffix
    }

    // 3) 兜底：fileName
    if (typeof obj?.fileName === 'string' && obj.fileName) return obj.fileName.replace(/\.png$/i, '')

    return ''
  }

  const resolved = tryResolveIconPath()

  // img 可能是完整 URL
  if (resolved && /^https?:\/\//i.test(resolved)) {
    return { id: String(id), iconUrl: resolved.endsWith('.png') ? resolved : `${resolved}.png`, name: name || String(id) }
  }

  // catalogue 相对路径（常见：FtrIcon/xxx）
  const iconPath = resolved ? String(resolved).replace(/^FtrIcon\//i, '') : ''
  return { id: String(id), iconUrl: iconPath ? `${FTR_ICON}/${iconPath}.png` : '', name: name || String(id) }
}

function toItemLinks(val, fallbackName = '') {
  if (!val) return []
  const arr = Array.isArray(val) ? val : [val]
  return arr.map((o) => toItemLink(o, fallbackName)).filter(Boolean)
}

function getDataDict(key) {
  return props.catalogueRaw?.data?.[key] || props.catalogueRaw?.[key] || null
}

function toItemLinkFromDict(dict, id, fallbackName = '') {
  if (!dict || id == null) return null
  const key = String(id)
  const obj = dict?.[key]
  if (!obj) return { id: key, iconUrl: '', name: fallbackName || key }
  return toItemLink({ ...obj, id: key }, fallbackName)
}

function findByHui(dict, hui) {
  if (!dict || !hui) return null
  for (const [id, obj] of Object.entries(dict)) {
    if (obj && typeof obj === 'object' && String(obj.hui || '') === String(hui)) return { id, ...obj }
  }
  return null
}

const allDataIndex = computed(() => {
  const data = props.catalogueRaw?.data
  const map = new Map()
  if (!data || typeof data !== 'object') return map
  for (const [cat, dict] of Object.entries(data)) {
    if (!dict || typeof dict !== 'object') continue
    for (const [id, obj] of Object.entries(dict)) {
      if (!map.has(id)) map.set(id, { cat, id, obj })
    }
  }
  return map
})

function normalizeLookupIds(rawId) {
  if (rawId == null) return []
  const s = String(rawId)
  // 复合 id（如 "3122-3"）在数据里通常没有直接 key，降级用主 id 尝试查找
  const base = s.includes('-') ? s.split('-')[0] : s
  const set = new Set([s, base].filter(Boolean))
  return [...set]
}

function resolveItemCard(rawId, fallbackName = '物品') {
  const candidates = normalizeLookupIds(rawId)
  for (const id of candidates) {
    const hit = allDataIndex.value.get(id)
    if (hit?.obj) return toItemLink({ ...hit.obj, id }, fallbackName)
  }
  // 查不到也给一张卡片，至少不丢信息
  const idText = rawId == null ? '' : String(rawId)
  return idText
    ? {
        id: idText,
        iconUrl: '',
        name: `${fallbackName}（${idText}）`,
        debugName: fallbackName,
        debugIconUrl: '',
        debugTriedIds: candidates
      }
    : null
}

const photoItem = computed(() => {
  // villagers.json 未直接带 photo id：从 photos.json 反查 hui == villagerId
  const dict = getDataDict('photos')
  const hit = findByHui(dict, villagerId.value)
  if (hit) return toItemLink({ ...hit, id: hit.id }, `${props.displayName}的照片`)
  // 兼容其它来源
  const r = props.rawItem
  const raw = r?.bromide ?? r?.photo ?? r?.Photo
  return toItemLink(raw, `${props.displayName}的照片`)
})

const posterItem = computed(() => {
  // villagers.json 未直接带 poster id：从 posters.json 反查 hui == villagerId
  const dict = getDataDict('posters')
  const hit = findByHui(dict, villagerId.value)
  if (hit) return toItemLink({ ...hit, id: hit.id }, `${props.displayName}的海报`)
  // 兼容其它来源
  const r = props.rawItem
  const raw = r?.poster ?? r?.Poster
  return toItemLink(raw, `${props.displayName}的海报`)
})

const topsItems = computed(() => {
  const r = props.rawItem || {}
  // 优先 villagers.json 字段 vdc（单个物品 id，分类不固定，做全库兜底查找）
  if (r.vdc != null) {
    return [resolveItemCard(r.vdc, '服饰')].filter(Boolean)
  }
  // 兼容其它来源 tops / Tops
  return toItemLinks(r.tops ?? r.Tops, '服饰')
})
const umbrellaItem = computed(() => {
  const r = props.rawItem
  // villagers.json: vdu 为雨伞 id
  if (r?.vdu != null) return toItemLinkFromDict(getDataDict('umbrellas'), r.vdu, '雨伞')
  const raw = r?.umbrella ?? r?.Umbrella
  return toItemLink(raw, '雨伞')
})

const houseItems = computed(() => {
  const r = props.rawItem || {}
  // villagers.json: vdm/vdw/vdf 分别是音乐/墙壁/地板 id
  const itemsFromVillagersJson = [
    { key: 'mjk', label: '音乐', items: r.vdm != null ? [toItemLinkFromDict(getDataDict('music'), r.vdm, '音乐')].filter(Boolean) : [] },
    { key: 'wall', label: '墙壁', items: r.vdw != null ? [toItemLinkFromDict(getDataDict('walls'), r.vdw, '墙壁')].filter(Boolean) : [] },
    { key: 'floor', label: '地板', items: r.vdf != null ? [toItemLinkFromDict(getDataDict('floors'), r.vdf, '地板')].filter(Boolean) : [] }
  ]
  const hasAny = itemsFromVillagersJson.some((g) => g.items.length)
  if (hasAny) {
    // 其它分组在 villagers.json 没有直接字段，仍保留占位（空数组会在模板 v-show 下隐藏）
    return [
      ...itemsFromVillagersJson,
      { key: 'diy', label: 'DIY 工作台', items: [] },
      { key: 'kitchen', label: '厨房设备', items: [] },
      { key: 'ftr', label: '家具', items: [] }
    ]
  }

  // 兼容其它来源 house/House
  const house = r.house ?? r.House ?? {}
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

const requirementsGroups = computed(() => {
  const r = props.rawItem || {}
  const indoor = Array.isArray(r.rif) ? r.rif : (r.rif != null ? [r.rif] : [])
  const outdoor = Array.isArray(r.rof) ? r.rof : (r.rof != null ? [r.rof] : [])
  const unlock = Array.isArray(r.vfr) ? r.vfr : (r.vfr != null ? [r.vfr] : [])
  const vwb = r.vwb != null ? [r.vwb] : []
  const vke = r.vke != null ? [r.vke] : []

  return [
    { key: 'rif', label: '室内家具要求', items: indoor.map((id) => resolveItemCard(id, '家具')).filter(Boolean) },
    { key: 'rof', label: '室外家具要求', items: outdoor.map((id) => resolveItemCard(id, '家具')).filter(Boolean) },
    { key: 'unlock', label: '可解锁物品', items: unlock.map((id) => resolveItemCard(id, '物品')).filter(Boolean) },
    { key: 'vwb', label: '（vwb）', items: vwb.map((id) => resolveItemCard(id, '物品')).filter(Boolean) },
    { key: 'vke', label: '（vke）', items: vke.map((id) => resolveItemCard(id, '物品')).filter(Boolean) }
  ]
})

const versionLabel = computed(() => props.rawItem?.vad ?? '')

const speciesCode = computed(() => {
  const v = props.rawItem?.vsp
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vsp', v) : v
  return code ? String(code) : ''
})
const speciesLabel = computed(() => {
  if (speciesCode.value) return mapToCatalogueLabel(props.catalogueRaw, 'vsp', props.rawItem?.vsp) || speciesCode.value
  const sp = props.item?.species || ''
  return sp ? (VILLAGER_SPECIES_ZH[sp] || sp) : ''
})

const birthdayLabel = computed(() => {
  const vbd = props.rawItem?.vbd
  // villagers.json: vbd = [month(0-11), day]
  if (vbd && Array.isArray(vbd) && vbd.length >= 2) return `${Number(vbd[0]) + 1}月${vbd[1]}日`
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
const genderCode = computed(() => {
  const v = props.rawItem?.vge
  return v === 1 || v === '1' ? '1' : v === 0 || v === '0' ? '0' : ''
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
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vpe', v) : v
  if (!code) return ''
  return PERSONALITY_ZH[code] || mapToCatalogueLabel(props.catalogueRaw, 'vpe', v) || String(code)
})
const personalityCode = computed(() => {
  const v = props.rawItem?.vpe
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vpe', v) : v
  return code ? String(code) : ''
})

const personalitySubLabel = computed(() => {
  const v = props.rawItem?.vps
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vps', v) : v
  return code ? String(code).toUpperCase() : ''
})
const personalitySubCode = computed(() => {
  const v = props.rawItem?.vps
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vps', v) : v
  return code ? String(code) : ''
})

const hobbyLabel = computed(() => {
  const v = props.rawItem?.vhb
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vhb', v) : v
  const map = { education: '教育', fashion: '时尚', fitness: '健身', music: '音乐', nature: '自然', play: '玩耍' }
  return code ? (map[code] || mapToCatalogueLabel(props.catalogueRaw, 'vhb', v) || String(code)) : ''
})
const hobbyCode = computed(() => {
  const v = props.rawItem?.vhb
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'vhb', v) : v
  return code ? String(code) : ''
})

const heightText = computed(() => {
  const r = props.rawItem || {}
  return r.vhe != null ? String(r.vhe) : (r.vht != null ? String(r.vht) : '')
})

const STYLE_MAP = { simple: '简单', cute: '可爱', cool: '酷', elegant: '优雅', gorgeous: '华丽', formal: '正式', active: '活泼', rustic: '乡村' }
const styleItems = computed(() => {
  const r = props.rawItem || {}
  const arr = r.vst ?? r.stl
  if (!Array.isArray(arr) || arr.length === 0) return []
  return arr.map((s) => {
    const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'stl', s) : s
    return { value: code, label: STYLE_MAP[code] || mapToCatalogueLabel(props.catalogueRaw, 'stl', s) || String(code) }
  })
})

const COLOR_MAP = { aqua: '水色', beige: '米色', black: '黑色', blue: '蓝色', brown: '棕色', colorful: '彩色', gray: '灰色', green: '绿色', orange: '橙色', pink: '粉色', purple: '紫色', red: '红色', white: '白色', yellow: '黄色' }
const colorItems = computed(() => {
  const r = props.rawItem || {}
  const arr = r.vcl ?? r.clr
  if (!Array.isArray(arr) || arr.length === 0) return []
  return arr.map((c) => {
    const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'clr', c) : c
    return { value: code, label: COLOR_MAP[code] || mapToCatalogueLabel(props.catalogueRaw, 'clr', c) || String(code) }
  })
})

const amiiboSeries = computed(() => {
  const ase = props.rawItem?.ase
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'ase', ase) : ase
  const map = { series1: '第一弹', series2: '第二弹', series3: '第三弹', series4: '第四弹', series5: '第五弹' }
  return code ? (map[code] || mapToCatalogueLabel(props.catalogueRaw, 'ase', ase) || String(code)) : ''
})
const amiiboSeriesCode = computed(() => {
  const ase = props.rawItem?.ase
  const code = props.catalogueRaw ? mapFromCatalogueMaps(props.catalogueRaw, 'ase', ase) : ase
  return code ? String(code) : ''
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
