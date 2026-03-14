<template>
  <div class="space-y-4 relative">
    <div class="acnh-card bg-white/95 p-4 sm:p-5">
      <h1 class="page-title mb-1 flex items-center gap-2">
        <Icon icon="mdi:book-open-page-variant" class="w-6 h-6 shrink-0" />
        动森图鉴
      </h1>
      <p class="page-desc">动森全图鉴清单 · 点亮数据同步至云端</p>

      <!-- 分类 Tab：横向滑动，大触控 -->
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide mb-4">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'shrink-0 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 min-h-(--touch-min)',
            activeCategory === cat.id ? 'bg-[#7CB342] text-white' : 'bg-[#E8F5E9]/70 text-gray-600'
          ]"
          @click="selectCategory(cat.id)"
        >
          <Icon :icon="cat.icon" class="w-4 h-4 shrink-0" />
          {{ cat.label }}
        </button>
      </div>

      <!-- 筛选区域 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <div class="flex gap-1 p-1.5 rounded-xl bg-base-200/50">
          <button
            v-for="opt in collectedFilterOptions"
            :key="opt.value"
            :class="[
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px]',
              collectedFilter === opt.value ? 'bg-[#7CB342] text-white' : 'hover:bg-base-300/60 text-base-content/70'
            ]"
            @click="collectedFilter = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <select
          v-if="activeCategory === 'villagers' && speciesOptions.length > 0"
          v-model="speciesFilter"
          class="select select-bordered rounded-xl h-11 text-base min-w-[120px]"
        >
          <option value="">全部物种</option>
          <option v-for="s in speciesOptions" :key="s" :value="s">{{ getSpeciesName(s) }}</option>
        </select>
      </div>

      <!-- 搜索 -->
      <div class="mb-4">
        <label class="input input-bordered rounded-2xl flex items-center gap-2 h-12">
          <Icon icon="mdi:magnify" class="w-5 h-5 opacity-60 shrink-0" />
          <input
            v-model.trim="searchQuery"
            type="text"
            class="grow text-base min-w-0"
            :placeholder="searchPlaceholder"
          />
          <button
            v-if="searchQuery"
            class="btn btn-ghost min-h-0 h-9 w-9 p-0 rounded-full shrink-0"
            @click="searchQuery = ''"
            aria-label="clear"
          >
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </label>
      </div>

      <!-- 统计 -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 mb-4 p-4 rounded-xl bg-[#E8F5E9]/50 text-sm">
        <span>{{ activeCategory === 'villagers' ? '曾拥有' : '已收集' }}: <strong class="text-base">{{ collectedCount }}</strong> / {{ totalCount }}</span>
        <span class="text-[#558B2F] font-semibold">{{ progressPercent }}%</span>
      </div>

      <!-- 每页数量 -->
      <div class="flex items-center gap-2 mb-4">
        <span class="text-sm text-gray-600">每页</span>
        <select v-model="perPage" class="select select-bordered rounded-xl h-11 w-24 text-base">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="200">200</option>
          <option :value="500">500</option>
        </select>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="text-center py-12">
        <span class="loading loading-spinner loading-lg text-[#7CB342]"></span>
        <p class="mt-2 text-sm text-gray-600">加载中...</p>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="catalogLoadError" class="text-center py-12">
        <p class="text-amber-800 text-sm mb-2">{{ catalogLoadError }}</p>
        <button class="btn btn-sm bg-[#7CB342] text-white" @click="loadCategoryData">重试</button>
      </div>

      <!-- 物品网格：移动端 3 列，触控友好 -->
      <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        <div
          v-for="item in paginatedItems"
          :key="getItemKey(item)"
          :class="[
            'relative rounded-xl border-2 p-2 cursor-pointer transition-all flex flex-col items-center active:scale-[0.98]',
            isCollected(item) ? 'bg-[#C8E6C9] border-[#7CB342] dark:bg-[#2E7D32]/40 dark:border-[#66BB6A]' : isInWishlist(item) ? 'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-600' : 'bg-white border-gray-200 dark:bg-base-200 dark:border-base-300',
            (catalogueMode === 'view' || catalogueMode === 'wish') && 'hover:ring-2 hover:ring-[#7CB342]/50'
          ]"
          @click="onItemClick(item)"
        >
          <div class="w-full aspect-square flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
            <img
              :src="getIconUrl(item)"
              :alt="getName(item)"
              class="w-full h-full object-contain"
              loading="lazy"
              @error="onImgError"
            />
          </div>
          <p class="text-xs text-center mt-1 truncate w-full px-0.5" :title="getItemTitle(item)">
            {{ getName(item) }}
          </p>
          <p v-if="activeCategory === 'villagers' && item.species" class="text-[10px] text-gray-500 truncate w-full">
            {{ getSpeciesName(item.species) }}
          </p>
          <p v-if="['houseware','misc','wallmounted'].includes(activeCategory) && item.variantCount > 1" class="text-[10px] text-gray-500 truncate w-full">
            {{ item.variantCount }} 种颜色
          </p>
          <div v-if="isCollected(item)" class="absolute top-1 right-1">
            <Icon icon="mdi:check-circle" class="w-5 h-5 text-[#558B2F]" />
          </div>
          <div v-if="isInWishlist(item)" class="absolute top-1 left-1" title="心愿单">
            <Icon icon="mdi:heart" class="w-5 h-5 text-pink-500 dark:text-pink-400" />
          </div>
        </div>
      </div>

      <!-- 分页：大按钮便于点击 -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-6 flex-wrap">
        <button
          class="btn min-h-(--touch-min)"
          :disabled="page <= 1"
          @click="page = Math.max(1, page - 1)"
        >
          上一页
        </button>
        <span class="flex items-center px-4 text-sm">{{ page }} / {{ totalPages }}</span>
        <button
          class="btn min-h-(--touch-min)"
          :disabled="page >= totalPages"
          @click="page = Math.min(totalPages, page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- FAB 模式切换：选中后自动收起 -->
    <div ref="fabRef" class="fab fixed z-30" style="bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0) + 1.5rem); right: max(var(--content-px), env(safe-area-inset-right, 0));">
      <div tabindex="0" role="button" :class="['btn btn-lg btn-circle', catalogueMode === 'mark' ? 'btn-primary' : catalogueMode === 'view' ? 'btn-secondary' : 'btn-accent']">
        <Icon :icon="catalogueMode === 'mark' ? 'mdi:checkbox-marked-circle-outline' : catalogueMode === 'view' ? 'mdi:eye-outline' : 'mdi:heart-outline'" class="w-6 h-6" />
      </div>
      <button
        type="button"
        :class="['btn btn-lg btn-circle', catalogueMode === 'mark' ? 'btn-primary' : 'btn-ghost']"
        title="标记模式"
        @click="setCatalogueMode('mark')"
      >
        <Icon icon="mdi:checkbox-marked-circle-outline" class="w-5 h-5" />
      </button>
      <button
        type="button"
        :class="['btn btn-lg btn-circle', catalogueMode === 'view' ? 'btn-secondary' : 'btn-ghost']"
        title="查看模式"
        @click="setCatalogueMode('view')"
      >
        <Icon icon="mdi:eye-outline" class="w-5 h-5" />
      </button>
      <button
        type="button"
        :class="['btn btn-lg btn-circle', catalogueMode === 'wish' ? 'btn-accent' : 'btn-ghost']"
        title="心愿模式（选择后发到广场）"
        @click="setCatalogueMode('wish')"
      >
        <Icon icon="mdi:heart-outline" class="w-5 h-5" />
      </button>
    </div>

    <!-- 心愿单加入提示 -->
    <Transition name="fade">
      <div
        v-if="wishlistToast"
        class="fixed bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-success/90 text-success-content text-sm shadow-lg z-40"
      >
        {{ wishlistToast }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAcnhData, CATALOGUE_CATEGORIES, getIconUrl as getIconUrlFromApi, flattenFurnitureData, VILLAGER_SPECIES_ZH } from '../lib/acnh-api'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const router = useRouter()
