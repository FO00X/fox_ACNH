<template>
  <div class="catalogue-page space-y-4 relative motion-rise">
    <!-- 分类 Tab：横向滑动，大触控 -->
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide snap-x snap-mandatory">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'shrink-0 px-3 xs:px-4 py-3 rounded-xl text-xs xs:text-sm font-medium flex items-center gap-1 xs:gap-2 min-h-(--touch-min) snap-start tap-lift',
            activeCategory === cat.id ? 'bg-[#7CB342] text-white' : 'bg-[#E8F5E9]/70 text-gray-600'
          ]"
          @click="selectCategory(cat.id)"
        >
          <Icon :icon="cat.icon" class="w-3 h-3 xs:w-4 xs:h-4 shrink-0" />
          {{ cat.label }}
        </button>
    </div>

    <!-- 搜索 + 筛选按钮 -->
    <div class="flex gap-2">
      <label class="input input-bordered rounded-2xl flex items-center gap-2 h-12 flex-1 min-w-0">
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
      <button
        type="button"
        class="btn btn-outline rounded-2xl h-12 min-w-[60px] xs:min-w-[80px] flex items-center gap-1 shrink-0"
        @click="openFilterDrawer"
      >
        <Icon icon="mdi:filter-variant" class="w-5 h-5" />
        <span class="hidden xs:inline">筛选</span>
      </button>
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
    <div v-else class="grid grid-cols-2 min-[380px]:grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 motion-stagger">
      <div
        v-for="item in paginatedItems"
        :key="getItemKey(item)"
        :class="[
          'item relative rounded-xl border-2 p-2 cursor-pointer transition-all flex flex-col items-center active:scale-[0.98] tap-lift motion-pop',
          isCollected(item) ? 'bg-[#C8E6C9] border-[#7CB342] dark:bg-[#2E7D32]/40 dark:border-[#66BB6A]' : isInWishlist(item) ? 'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-600' : 'bg-white border-gray-200 dark:bg-base-200 dark:border-base-300',
          (catalogueMode === 'view' || catalogueMode === 'wish') && 'hover:ring-2 hover:ring-[#7CB342]/50'
        ]"
        @click="onItemClick(item)"
      >
        <span v-if="item.isNew" class="new">新增</span>
        <div class="w-full aspect-square flex items-center justify-center bg-base-200 rounded-lg overflow-hidden">
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
        <div
          v-if="['houseware','misc','wallmounted'].includes(activeCategory) && hasProperties(item)"
          class="properties mt-0.5 flex items-center justify-center gap-1"
        >
          <span
            v-if="item.cat"
            class="icon-catalog"
            data-tt="details.cat"
            tabindex="0"
          />
          <span
            v-if="item.diy"
            class="icon-crafting"
            data-tt="details.diy"
            tabindex="0"
          />
          <span
            v-if="item.bcu"
            class="icon-customize-variant"
            data-tt="details.bcu"
            tabindex="0"
          />
          <span
            v-if="item.sea"
            class="icon-seasonal"
            data-tt="details.sea"
            tabindex="0"
          />
        </div>
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

    <!-- FAB 模式切换：选中后自动收起 -->
    <div ref="fabRef" class="fab fixed z-30 motion-pop" style="bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0) + 1.5rem); right: max(var(--content-px), env(safe-area-inset-right, 0));">
      <div tabindex="0" role="button" :class="['btn btn-md sm:btn-lg btn-circle', catalogueMode === 'mark' ? 'btn-success' : catalogueMode === 'view' ? 'btn-secondary' : 'btn-success']">
        <Icon :icon="catalogueMode === 'mark' ? 'mdi:checkbox-marked-circle-outline' : catalogueMode === 'view' ? 'mdi:eye-outline' : 'mdi:heart-outline'" class="w-6 h-6" />
      </div>
      <button
        type="button"
        :class="['btn btn-md sm:btn-lg btn-circle', catalogueMode === 'mark' ? 'btn-success' : 'btn-ghost']"
        title="标记模式"
        @click="setCatalogueMode('mark')"
      >
        <Icon icon="mdi:checkbox-marked-circle-outline" class="w-5 h-5" />
      </button>
      <button
        type="button"
        :class="['btn btn-md sm:btn-lg btn-circle', catalogueMode === 'view' ? 'btn-secondary' : 'btn-ghost']"
        title="查看模式"
        @click="setCatalogueMode('view')"
      >
        <Icon icon="mdi:eye-outline" class="w-5 h-5" />
      </button>
      <button
        type="button"
        :class="['btn btn-md sm:btn-lg btn-circle', catalogueMode === 'wish' ? 'btn-success' : 'btn-ghost']"
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
        class="fixed bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-success/90 text-success-content text-sm shadow-lg z-40"
      >
        {{ wishlistToast }}
      </div>
    </Transition>

    <!-- 图鉴详情弹窗：DaisyUI modal -->
    <dialog
      ref="detailDialogRef"
      class="modal catalogue-detail-modal"
      aria-label="图鉴详情"
      @close="onDetailDialogClose"
    >
      <div class="modal-box flex flex-col max-h-[90vh] p-0 overflow-hidden w-11/12 max-w-2xl sm:w-[95vw] sm:max-w-[95vw] sm:rounded-none sm:m-0 sm:h-screen">
        <CatalogueDetailContent
          :category="detailCategory"
          :item-id="detailItemId"
          @close="closeDetailDialog"
        />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="关闭">关闭</button>
      </form>
    </dialog>

    <!-- 图鉴筛选抽屉：从底部向上滑出，移动端友好 -->
    <Transition name="filter-bottom">
      <div v-if="showFilterDrawer" class="fixed inset-0 z-60">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px]" @click="closeFilterDrawer"></div>
        <div
          class="absolute bottom-0 left-0 right-0 bg-base-100 shadow-2xl border-t border-base-300 rounded-t-3xl max-h-[85vh] flex flex-col safe-area-pb"
        >
          <!-- 顶部拖拽指示器 -->
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-12 h-1 bg-base-300 rounded-full"></div>
          </div>
          
          <!-- 标题栏 -->
          <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
            <h2 class="text-lg font-semibold">筛选与排序</h2>
            <button class="btn btn-ghost min-h-(--touch-min) h-10 w-10 rounded-full p-0 flex items-center justify-center" @click="closeFilterDrawer" aria-label="关闭筛选">
              <Icon icon="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          
          <!-- 筛选内容区域 -->
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-sm">
            <!-- 收集状态 -->
            <section>
              <h3 class="mb-3 font-medium text-base">收集状态</h3>
              <div class="flex gap-2">
                <button
                  v-for="opt in collectedFilterOptions"
                  :key="opt.value"
                  :class="[
                    'flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] tap-lift',
                    collectedFilter === opt.value ? 'bg-[#7CB342] text-white shadow-md' : 'bg-base-200 hover:bg-base-300/60 text-base-content/70 active:scale-[0.98]'
                  ]"
                  @click="collectedFilter = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </section>

            <!-- 物种（仅小动物） -->
            <section v-if="activeCategory === 'villagers' && speciesOptions.length > 0">
              <h3 class="mb-3 font-medium text-base">物种</h3>
              <select
                v-model="speciesFilter"
                class="select select-bordered rounded-xl h-12 text-base w-full"
              >
                <option value="">全部物种</option>
                <option v-for="s in speciesOptions" :key="s" :value="s">
                  {{ getSpeciesName(s) }}
                </option>
              </select>
            </section>

            <!-- 鱼/虫/海：半球、月份、活动 -->
            <section v-if="isCritterCategory">
              <h3 class="mb-3 font-medium text-base">出现时间</h3>
              <div class="space-y-4">
                <div>
                  <p class="mb-2 text-sm text-base-content/70">半球</p>
                  <div class="flex gap-2">
                    <button
                      v-for="h in hemisphereOptions"
                      :key="h.value"
                      :class="[
                        'flex-1 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[40px] transition-all tap-lift',
                        hemisphereFilter === h.value ? 'bg-[#7CB342] text-white shadow-md' : 'bg-base-200 hover:bg-base-300/60 text-base-content/70 active:scale-[0.98]'
                      ]"
                      @click="hemisphereFilter = h.value"
                    >
                      {{ h.label }}
                    </button>
                  </div>
                </div>
                <div>
                  <p class="mb-2 text-sm text-base-content/70">月份</p>
                  <select
                    v-model="monthFilter"
                    class="select select-bordered rounded-xl h-12 text-base w-full"
                  >
                    <option value="">全部月份</option>
                    <option value="current">当前月</option>
                    <option
                      v-for="m in monthOptions"
                      :key="m.value"
                      :value="m.value"
                    >
                      {{ m.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <p class="mb-2 text-sm text-base-content/70">活动</p>
                  <select
                    v-model="eventFilter"
                    class="select select-bordered rounded-xl h-12 text-base w-full"
                  >
                    <option value="">全部活动</option>
                    <option
                      v-for="ev in critterEventsList"
                      :key="ev.id"
                      :value="ev.id"
                    >
                      {{ ev.title }}
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <!-- 每页数量 -->
            <section>
              <h3 class="mb-3 font-medium text-base">每页数量</h3>
              <div class="flex items-center gap-3">
                <span class="text-sm text-base-content/70">每页显示</span>
                <select v-model="perPage" class="select select-bordered rounded-xl h-12 w-32 text-base">
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                  <option :value="200">200</option>
                  <option :value="500">500</option>
                </select>
              </div>
            </section>
          </div>
          
          <!-- 底部操作按钮 -->
          <div class="px-4 py-4 border-t border-base-300 flex items-center justify-between gap-3 bg-base-100/80 backdrop-blur-sm">
            <button class="btn btn-outline flex-1 h-12 rounded-2xl" type="button" @click="resetFilters">
              重置筛选
            </button>
            <button class="btn btn-success flex-1 h-12 rounded-2xl" type="button" @click="closeFilterDrawer">
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import CatalogueDetailContent from '../components/catalogue/CatalogueDetailContent.vue'
import {
  fetchAcnhData,
  fetchCatalogueRaw,
  CATALOGUE_CATEGORIES,
  getIconUrl as getIconUrlFromApi,
  flattenFurnitureData,
  VILLAGER_SPECIES_ZH,
  onImgError,
  isCritterAvailableInMonth,
  hasCritterEvent,
  getCritterEventsList
} from '../lib/acnh-api'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { useCatalogueCollected } from '../composables/useCatalogueCollected'
import { logActivity, ACTIVITY_KIND } from '../lib/activityLog'

const authStore = useAuthStore()
const categories = CATALOGUE_CATEGORIES
const activeCategory = ref('fish')
const items = ref([])
const loading = ref(false)
const perPage = ref(20)
const page = ref(1)
const debouncedSearchQuery = ref('')
const speciesFilter = ref('')
const searchQuery = ref('')
const collectedFilter = ref('all') // all | collected | uncollected
const hemisphereFilter = ref('north')
const monthFilter = ref('')
const eventFilter = ref('')
const critterEventsList = ref([])
const catalogueMode = ref('view') // view | mark | wish（默认查看模式）
const fabRef = ref(null)
const showDetailDialog = ref(false)
const detailCategory = ref('')
const detailItemId = ref('')
const detailDialogRef = ref(null)
const showFilterDrawer = ref(false)

function setCatalogueMode(mode) {
  catalogueMode.value = mode
  // 让 FAB 失去焦点，DaisyUI fab 会自动收起
  setTimeout(() => fabRef.value?.querySelector('[tabindex="0"]')?.blur(), 0)
}

function openFilterDrawer() {
  showFilterDrawer.value = true
}

function closeFilterDrawer() {
  showFilterDrawer.value = false
}

const collectedFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'collected', label: '已收集' },
  { value: 'uncollected', label: '未收集' }
]

