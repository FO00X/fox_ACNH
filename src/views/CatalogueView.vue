<template>
  <div class="space-y-4">
    <div class="acnh-card bg-white/95 p-4">
      <h1 class="text-xl font-bold text-[#558B2F] mb-1 flex items-center gap-2">
        <Icon icon="mdi:book-open-page-variant" class="w-6 h-6" />
        The ULTIMATE Catalogue
      </h1>
      <p class="text-gray-600 text-sm mb-4">动森全图鉴清单 · 点亮数据同步至云端</p>

      <!-- 分类 Tab -->
      <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide mb-4">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'shrink-0 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5',
            activeCategory === cat.id ? 'bg-[#7CB342] text-white' : 'bg-[#E8F5E9]/70 text-gray-600'
          ]"
          @click="selectCategory(cat.id)"
        >
          <Icon :icon="cat.icon" class="w-4 h-4" />
          {{ cat.label }}
        </button>
      </div>

      <!-- 小动物物种筛选 -->
      <div v-if="activeCategory === 'villagers' && speciesOptions.length > 0" class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <select v-model="speciesFilter" class="select select-bordered select-sm rounded-xl h-9 min-w-[100px]">
          <option value="">全部物种</option>
          <option v-for="s in speciesOptions" :key="s" :value="s">{{ getSpeciesName(s) }}</option>
        </select>
      </div>

      <!-- 搜索 -->
      <div class="mb-4">
        <label class="input input-bordered rounded-2xl flex items-center gap-2 h-11">
          <Icon icon="mdi:magnify" class="w-5 h-5 opacity-60" />
          <input
            v-model.trim="searchQuery"
            type="text"
            class="grow text-sm"
            :placeholder="searchPlaceholder"
          />
          <button
            v-if="searchQuery"
            class="btn btn-ghost btn-sm min-h-0 h-8 w-8 p-0 rounded-full"
            @click="searchQuery = ''"
            aria-label="clear"
          >
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </label>
      </div>

      <!-- 统计 -->
      <div class="flex gap-4 mb-4 p-3 rounded-xl bg-[#E8F5E9]/50 text-sm">
        <span>{{ activeCategory === 'villagers' ? '曾拥有' : '已收集' }}: <strong>{{ collectedCount }}</strong> / {{ totalCount }}</span>
        <span class="text-[#558B2F]">{{ progressPercent }}%</span>
      </div>

      <!-- 每页数量 -->
      <div class="flex items-center gap-2 mb-4">
        <span class="text-sm text-gray-600">每页</span>
        <select v-model="perPage" class="select select-bordered select-sm rounded-lg h-8 w-20">
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

      <!-- 物品网格 -->
      <div v-else class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
        <div
          v-for="item in paginatedItems"
          :key="getItemKey(item)"
          :class="[
            'relative rounded-xl border-2 p-1 cursor-pointer transition-all flex flex-col items-center',
            isCollected(item) ? 'bg-[#C8E6C9] border-[#7CB342]' : 'bg-white border-gray-200'
          ]"
          @click="toggleItem(item)"
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
          <p v-if="['houseware','misc','wallmounted'].includes(activeCategory) && item.variant" class="text-[10px] text-gray-500 truncate w-full">
            {{ item.variant }}
          </p>
          <div v-if="isCollected(item)" class="absolute top-1 right-1">
            <Icon icon="mdi:check-circle" class="w-5 h-5 text-[#558B2F]" />
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-4">
        <button
          class="btn btn-sm"
          :disabled="page <= 1"
          @click="page = Math.max(1, page - 1)"
        >
          上一页
        </button>
        <span class="flex items-center px-4 text-sm">{{ page }} / {{ totalPages }}</span>
        <button
          class="btn btn-sm"
          :disabled="page >= totalPages"
          @click="page = Math.min(totalPages, page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, watch, onMounted } from 'vue'
import { fetchAcnhData, CATALOGUE_CATEGORIES, getIconUrl as getIconUrlFromApi, flattenFurnitureData, VILLAGER_SPECIES_ZH } from '../lib/acnh-api'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()
const categories = CATALOGUE_CATEGORIES
const activeCategory = ref('fish')
const items = ref([])
const loading = ref(false)
const perPage = ref(20)
const page = ref(1)
const speciesFilter = ref('')
const searchQuery = ref('')

const collectedSet = ref(new Set())
const catalogLoadError = ref(null)

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

function isCollected(item) {
  return collectedSet.value.has(getItemKey(item))
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
  const fn = item?.['file-name'] || item?.fileName
  return fn ? getIconUrlFromApi(activeCategory.value, fn) : ''
}

function onImgError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
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
    if (cat?.flat) {
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
  // 先做物种筛选（仅 villagers）
  let base = items.value
  if (activeCategory.value === 'villagers' && speciesFilter.value) {
    base = base.filter(i => i.species === speciesFilter.value)
  }

  // 再做搜索
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
watch(() => authStore.user, () => loadCollected(), { immediate: true })

onMounted(() => {
  loadCollected()
  loadCategoryData()
})
</script>