const authStore = useAuthStore()
const categories = CATALOGUE_CATEGORIES
const activeCategory = ref('fish')
const items = ref([])
const loading = ref(false)
const perPage = ref(20)
const page = ref(1)
const speciesFilter = ref('')
const searchQuery = ref('')
const collectedFilter = ref('all') // all | collected | uncollected
const catalogueMode = ref('view') // view | mark | wish（默认查看模式）
const fabRef = ref(null)

function setCatalogueMode(mode) {
  catalogueMode.value = mode
  // 让 FAB 失去焦点，DaisyUI fab 会自动收起
  setTimeout(() => fabRef.value?.querySelector('[tabindex="0"]')?.blur(), 0)
}

const collectedFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'collected', label: '已收集' },
  { value: 'uncollected', label: '未收集' }
]

const collectedSet = ref(new Set())
const wishlistNames = ref(new Set()) // 心愿单中的物品名称
const catalogLoadError = ref(null)
const wishlistToast = ref('')
let wishlistToastTimeout = null

function getSpeciesName(species) {
  return VILLAGER_SPECIES_ZH[species] || species
}

function getItemTitle(item) {
  const name = getName(item)
  if (activeCategory.value === 'villagers' && item.species) {
    return `${name} · ${getSpeciesName(item.species)}`
  }
  return name
}

