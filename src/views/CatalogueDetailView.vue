<template>
  <div class="space-y-4">
    <div class="acnh-card bg-white/95 p-4 sm:p-5">
      <!-- 返回：大触控区 -->
      <button
        class="btn btn-ghost gap-2 mb-4 -ml-1 text-[#558B2F] min-h-(--touch-min)"
        @click="router.back()"
      >
        <Icon icon="mdi:arrow-left" class="w-5 h-5 shrink-0" />
        返回图鉴
      </button>

      <!-- 加载中 -->
      <div v-if="loading" class="text-center py-12">
        <span class="loading loading-spinner loading-lg text-[#7CB342]"></span>
        <p class="mt-2 text-sm text-gray-600">加载中...</p>
      </div>

      <!-- 未找到 -->
      <div v-else-if="!item" class="text-center py-12">
        <Icon icon="mdi:help-circle-outline" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-600">未找到该物品</p>
        <button class="btn btn-sm bg-[#7CB342] text-white mt-4" @click="router.back()">返回</button>
      </div>

      <!-- 详情（基于 data.json 接口结构） -->
      <div v-else class="space-y-6">
        <!-- 头部：图标 + 名称（移动端居中） -->
        <div class="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div class="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            <img
              :src="getIconUrl(item)"
              :alt="displayName"
              class="w-full h-full object-contain"
              @error="onImgError"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-[#558B2F] mb-1">{{ displayName }}</h1>
            <p class="text-sm text-gray-500">{{ categoryLabel }}</p>
            <div v-if="isCollected" class="mt-2 inline-flex items-center gap-1 text-[#558B2F]">
              <Icon icon="mdi:check-circle" class="w-5 h-5" />
              <span class="text-sm font-medium">已收集</span>
            </div>
          </div>
        </div>

        <!-- 多语言名称 loc -->
        <div v-if="allNames.length > 0" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">名称</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(n, lang) in nameByLang"
              :key="lang"
              class="badge badge-outline badge-sm"
            >
              {{ lang }}: {{ n }}
            </span>
          </div>
        </div>

        <!-- 小动物：vbd 生日、vsp 物种、vcp 口头禅 -->
        <div v-if="category === 'villagers' && rawItem" class="rounded-xl border border-base-300 p-4 space-y-2">
          <h3 class="text-sm font-medium text-gray-600 mb-2">小动物信息</h3>
          <div v-if="speciesName" class="flex items-center gap-2">
            <Icon icon="mdi:cat" class="w-4 h-4 text-gray-500" />
            <span>物种：{{ speciesName }}</span>
          </div>
          <div v-if="birthdayText" class="flex items-center gap-2">
            <Icon icon="mdi:cake-variant" class="w-4 h-4 text-gray-500" />
            <span>生日：{{ birthdayText }}</span>
          </div>
          <div v-if="catchphrase" class="flex items-center gap-2">
            <Icon icon="mdi:chat-quote" class="w-4 h-4 text-gray-500" />
            <span>口头禅：{{ catchphrase }}</span>
          </div>
        </div>

        <!-- 家具：全部颜色/变体 -->
        <div v-if="['houseware','misc','wallmounted'].includes(category) && furnitureVariants.length > 1" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">全部颜色（{{ furnitureVariants.length }} 种）</h3>
          <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            <div
              v-for="(v, i) in furnitureVariants"
              :key="i"
              class="aspect-square rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-base-200"
            >
              <img
                :src="getFurnitureVariantIcon(v)"
                :alt="v.variantName || v.suffix"
                class="w-full h-full object-contain"
                loading="lazy"
                @error="onVariantImgError"
              />
            </div>
          </div>
        </div>

        <!-- 鱼类/昆虫/海洋生物：sel 售价、sha 影子、nhd/nht 北半球月份时间、shd/sht 南半球、ltp 地点 -->
        <div v-if="['fish','bugs','sea'].includes(category) && rawItem" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">详细信息</h3>
          <dl class="space-y-2 text-sm">
            <div v-if="rawItem.sel != null" class="flex justify-between">
              <dt class="text-gray-500">售价</dt>
              <dd>{{ rawItem.sel }} 铃钱</dd>
            </div>
            <div v-if="locationText" class="flex justify-between">
              <dt class="text-gray-500">出现地点</dt>
              <dd>{{ locationText }}</dd>
            </div>
            <div v-if="rawItem.sha != null" class="flex justify-between">
              <dt class="text-gray-500">影子大小</dt>
              <dd>{{ rawItem.sha }}</dd>
            </div>
            <div v-if="northMonthText" class="flex justify-between">
              <dt class="text-gray-500">北半球月份</dt>
              <dd>{{ northMonthText }}</dd>
            </div>
            <div v-if="northTimeText" class="flex justify-between">
              <dt class="text-gray-500">北半球时间</dt>
              <dd>{{ northTimeText }}</dd>
            </div>
            <div v-if="southMonthText" class="flex justify-between">
              <dt class="text-gray-500">南半球月份</dt>
              <dd>{{ southMonthText }}</dd>
            </div>
            <div v-if="southTimeText" class="flex justify-between">
              <dt class="text-gray-500">南半球时间</dt>
              <dd>{{ southTimeText }}</dd>
            </div>
          </dl>
        </div>

        <!-- 化石：sel 售价 -->
        <div v-if="category === 'fossils' && rawItem" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">详细信息</h3>
          <dl class="space-y-2 text-sm">
            <div v-if="rawItem.sel != null" class="flex justify-between">
              <dt class="text-gray-500">售价</dt>
              <dd>{{ rawItem.sel }} 铃钱</dd>
            </div>
          </dl>
        </div>

        <!-- 艺术品：buy 购入价、sel 售价 -->
        <div v-if="category === 'art' && rawItem" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">详细信息</h3>
          <dl class="space-y-2 text-sm">
            <div v-if="artBuyPrice != null" class="flex justify-between">
              <dt class="text-gray-500">购入价</dt>
              <dd>{{ artBuyPrice }} 铃钱</dd>
            </div>
            <div v-if="artSellPrice != null" class="flex justify-between">
              <dt class="text-gray-500">售价</dt>
              <dd>{{ artSellPrice }} 铃钱</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchAcnhItem, fetchAcnhRawItem, getIconUrl as getIconUrlFromApi, CATALOGUE_CATEGORIES, VILLAGER_SPECIES_ZH } from '../lib/acnh-api'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const item = ref(null)
