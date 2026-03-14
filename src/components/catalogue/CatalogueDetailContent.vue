<template>
  <div class="catalogue-detail-content space-y-4">
    <!-- 生物/化石/艺术/小动物：弹窗布局 -->
    <template v-if="useDialogLayout">
      <DetailDialog>
        <div v-if="loading" class="text-center py-12">
          <span class="loading loading-spinner loading-lg text-[#7CB342]"></span>
          <p class="mt-2 text-sm text-base-content/70">加载中...</p>
        </div>
        <div v-else-if="!item" class="text-center py-12">
          <p class="text-base-content/70">未找到该{{ detailDialogCategoryLabel }}</p>
          <button class="btn btn-sm bg-[#7CB342] text-white mt-4" @click="$emit('close')">返回</button>
        </div>
        <!-- 小动物详情：参考 catalogue 结构 hdr + tabs (side / names / notes / house / main) -->
        <template v-else-if="category === 'villagers'">
          <div class="detail-dialog-scroll-wrap overflow-y-auto max-h-[85vh]">
            <VillagerDetailMain
              :item="item"
              :raw-item="rawItem"
              :display-name="displayName"
              :is-collected="isCollected"
              @close="$emit('close')"
              @wishlist="onWishlist"
              @owned="onOwned"
            />
          </div>
        </template>
        <template v-else-if="rawItem || category === 'art'">
          <!-- 单一滚动容器 + sticky 头部，不依赖 flex 高度链 -->
          <div class="detail-dialog-scroll-wrap overflow-y-auto max-h-[85vh]">
            <div class="detail-dialog-header-wrap sticky top-0 z-10 bg-base-100 shrink-0 border-b border-base-200/80 shadow-sm">
              <DetailDialogHeader
                :title="displayName"
                @close="$emit('close')"
                @wishlist="onWishlist"
                @owned="onOwned"
              />
            </div>
            <div class="detail-dialog-body pt-4 flex flex-col gap-4">
            <DetailDialogSide
              :book-icon-url="detailSideBookIconUrl"
              :cage-icon-url="detailSideCageIconUrl"
              :is-collected="isCollected"
              :alt="displayName"
            >
              <template v-if="category === 'art' && artVariants.length" #variants>
                <button
                  v-for="v in artVariants"
                  :key="v.type"
                  type="button"
                  :class="['btn btn-sm gap-1', artVariant === v.type ? 'btn-primary' : 'btn-ghost']"
                  :title="v.type === 'real' ? '真品' : '赝品'"
                  @click="setArtVariant(v.type)"
                >
                  <img
                    :src="getArtIconUrl(v.fileName, v.type === 'fake')"
                    :alt="v.type === 'real' ? '真品' : '赝品'"
                    class="w-6 h-6 object-contain shrink-0"
                    loading="lazy"
                    @error="onImgError"
                  />
                  <span>{{ v.type === 'real' ? '真品' : '赝品' }}</span>
                </button>
              </template>
            </DetailDialogSide>
            <CritterDetailMain
              v-if="isCritterCategory"
              :category="category"
              :raw-item="rawItem"
              :display-name="displayName"
              :model-icon-url="critterModelIconUrl"
            />
            <FossilDetailMain
              v-if="category === 'fossils'"
              :raw-item="rawItem"
            />
            <ArtDetailMain
              v-if="category === 'art'"
              :raw-item="rawItem || {}"
              :is-fake="isArtFake"
            />
            </div>
          </div>
        </template>
      </DetailDialog>
    </template>

    <!-- 非生物类：卡片布局（村民/家具等） -->
    <div v-else class="acnh-card bg-base-100 dark:bg-base-100 p-4 sm:p-5">
      <button type="button" class="btn btn-ghost gap-2 mb-4 -ml-1 text-[#558B2F] min-h-(--touch-min)" @click="$emit('close')">
        <Icon icon="mdi:arrow-left" class="w-5 h-5 shrink-0" />
        返回图鉴
      </button>

      <div v-if="loading" class="text-center py-12">
        <span class="loading loading-spinner loading-lg text-[#7CB342]"></span>
        <p class="mt-2 text-sm text-gray-600">加载中...</p>
      </div>

      <div v-else-if="!item" class="text-center py-12">
        <Icon icon="mdi:help-circle-outline" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-600">未找到该物品</p>
        <button class="btn btn-sm bg-[#7CB342] text-white mt-4" @click="$emit('close')">返回</button>
      </div>

      <div v-else-if="item" class="space-y-6">
        <div class="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <div class="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-gray-50 dark:bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
            <img :src="getIconUrl(item)" :alt="displayName" class="w-full h-full object-contain" @error="onImgError" />
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-[#558B2F] dark:text-[#9CCC65] mb-1">{{ displayName }}</h1>
            <p class="text-sm text-base-content/70">{{ categoryLabel }}</p>
            <div v-if="isCollected" class="mt-2 inline-flex items-center gap-1 text-[#558B2F]">
              <Icon icon="mdi:check-circle" class="w-5 h-5" />
              <span class="text-sm font-medium">已收集</span>
            </div>
          </div>
        </div>

        <div v-if="allNames.length > 0" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">名称</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="(n, lang) in nameByLang" :key="lang" class="badge badge-outline badge-sm">{{ lang }}: {{ n }}</span>
          </div>
        </div>

        <div v-if="category === 'villagers' && rawItem" class="rounded-xl border border-base-300 p-4 space-y-2">
          <h3 class="text-sm font-medium text-gray-600 mb-2">小动物信息</h3>
          <div v-if="speciesName" class="flex items-center gap-2"><Icon icon="mdi:cat" class="w-4 h-4 text-gray-500" /><span>物种：{{ speciesName }}</span></div>
          <div v-if="birthdayText" class="flex items-center gap-2"><Icon icon="mdi:cake-variant" class="w-4 h-4 text-gray-500" /><span>生日：{{ birthdayText }}</span></div>
          <div v-if="catchphrase" class="flex items-center gap-2"><Icon icon="mdi:chat-quote" class="w-4 h-4 text-gray-500" /><span>口头禅：{{ catchphrase }}</span></div>
        </div>

        <div v-if="['houseware','misc','wallmounted'].includes(category) && furnitureVariants.length > 1" class="rounded-xl border border-base-300 p-4">
          <h3 class="text-sm font-medium text-gray-600 mb-2">全部颜色（{{ furnitureVariants.length }} 种）</h3>
          <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            <div v-for="(v, i) in furnitureVariants" :key="i" class="aspect-square rounded-lg bg-gray-50 dark:bg-base-200 flex items-center justify-center overflow-hidden border border-base-200">
              <img :src="getFurnitureVariantIcon(v)" :alt="v.variantName || v.suffix" class="w-full h-full object-contain" loading="lazy" @error="onVariantImgError" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, watch } from 'vue'