function getItemId(item) {
  if (['houseware', 'misc', 'wallmounted'].includes(activeCategory.value) && item?.baseKey != null) {
    return String(item.baseKey)
  }
  return item?.['file-name'] || item?.fileName || item?.id || ''
}

function getItemKey(item) {
  return `${activeCategory.value}:${getItemId(item)}`
}

async function loadCollected() {
  if (!authStore.user) {
    collectedSet.value = new Set()
    return
  }
  try {
    const { data } = await supabase
      .from('catalogue_collected')
      .select('category, item_id')
      .eq('user_id', authStore.user.id)
    const set = new Set()
    for (const row of data || []) {
      set.add(`${row.category}:${row.item_id}`)
    }
    collectedSet.value = set
  } catch (err) {
    console.error(err)
    collectedSet.value = new Set()
  }
}

async function loadWishlist() {
  if (!authStore.user) {
    wishlistNames.value = new Set()
    return
  }
  try {
    const { data } = await supabase
      .from('wishlist_items')
      .select('item_name')
      .eq('user_id', authStore.user.id)
      .eq('is_fulfilled', false)
    const set = new Set((data || []).map(r => r.item_name?.trim()).filter(Boolean))
    wishlistNames.value = set
  } catch (err) {
    console.error(err)
    wishlistNames.value = new Set()
  }
}

function isCollected(item) {
  return collectedSet.value.has(getItemKey(item))
}

function isInWishlist(item) {
  const name = getName(item)?.trim()
  return name && wishlistNames.value.has(name)
}

function getWishlistItemType() {
  const cat = activeCategory.value
  return ['houseware', 'misc', 'wallmounted'].includes(cat) ? 'furniture' : 'material'
}

async function addToWishlist(item) {
  if (!authStore.user) return
  const itemName = getName(item)
  if (!itemName.trim()) return
  const itemType = getWishlistItemType()
  try {
    const { error } = await supabase.from('wishlist_items').insert({
      user_id: authStore.user.id,
      item_name: itemName.trim(),
      item_type: itemType,
      quantity: 1
    })
    if (error) throw error
    wishlistNames.value = new Set([...wishlistNames.value, itemName.trim()])
    wishlistToast.value = `${itemName} 已加入心愿单`
    wishlistToastTimeout = setTimeout(() => { wishlistToast.value = '' }, 2000)
  } catch (err) {
    console.error('加入心愿单失败:', err)
    wishlistToast.value = '加入失败，请重试'
    wishlistToastTimeout = setTimeout(() => { wishlistToast.value = '' }, 2000)
  }
}

async function toggleItem(item) {
  if (!authStore.user) return
  const key = getItemKey(item)
  const itemId = getItemId(item)
  const category = activeCategory.value
  const wasCollected = collectedSet.value.has(key)

  try {
    if (wasCollected) {
      const { error } = await supabase
        .from('catalogue_collected')
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('category', category)
        .eq('item_id', itemId)
      if (error) throw error
      collectedSet.value.delete(key)
    } else {
      const { error } = await supabase.from('catalogue_collected').insert({
        user_id: authStore.user.id,
        category,
        item_id: itemId
      })
      if (error) throw error
      collectedSet.value.add(key)
    }
    collectedSet.value = new Set(collectedSet.value)
  } catch (err) {
    console.error('图鉴同步失败:', err)
  }
}

function getName(item) {
  const n = item?.name
  if (!n) return ''
  return n['name-CNzh'] || n['name-TWzh'] || n['name-USen'] || n['name-JPja'] || Object.values(n)[0] || ''
}