const loading = ref(true)
const rawItem = ref(null)

const category = computed(() => route.params.category || '')
const itemId = computed(() => route.params.itemId || '')

const categoryLabel = computed(() => {
  const cat = CATALOGUE_CATEGORIES.find(c => c.id === category.value)
  return cat?.label || category.value
})

const displayName = computed(() => {
  const n = item.value?.name
  if (!n) return ''
  return n['name-CNzh'] || n['name-TWzh'] || n['name-USen'] || n['name-JPja'] || Object.values(n)[0] || ''
})

const allNames = computed(() => {
  const n = item.value?.name
  if (!n) return []
  return Object.values(n).filter(Boolean)
})

const nameByLang = computed(() => {
  const n = item.value?.name
  if (!n) return {}
  const langMap = { 'name-CNzh': '简中', 'name-TWzh': '繁中', 'name-USen': '英文', 'name-JPja': '日文', 'name-KRko': '韩文' }
  return Object.fromEntries(
    Object.entries(n)
      .filter(([_, v]) => v)
      .map(([k, v]) => [langMap[k] || k, v])
  )
})

// 小动物：从 maps.vsp + locale.vsp 解析物种，vbd 解析生日，vcp 口头禅
const speciesName = computed(() => {
  if (category.value !== 'villagers' || !item.value?.species) return ''
  return getSpeciesName(item.value.species)
})

const birthdayText = computed(() => {
  const vbd = rawItem.value?.vbd
  if (!vbd || !Array.isArray(vbd) || vbd.length < 2) return item.value?.birthday ? formatBirthday(item.value.birthday) : ''
  return `${vbd[0]}月${vbd[1]}日`
})

const catchphrase = computed(() => {
  const vcp = rawItem.value?.vcp
  if (!vcp) return ''
  return typeof vcp === 'string' ? vcp : (vcp['zh-cn'] || vcp.zh || vcp.en || Object.values(vcp)[0] || '')
})