const isCritterCategory = computed(() =>
  ['fish', 'bugs', 'sea'].includes(activeCategory.value)
)
const hemisphereOptions = [
  { value: 'north', label: '北半球' },
  { value: 'south', label: '南半球' }
]
const monthOptions = [
  { value: '0', label: '1月' }, { value: '1', label: '2月' }, { value: '2', label: '3月' },
  { value: '3', label: '4月' }, { value: '4', label: '5月' }, { value: '5', label: '6月' },
  { value: '6', label: '7月' }, { value: '7', label: '8月' }, { value: '8', label: '9月' },
  { value: '9', label: '10月' }, { value: '10', label: '11月' }, { value: '11', label: '12月' }
]

function resetFilters() {
  collectedFilter.value = 'all'
  speciesFilter.value = ''
  hemisphereFilter.value = 'north'
  monthFilter.value = ''
  eventFilter.value = ''
  page.value = 1
}

const { collectedSet, loadCollected, isCollected: isCollectedEntry, toggleCollected } = useCatalogueCollected()
const wishlistNames = ref(new Set()) // 心愿单中的物品名称
const catalogLoadError = ref(null)
const wishlistToast = ref('')
let wishlistToastTimeout = null
let searchDebounceTimeout = null

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
    const set = new Set((data || []).map((r) => r.item_name?.trim()).filter(Boolean))
    wishlistNames.value = set
  } catch (err) {
    console.error('加载心愿单失败:', err)
    wishlistNames.value = new Set()
  }
}