function getAllNameStrings(item) {
  const n = item?.name
  if (!n) return []
  return Object.values(n).filter(Boolean).map(v => String(v))
}

const searchPlaceholder = computed(() => {
  if (activeCategory.value === 'villagers') return '搜索：名字 / 英文名 / 物种 / file-name'
  if (['houseware', 'misc', 'wallmounted'].includes(activeCategory.value)) return '搜索：名称 / 变体 / file-name'
  return '搜索：名称 / file-name'
})

function getIconUrl(item) {
  const path = item?.iconPath
  if (path) return getIconUrlFromApi(activeCategory.value, path)
  const fn = item?.['file-name'] || item?.fileName
  return fn ? getIconUrlFromApi(activeCategory.value, fn) : ''
}

function onImgError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
}

function onItemClick(item) {
  if (catalogueMode.value === 'view') {
    const itemId = getItemId(item)
    router.push({ name: 'CatalogueDetail', params: { category: activeCategory.value, itemId } })
  } else if (catalogueMode.value === 'wish') {
    addToWishlist(item)
  } else {
    toggleItem(item)
  }
}

async function selectCategory(id) {
  activeCategory.value = id
  page.value = 1
  await loadCategoryData()
}

async function loadCategoryData() {
  loading.value = true
  catalogLoadError.value = null
  speciesFilter.value = ''
  searchQuery.value = ''
  try {
    const raw = await fetchAcnhData(activeCategory.value)
    const cat = categories.find(c => c.id === activeCategory.value)
    if (Array.isArray(raw)) {
      items.value = raw
    } else if (cat?.flat) {
      items.value = flattenFurnitureData(raw)
    } else {
      items.value = Object.entries(raw).map(([key, val]) => ({
        ...val,
        fileName: val['file-name'] || key
      }))
    }
  } catch (err) {
    console.error(err)
    catalogLoadError.value = err?.message || '图鉴数据加载失败，请检查网络后重试'
    items.value = []
  } finally {
    loading.value = false
  }
}

const speciesOptions = computed(() => {
  if (activeCategory.value !== 'villagers') return []
  const set = new Set(items.value.map(i => i.species).filter(Boolean))
  return [...set].sort()
})

const filteredItems = computed(() => {
  // 1. 物种筛选（仅 villagers）
  let base = items.value
  if (activeCategory.value === 'villagers' && speciesFilter.value) {
    base = base.filter(i => i.species === speciesFilter.value)
  }

  // 2. 收集状态筛选
  if (collectedFilter.value === 'collected') {
    base = base.filter(i => isCollected(i))
  } else if (collectedFilter.value === 'uncollected') {
    base = base.filter(i => !isCollected(i))
  }

  // 3. 搜索
  const q = (searchQuery.value || '').toLowerCase().trim()
  if (!q) return base

  return base.filter((item) => {
    const fn = String(item?.['file-name'] || item?.fileName || item?.id || '').toLowerCase()
    const variant = String(item?.variant || '').toLowerCase()
    const species = String(item?.species || '').toLowerCase()
    const names = getAllNameStrings(item).map(s => s.toLowerCase())
    return (
      fn.includes(q) ||
      variant.includes(q) ||
      species.includes(q) ||
      names.some(n => n.includes(q))
    )
  })
})

const totalCount = computed(() => filteredItems.value.length)
const collectedCount = computed(() => filteredItems.value.filter(i => isCollected(i)).length)
const progressPercent = computed(() => totalCount.value ? Math.round((collectedCount.value / totalCount.value) * 100) : 0)

const paginatedItems = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filteredItems.value.slice(start, start + perPage.value)
})

const totalPages = computed(() => Math.ceil(totalCount.value / perPage.value) || 1)

watch(perPage, () => { page.value = 1 })
watch(speciesFilter, () => { page.value = 1 })
watch(searchQuery, () => { page.value = 1 })
watch(collectedFilter, () => { page.value = 1 })
watch(() => authStore.user, () => {
  loadCollected()
  loadWishlist()
}, { immediate: true })

onMounted(() => {
  loadCollected()
  loadWishlist()
  loadCategoryData()
})

onUnmounted(() => {
  if (wishlistToastTimeout) clearTimeout(wishlistToastTimeout)
})
</script>