import DetailDialog from './DetailDialog.vue'
import DetailDialogHeader from './DetailDialogHeader.vue'
import DetailDialogSide from './DetailDialogSide.vue'
import CritterDetailMain from './CritterDetailMain.vue'
import FossilDetailMain from './FossilDetailMain.vue'
import ArtDetailMain from './ArtDetailMain.vue'
import VillagerDetailMain from './VillagerDetailMain.vue'
import { fetchAcnhItem, fetchAcnhRawItem, getIconUrl as getIconUrlFromApi, getFishBookIconUrl, getFishTankIconUrl, getFishModelIconUrl, getBugsBookIconUrl, getBugsCageIconUrl, getBugsModelIconUrl, getSeaBookIconUrl, getSeaCageIconUrl, getSeaModelIconUrl, getFossilIconUrl, getArtIconUrl, CATALOGUE_CATEGORIES, VILLAGER_SPECIES_ZH } from '../../lib/acnh-api'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../lib/supabase'

const props = defineProps({
  category: { type: String, default: '' },
  itemId: { type: String, default: '' }
})
defineEmits(['close'])

const CRITTER_CATEGORIES = ['fish', 'bugs', 'sea']
const DIALOG_CATEGORIES = ['fish', 'bugs', 'sea', 'fossils', 'art']

const authStore = useAuthStore()
const item = ref(null)
const loading = ref(true)
const rawItem = ref(null)
const category = computed(() => String(props.category ?? ''))
const itemId = computed(() => String(props.itemId ?? ''))

const isCritterCategory = computed(() => CRITTER_CATEGORIES.includes(category.value))
const isDetailDialogCategory = computed(() => DIALOG_CATEGORIES.includes(category.value))
const useDialogLayout = computed(() => isDetailDialogCategory.value || category.value === 'villagers')
const detailDialogCategoryLabel = computed(() => ({ fish: '鱼类', bugs: '昆虫', sea: '海洋生物', fossils: '化石', art: '艺术品', villagers: '小动物' }[category.value] || ''))

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

const critterFileName = computed(() => item.value?.['file-name'] || item.value?.fileName || item.value?.id || '')
const fossilFileName = computed(() => item.value?.['file-name'] || item.value?.fileName || item.value?.id || '')
const artFileName = computed(() => item.value?.['file-name'] || item.value?.fileName || item.value?.id || '')
const critterBookIconUrl = computed(() => {
  if (category.value === 'fish') return getFishBookIconUrl(critterFileName.value)
  if (category.value === 'bugs') return getBugsBookIconUrl(critterFileName.value)
  if (category.value === 'sea') return getSeaBookIconUrl(critterFileName.value)
  return ''
})
const critterCageIconUrl = computed(() => {
  if (category.value === 'fish') return getFishTankIconUrl(critterFileName.value)
  if (category.value === 'bugs') return getBugsCageIconUrl(critterFileName.value)
  if (category.value === 'sea') return getSeaCageIconUrl(critterFileName.value)
  return ''
})
const critterModelIconUrl = computed(() => {
  if (category.value === 'fish') return getFishModelIconUrl(critterFileName.value)
  if (category.value === 'bugs') return getBugsModelIconUrl(critterFileName.value)
  if (category.value === 'sea') return getSeaModelIconUrl(critterFileName.value)
  return ''
})
const detailSideBookIconUrl = computed(() => {
  if (category.value === 'fossils') return getFossilIconUrl(fossilFileName.value)
  if (category.value === 'art') return getArtIconUrl(artFileName.value, artVariant.value === 'fake')
  return critterBookIconUrl.value
})
const detailSideCageIconUrl = computed(() => {
  if (category.value === 'fossils' || category.value === 'art') return ''
  return critterCageIconUrl.value
})
const artVariant = ref('real')
const artVariants = computed(() => item.value?.variants ?? [])
const isArtFake = computed(() => artVariant.value === 'fake')

function onWishlist() {}
function onOwned() {}
function setArtVariant(type) {
  artVariant.value = type
}

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

async function loadItem() {
  loading.value = true
  rawItem.value = null
  const cat = category.value
  const id = itemId.value
  try {
    item.value = await fetchAcnhItem(cat, id)
    if (item.value) {
      const rid = item.value.baseKey ?? item.value['file-name'] ?? item.value.fileName ?? item.value.id
      rawItem.value = await fetchAcnhRawItem(cat, rid)
    }
    await loadCollected()
  } catch (err) {
    console.error(err)
    item.value = null
  } finally {
    loading.value = false
  }
}

watch([() => props.category, () => props.itemId], () => {
  artVariant.value = 'real'
  loadItem()
}, { immediate: true })
</script>