function isCollected(item) {
  return isCollectedEntry(activeCategory.value, getItemId(item))
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
    logActivity(authStore.user.id, ACTIVITY_KIND.WISHLIST_ADD, {
      item_name: itemName.trim(),
      item_type: itemType
    })
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
  const itemId = getItemId(item)
  const category = activeCategory.value
  const wasCollected = isCollected(item)
  const title = getItemTitle(item)
  await toggleCollected(category, itemId)
  if (!wasCollected) {
    logActivity(authStore.user.id, ACTIVITY_KIND.CATALOGUE_OWNED_ADD, {
      category,
      item_id: String(itemId),
      item_name: title
    })
  } else {
    logActivity(authStore.user.id, ACTIVITY_KIND.CATALOGUE_OWNED_REMOVE, {
      category,
      item_id: String(itemId),
      item_name: title
    })
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
  const fn = item?.['file-name'] || item?.fileName
  
  let iconUrl = ''
  if (path) {
    iconUrl = getIconUrlFromApi(activeCategory.value, path)
  } else if (fn) {
    iconUrl = getIconUrlFromApi(activeCategory.value, fn)
  }
  
  return iconUrl
}

function hasProperties(item) {
  return !!(item?.cat || item?.diy || item?.bcu || item?.sea)
}

function openDetailDialog(item) {
  detailCategory.value = activeCategory.value
  detailItemId.value = getItemId(item)
  showDetailDialog.value = true
  nextTick(() => {
    detailDialogRef.value?.showModal()
  })
}

function closeDetailDialog() {
  detailDialogRef.value?.close()
}

function onDetailDialogClose() {
  showDetailDialog.value = false
}

function onItemClick(item) {
  if (catalogueMode.value === 'view') {
    openDetailDialog(item)
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
      // 对于家具类数据，需要特殊处理文件名提取
      items.value = flattenFurnitureData(raw)
    } else {
      items.value = Object.entries(raw).map(([key, val]) => ({
        ...val,
        fileName: val['file-name'] || val?.fileName || key
      }))
    }
    if (isCritterCategory.value && critterEventsList.value.length === 0) {
      try {
        const catalogueRaw = await fetchCatalogueRaw()
        if (catalogueRaw) critterEventsList.value = getCritterEventsList(catalogueRaw)
      } catch (_) {}
    }
  } catch (err) {
    console.error('图鉴数据加载失败:', err)
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

  // 2. 鱼/虫/海：按半球、月份、活动筛选（参考 cav/nhd/shd、evt）
  if (isCritterCategory.value) {
    const hem = hemisphereFilter.value || 'north'
    const monthVal = monthFilter.value
    const monthIndex =
      monthVal === 'current'
        ? new Date().getMonth()
        : (monthVal !== '' && monthVal !== undefined && Number(monthVal) >= 0 && Number(monthVal) <= 11)
          ? Number(monthVal)
          : null
    const selectedEventIds = eventFilter.value ? [eventFilter.value] : []
    base = base.filter((item) => {
      if (monthIndex != null && !isCritterAvailableInMonth(item, hem, monthIndex)) return false
      if (selectedEventIds.length > 0 && !hasCritterEvent(item.eventIds, selectedEventIds)) return false
      return true
    })
  }

  // 3. 收集状态筛选
  if (collectedFilter.value === 'collected') {
    base = base.filter(i => isCollected(i))
  } else if (collectedFilter.value === 'uncollected') {
    base = base.filter(i => !isCollected(i))
  }

  // 4. 搜索
  const q = (debouncedSearchQuery.value || '').toLowerCase().trim()
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

watch(
  [perPage, speciesFilter, collectedFilter, hemisphereFilter, monthFilter, eventFilter, debouncedSearchQuery],
  () => {
    page.value = 1
  }
)

watch(
  searchQuery,
  (val) => {
    if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
    searchDebounceTimeout = setTimeout(() => {
      debouncedSearchQuery.value = val
    }, 250)
  },
  { immediate: true }
)
watch(() => authStore.user, () => {
  loadCollected()
  loadWishlist()
}, { immediate: true })

onMounted(() => {
  loadCollected()
  loadWishlist()

  // HomeView 便签弹窗跳转：预填分类/搜索，并可选自动打开详情
  try {
    const raw = localStorage.getItem('acnh_catalogue_jump')
    if (raw) {
      localStorage.removeItem('acnh_catalogue_jump')
      const parsed = JSON.parse(raw)
      const catId = parsed?.categoryId
      const itemId = parsed?.itemId
      const search = parsed?.search

      if (catId && categories.some((c) => c.id === catId)) activeCategory.value = catId
      if (typeof search === 'string') searchQuery.value = search

      // 等数据加载后再尝试打开详情
      loadCategoryData().then(() => {
        if (!itemId) return
        const hit = items.value.find((it) => getItemId(it) === String(itemId))
        if (hit) openDetailDialog(hit)
      })
      return
    }
  } catch (_) {}

  loadCategoryData()
})

onUnmounted(() => {
  if (wishlistToastTimeout) clearTimeout(wishlistToastTimeout)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

/* 图鉴详情弹窗：DaisyUI modal 内内容区填满并支持内部滚动 */
.catalogue-detail-modal :deep(.modal-box) {
  max-height: 90vh;
}

.catalogue-detail-modal :deep(.catalogue-detail-content) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.catalogue-detail-modal :deep(.dialog-container) {
  box-shadow: none;
  border: none;
  flex: 1;
  min-height: 0;
}

/* 列表卡片中的"新增"角标样式 */
.item .new {
  position: absolute;
  top: 40px;
  left: 0;
  padding: 4px 8px;
  line-height: 12px;
  font-size: 12px;
  text-transform: uppercase;
  color: #fff;
  background-color: #ffa600;
  border-radius: 0 4px 4px 0;
  z-index: 1;
}

/* 底部筛选框动画 */
.filter-bottom-enter-active {
  transition: opacity 300ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.filter-bottom-leave-active {
  transition: opacity 250ms ease, transform 300ms cubic-bezier(0.4, 0, 0.6, 1);
}

.filter-bottom-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.filter-bottom-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* 移动端优化：更快的动画响应 */
@media (max-width: 639px) {
  .filter-bottom-enter-active {
    transition: opacity 250ms ease, transform 350ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .filter-bottom-leave-active {
    transition: opacity 200ms ease, transform 250ms cubic-bezier(0.4, 0, 0.6, 1);
  }
}

/* 减少动画对性能敏感用户的干扰 */
@media (prefers-reduced-motion: reduce) {
  .filter-bottom-enter-active,
  .filter-bottom-leave-active {
    transition: opacity 100ms ease;
  }
  
  .filter-bottom-enter-from,
  .filter-bottom-leave-to {
    transform: none;
  }
}

/* 高性能动画优化 */
.filter-bottom-enter-active,
.filter-bottom-leave-active {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>