// 鱼类/昆虫/海洋：ltp 地点、nhd/nht、shd/sht
const LOCATION_MAP = { 1: '河流', 2: '河口', 3: '池塘', 4: '悬崖', 5: '大海', 6: '码头', 7: '河流（悬崖）', 8: '沙滩' }
const locationText = computed(() => {
  const ltp = rawItem.value?.ltp
  if (ltp == null) return ''
  return LOCATION_MAP[ltp] || `地点${ltp}`
})

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const formatMonthRange = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length < 2) return ''
  const [a, b] = arr
  if (a === 0 && b === 11) return '全年'
  return months.slice(a, b + 1).join('、')
}
const formatTimeRange = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length < 2) return ''
  const [a, b] = arr
  if (a === 0 && b === 23) return '全天'
  return `${a}:00 - ${(b + 1) % 24}:00`
}
const northMonthText = computed(() => formatMonthRange(rawItem.value?.nhd))
const northTimeText = computed(() => formatTimeRange(rawItem.value?.nht))
const southMonthText = computed(() => formatMonthRange(rawItem.value?.shd))
const southTimeText = computed(() => formatTimeRange(rawItem.value?.sht))

// 艺术品：buy、sel 可能是数组
const artBuyPrice = computed(() => {
  const buy = rawItem.value?.buy
  return buy != null ? (Array.isArray(buy) ? buy[0] : buy) : null
})
const artSellPrice = computed(() => {
  const sel = rawItem.value?.sel
  return sel != null ? (Array.isArray(sel) ? sel[0] : sel) : null
})

// 家具全部变体（从 rawItem 解析）
const furnitureVariants = computed(() => {
  const raw = rawItem.value
  if (!raw?.ipf || !raw?.img?.length) return []
  const ipf = (raw.ipf || '').replace('FtrIcon/', '')
  return raw.img.map((suffix) => ({
    fileName: ipf + suffix,
    suffix,
    variantName: ''
  }))
})

function getFurnitureVariantIcon(v) {
  const fn = v?.fileName || v?.suffix
  if (!fn) return ''
  return `https://nh-cdn.catalogue.ac/FtrIcon/${fn}.png`
}

function onVariantImgError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
}

function getSpeciesName(species) {
  return VILLAGER_SPECIES_ZH[species] || species
}

function formatBirthday(bd) {
  if (!bd) return ''
  const parts = bd.split('/').map(Number)
  if (parts.length >= 2) return `${parts[0]}月${parts[1]}日`
  return bd
}

function getIconUrl(it) {
  const path = it?.iconPath
  if (path) return getIconUrlFromApi(category.value, path)
  const fn = it?.['file-name'] || it?.fileName
  return fn ? getIconUrlFromApi(category.value, fn) : ''
}

function onImgError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
}

const isCollected = computed(() => {
  if (!authStore.user || !item.value) return false
  const key = `${category.value}:${item.value['file-name'] || item.value.fileName || item.value.id}`
  return collectedSet.value.has(key)
})

const collectedSet = ref(new Set())

async function loadCollected() {
  if (!authStore.user) return
  const { data } = await supabase
    .from('catalogue_collected')
    .select('category, item_id')
    .eq('user_id', authStore.user.id)
  const set = new Set()
  for (const row of data || []) {
    set.add(`${row.category}:${row.item_id}`)
  }
  collectedSet.value = set
}

async function loadItem() {
  loading.value = true
  rawItem.value = null
  try {
    const stateItem = history.state?.item
    if (stateItem && stateItem['file-name']) {
      item.value = stateItem
    } else {
      item.value = await fetchAcnhItem(category.value, itemId.value)
    }
    if (item.value) {
      const id = item.value.baseKey ?? item.value['file-name'] ?? item.value.fileName ?? item.value.id
      rawItem.value = await fetchAcnhRawItem(category.value, id)
    }
    await loadCollected()
  } catch (err) {
    console.error(err)
    item.value = null
  } finally {
    loading.value = false
  }
}

watch([() => route.params.category, () => route.params.itemId], loadItem, { immediate: true })
</script>
