<template>
  <div class="space-y-4">
    <!-- 护照卡 -->
    <div class="acnh-card p-4 sm:p-5 bg-base-100/95 border border-base-300">
      <div
        class="rounded-3xl p-4 border border-base-300 bg-[radial-gradient(1200px_600px_at_0%_0%,rgba(255,255,255,0.7),transparent_55%),radial-gradient(900px_500px_at_100%_0%,rgba(124,179,66,0.22),transparent_55%),linear-gradient(135deg,rgba(255,248,225,0.85),rgba(227,242,253,0.65))]"
      >
        <p class="text-sm text-base-content/60 text-center mb-3">我的护照与进度</p>

        <div class="flex items-start gap-4">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-base-100 border border-base-300 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              v-if="authStore.profile?.avatar_url"
              :src="authStore.profile.avatar_url"
              alt="avatar"
              class="w-full h-full object-cover"
            />
            <Icon v-else icon="mdi:account-circle" class="w-14 h-14 text-base-content/40" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-xl font-extrabold tracking-wide truncate">{{ authStore.profile?.display_name || '岛民' }}</p>
            </div>

            <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-content/70">
              <span class="truncate">{{ authStore.profile?.island_name || '未命名小岛' }}</span>
              <span class="opacity-40">·</span>
              <span class="inline-flex items-center gap-1">
                <Icon icon="mdi:leaf" class="w-4 h-4 text-[#7CB342]" />
                {{ hemisphereLabel }}
              </span>
            </div>

            <div class="mt-2 grid grid-cols-1 gap-1 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">账户名</span>
                <span class="font-semibold truncate">{{ authStore.profile?.account_name || '未设置' }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">好友码</span>
                <span class="font-semibold truncate">{{ authStore.profile?.friend_code || '未设置' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink
            to="/calendar"
            class="btn rounded-2xl bg-base-100 border-base-300 hover:bg-base-200/60 min-h-(--touch-min)"
          >
            <Icon icon="mdi:calendar" class="w-5 h-5 shrink-0" />
            日历与活动
          </RouterLink>
          <button class="btn rounded-2xl bg-[#7CB342] text-white border-0 hover:bg-[#558B2F] min-h-(--touch-min) acnh-btn" @click="openEdit = true">
            <Icon icon="mdi:pencil" class="w-5 h-5 shrink-0" />
            编辑护照
          </button>
        </div>
      </div>

      <!-- 居民头像行 -->
      <div class="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div
          v-for="r in residentBadges"
          :key="r.key"
          class="w-12 h-12 rounded-full bg-base-100 border border-base-300 shrink-0 flex items-center justify-center overflow-hidden"
          :title="r.name"
        >
          <img v-if="r.photo" :src="r.photo" :alt="r.name" class="w-full h-full object-cover" />
          <span v-else class="text-sm font-bold text-base-content/70">{{ r.initial }}</span>
        </div>
        <div v-if="residentBadges.length === 0" class="text-sm text-base-content/60 py-2">
          去图鉴标记小动物后在此显示
        </div>
      </div>

      <!-- 进度卡片：移动端大触控区 -->
      <div class="mt-4 grid grid-cols-2 gap-3">
        <RouterLink
          v-for="card in progressCards"
          :key="card.id"
          :to="card.to"
          class="rounded-3xl border border-base-300 bg-base-100 p-3 sm:p-4 hover:bg-base-200/60 active:scale-[0.99] transition-all min-h-[88px]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', card.bg]">
                <Icon :icon="card.icon" :class="['w-6 h-6', card.fg]" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-sm truncate">{{ card.label }}</p>
                <p class="text-xs text-base-content/60">{{ card.countText }}</p>
              </div>
            </div>
          </div>
          <progress class="progress mt-2 h-2" :class="card.progressClass" :value="card.percent" max="100"></progress>
        </RouterLink>
      </div>

      <!-- 编辑护照弹窗：移动端全屏感 -->
      <dialog class="modal" :open="openEdit">
        <div class="modal-box rounded-3xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-md">
          <h3 class="font-bold text-lg mb-4">编辑护照</h3>
          <div class="space-y-4">
            <label class="form-control">
              <span class="label-text text-sm">岛名</span>
              <input v-model="edit.island_name" class="input input-bordered rounded-2xl h-12 text-base" />
            </label>
            <label class="form-control">
              <span class="label-text text-sm">昵称</span>
              <input v-model="edit.display_name" class="input input-bordered rounded-2xl h-12 text-base" />
            </label>
            <label class="form-control">
              <span class="label-text text-sm">账户名</span>
              <input v-model="edit.account_name" class="input input-bordered rounded-2xl h-12 text-base" placeholder="例如：狐狸" />
            </label>
            <label class="form-control">
              <span class="label-text text-sm">好友码</span>
              <input v-model="edit.friend_code" class="input input-bordered rounded-2xl h-12 text-base" placeholder="SW-0000-0000-0000" />
            </label>
            <label class="form-control">
              <span class="label-text text-sm">半球</span>
              <select v-model="edit.hemisphere" class="select select-bordered rounded-2xl h-12 text-base">
                <option value="">未设置</option>
                <option value="north">北半球</option>
                <option value="south">南半球</option>
              </select>
            </label>
          </div>
          <div class="modal-action gap-2">
            <button class="btn rounded-2xl min-h-(--touch-min) flex-1" @click="openEdit = false">取消</button>
            <button class="btn rounded-2xl bg-[#7CB342] text-white border-0 hover:bg-[#558B2F] min-h-(--touch-min) flex-1 acnh-btn" :disabled="savingProfile" @click="saveProfile">
              {{ savingProfile ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="openEdit = false">close</button>
        </form>
      </dialog>
    </div>

    <!-- 管理（保留原功能，但默认折叠） -->
    <div class="collapse collapse-arrow bg-base-100/95 border border-base-300 rounded-3xl">
      <input type="checkbox" />
      <div class="collapse-title font-semibold">管理（愿望清单 / 岛建 / 居民 / 图鉴）</div>
      <div class="collapse-content">
        <div class="acnh-card bg-white/95 p-4">
          <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              role="tab"
              :class="[
                'tab shrink-0 px-4 py-3 min-h-(--touch-min) rounded-xl text-sm font-medium flex items-center gap-1.5',
                activeTab === tab.id ? 'bg-[#7CB342] text-white' : 'bg-[#E8F5E9]/70 text-gray-600'
              ]"
              @click="activeTab = tab.id"
            >
              <Icon :icon="tab.icon" class="w-4 h-4 shrink-0" />
              {{ tab.label }}
            </button>
          </div>

          <!-- 材料/家具 -->
          <div v-show="activeTab === 'wishlist'" class="space-y-4 mt-4">
            <div class="flex flex-col gap-2">
              <input
                v-model="newItemName"
                type="text"
                placeholder="材料或家具名称"
                class="input input-bordered rounded-2xl h-12 text-base"
              />
              <div class="flex flex-wrap gap-2">
                <select v-model="newItemType" class="select select-bordered rounded-2xl flex-1 min-w-0 h-12 text-base">
                  <option value="material">材料</option>
                  <option value="furniture">家具</option>
                </select>
                <input
                  v-model.number="newItemQty"
                  type="number"
                  min="1"
                  placeholder="数量"
                  class="input input-bordered w-20 rounded-2xl h-12 text-base text-center shrink-0"
                />
                <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-2xl h-12 min-h-(--touch-min) px-4 shrink-0 acnh-btn" @click="addWishlistItem">
                  添加
                </button>
              </div>
            </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="item in wishlistItems"
            :key="item.id"
            :class="[
              'badge gap-1.5 py-2.5 px-3 rounded-xl text-sm',
              item.is_fulfilled ? 'badge-success opacity-75 line-through' : 'badge-outline'
            ]"
          >
            <span>{{ item.item_name }} {{ item.quantity > 1 ? `×${item.quantity}` : '' }}</span>
            <span class="text-xs opacity-75">{{ item.item_type === 'material' ? '材' : '具' }}</span>
            <button
              v-if="!item.is_fulfilled"
              @click="removeWishlistItem(item.id)"
              class="btn btn-ghost btn-xs min-h-0 h-5 w-5 p-0"
            >✕</button>
          </div>
        </div>
      </div>

      <!-- 岛建进度 -->
      <div v-show="activeTab === 'progress'" class="space-y-4 mt-4">
        <div class="flex flex-col gap-2">
          <input
            v-model="newAreaName"
            type="text"
            placeholder="区域名称"
            class="input input-bordered rounded-2xl h-12 text-base"
          />
          <div class="flex gap-2 items-center">
            <input
              v-model.number="newAreaProgress"
              type="number"
              min="0"
              max="100"
              placeholder="进度"
              class="input input-bordered flex-1 min-w-0 rounded-2xl h-12 text-base"
            />
            <span class="text-sm shrink-0">%</span>
            <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-2xl h-12 min-h-(--touch-min) px-4 shrink-0 acnh-btn" @click="addProgress">
              添加
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div
            v-for="p in islandProgress"
            :key="p.id"
            class="flex items-center gap-2 p-3 rounded-xl bg-[#FFF8E1]/50 min-h-[48px]"
          >
            <span class="font-medium text-sm min-w-[80px] truncate">{{ p.area_name }}</span>
            <progress class="progress progress-success flex-1 h-2 min-w-0" :value="p.progress_percent" max="100"></progress>
            <span class="text-sm w-10 shrink-0">{{ p.progress_percent }}%</span>
            <button @click="removeProgress(p.id)" class="btn btn-ghost min-h-[44px] h-10 w-10 p-0 rounded-xl shrink-0" aria-label="删除">✕</button>
          </div>
        </div>
      </div>

      <!-- 居民（根据图鉴标记显示，仅展示不可编辑） -->
      <div v-show="activeTab === 'residents'" class="space-y-4 mt-4">
        <p class="text-sm text-base-content/70">在「图鉴」中标记曾拥有的小动物后，会在此显示</p>
        <RouterLink to="/catalogue" class="btn btn-sm bg-[#7CB342] text-white border-0 rounded-xl">
          <Icon icon="mdi:book-open-page-variant" class="w-4 h-4" />
          去图鉴标记
        </RouterLink>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="r in collectedVillagers"
            :key="r.item_id"
            class="p-3 rounded-xl bg-[#E8F5E9]/50 border-2 border-[#9CCC65]/30"
          >
            <div class="flex items-center gap-2">
              <img v-if="r.icon" :src="r.icon" :alt="r.name" class="w-10 h-10 rounded-lg object-cover" />
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-sm truncate">{{ r.name }}</h3>
                <p v-if="r.species" class="text-xs opacity-75">{{ r.speciesLabel }}</p>
              </div>
            </div>
          </div>
          <div v-if="collectedVillagers.length === 0" class="col-span-2 text-sm text-base-content/60 py-4 text-center">
            暂无，去图鉴标记小动物吧
          </div>
        </div>
      </div>

      <!-- 图鉴（根据图鉴标记显示，仅展示不可编辑） -->
      <div v-show="activeTab === 'catalog'" class="space-y-4 mt-4">
        <p class="text-sm text-base-content/70">在「图鉴」中标记收集后，会在此显示进度</p>
        <RouterLink to="/catalogue" class="btn btn-sm bg-[#7CB342] text-white border-0 rounded-xl">
          <Icon icon="mdi:book-open-page-variant" class="w-4 h-4" />
          去图鉴标记
        </RouterLink>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="c in catalogDisplayTypes"
            :key="c.type"
            class="p-3 rounded-xl bg-[#E3F2FD]/50 border-2 border-[#64B5F6]/30"
          >
            <h4 class="font-semibold text-[#1976D2] text-sm flex items-center gap-1.5">
              <Icon :icon="c.icon" class="w-4 h-4" />
              {{ c.label }}
            </h4>
            <div class="flex items-center gap-2 mt-2">
              <span class="font-semibold">{{ getCollectedCount(c.type) }}</span>
              <span class="text-xs">/ {{ c.total }}</span>
            </div>
            <progress
              class="progress progress-info mt-2 h-1.5"
              :value="(getCollectedCount(c.type) / c.total) * 100"
              max="100"
            ></progress>
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
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { CATALOGUE_CATEGORIES, fetchAcnhData, getIconUrl, VILLAGER_SPECIES_ZH } from '../lib/acnh-api'

const authStore = useAuthStore()
const activeTab = ref('wishlist')
const openEdit = ref(false)
const savingProfile = ref(false)
const edit = ref({
  display_name: '',
  island_name: '',
  account_name: '',
  friend_code: '',
  hemisphere: ''
})

const wishlistItems = ref([])
const newItemName = ref('')
const newItemType = ref('material')
const newItemQty = ref(1)

const islandProgress = ref([])
const newAreaName = ref('')
const newAreaProgress = ref(0)

const collectedVillagerIds = ref([])
const villagerDataMap = ref({}) // item_id -> { name, species, icon }

const catalogDisplayTypes = [
  { type: 'fish', label: '鱼类', icon: 'mdi:fish', total: 80 },
  { type: 'bugs', label: '昆虫', icon: 'mdi:butterfly', total: 80 },
  { type: 'sea', label: '海洋生物', icon: 'mdi:octopus', total: 40 },
  { type: 'fossils', label: '化石', icon: 'mdi:bone', total: 73 },
  { type: 'art', label: '艺术品', icon: 'mdi:image-frame', total: 43 }
]

const tabs = [
  { id: 'wishlist', label: '材料/家具', icon: 'mdi:package-variant' },
  { id: 'progress', label: '岛建', icon: 'mdi:island' },
  { id: 'residents', label: '居民', icon: 'mdi:cat' },
  { id: 'catalog', label: '图鉴', icon: 'mdi:book-open-page-variant' }
]

const hemisphereLabel = computed(() => {
  const h = authStore.profile?.hemisphere
  if (h === 'south') return '南半球'
  if (h === 'north') return '北半球'
  return '半球未设置'
})

const residentBadges = computed(() => {
  return collectedVillagers.value.slice(0, 10).map(r => ({
    key: r.item_id,
    name: r.name,
    photo: r.icon,
    initial: String(r.name || '?').slice(0, 1)
  }))
})

const collectedVillagers = computed(() => {
  return collectedVillagerIds.value.map(id => {
    const v = villagerDataMap.value[id]
    if (!v) return { item_id: id, name: id, speciesLabel: '', icon: '' }
    const name = v.name?.['name-CNzh'] || v.name?.['name-TWzh'] || v.name?.['name-USen'] || Object.values(v.name || {})[0] || id
    const speciesLabel = v.species ? (VILLAGER_SPECIES_ZH[v.species] || v.species) : ''
    const icon = v.iconPath ? getIconUrl('villagers', v.iconPath) : ''
    return { item_id: id, name, speciesLabel, icon }
  })
})

const collectedCounts = ref({})

async function loadCollectedCounts() {
  if (!authStore.user) return
  const { data } = await supabase
    .from('catalogue_collected')
    .select('category')
    .eq('user_id', authStore.user.id)
  const map = {}
  for (const row of data || []) {
    map[row.category] = (map[row.category] || 0) + 1
  }
  collectedCounts.value = map
}

const totalsByCategory = Object.fromEntries(CATALOGUE_CATEGORIES.map(c => [c.id, c.total]))

const progressCards = computed(() => {
  const get = (id) => collectedCounts.value[id] || 0
  const cards = [
    { id: 'houseware', label: '全部家具', icon: 'mdi:sofa', to: '/catalogue', total: totalsByCategory.houseware || 0, bg: 'bg-[#E8F5E9]', fg: 'text-[#558B2F]', progressClass: 'progress-success' },
    { id: 'misc', label: '小物件', icon: 'mdi:package-variant', to: '/catalogue', total: totalsByCategory.misc || 0, bg: 'bg-[#FFF8E1]', fg: 'text-[#F9A825]', progressClass: 'progress-warning' },
    { id: 'sea', label: '海洋生物', icon: 'mdi:octopus', to: '/catalogue', total: totalsByCategory.sea || 0, bg: 'bg-[#E3F2FD]', fg: 'text-[#1976D2]', progressClass: 'progress-info' },
    { id: 'fish', label: '鱼类', icon: 'mdi:fish', to: '/catalogue', total: totalsByCategory.fish || 0, bg: 'bg-[#E3F2FD]', fg: 'text-[#1976D2]', progressClass: 'progress-info' },
    { id: 'bugs', label: '昆虫', icon: 'mdi:butterfly', to: '/catalogue', total: totalsByCategory.bugs || 0, bg: 'bg-[#FCE4EC]', fg: 'text-[#C2185B]', progressClass: 'progress-secondary' },
    { id: 'fossils', label: '化石', icon: 'mdi:bone', to: '/catalogue', total: totalsByCategory.fossils || 0, bg: 'bg-[#FFF8E1]', fg: 'text-[#F9A825]', progressClass: 'progress-warning' },
    { id: 'art', label: '艺术品', icon: 'mdi:image-frame', to: '/catalogue', total: totalsByCategory.art || 0, bg: 'bg-[#E8F5E9]', fg: 'text-[#558B2F]', progressClass: 'progress-success' },
    { id: 'turnips', label: '大头菜', icon: 'mdi:sprout', to: '/turnips', total: 1, bg: 'bg-[#E8F5E9]', fg: 'text-[#558B2F]', progressClass: 'progress-success', custom: true }
  ]

  return cards.map(c => {
    const current = c.custom ? 1 : get(c.id)
    const total = c.custom ? 1 : (c.total || 0)
    const percent = total ? Math.round((current / total) * 100) : 0
    return {
      ...c,
      current,
      total,
      percent,
      countText: c.custom ? '自动保存本周数据' : `${current}/${total}`
    }
  })
})

function syncEditFromProfile() {
  edit.value = {
    display_name: authStore.profile?.display_name || '',
    island_name: authStore.profile?.island_name || '',
    account_name: authStore.profile?.account_name || '',
    friend_code: authStore.profile?.friend_code || '',
    hemisphere: authStore.profile?.hemisphere || ''
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await authStore.updateProfile({
      display_name: edit.value.display_name || '岛民',
      island_name: edit.value.island_name || '未命名小岛',
      account_name: edit.value.account_name || null,
      friend_code: edit.value.friend_code || null,
      hemisphere: edit.value.hemisphere || null,
      updated_at: new Date().toISOString()
    })
    openEdit.value = false
  } finally {
    savingProfile.value = false
  }
}

async function loadWishlist() {
  const { data } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', authStore.user.id)
    .order('created_at', { ascending: false })
  wishlistItems.value = data || []
}

async function addWishlistItem() {
  if (!newItemName.value.trim()) return
  await supabase.from('wishlist_items').insert({
    user_id: authStore.user.id,
    item_name: newItemName.value.trim(),
    item_type: newItemType.value,
    quantity: newItemQty.value || 1
  })
  newItemName.value = ''
  newItemQty.value = 1
  loadWishlist()
}

async function removeWishlistItem(id) {
  await supabase.from('wishlist_items').delete().eq('id', id)
  loadWishlist()
}

async function loadProgress() {
  const { data } = await supabase
    .from('island_progress')
    .select('*')
    .eq('user_id', authStore.user.id)
  islandProgress.value = data || []
}

async function addProgress() {
  if (!newAreaName.value.trim()) return
  await supabase.from('island_progress').upsert({
    user_id: authStore.user.id,
    area_name: newAreaName.value.trim(),
    progress_percent: newAreaProgress.value || 0
  }, { onConflict: 'user_id,area_name' })
  newAreaName.value = ''
  newAreaProgress.value = 0
  loadProgress()
}

async function removeProgress(id) {
  await supabase.from('island_progress').delete().eq('id', id)
  loadProgress()
}


function getCollectedCount(type) {
  return collectedCounts.value[type] || 0
}

async function loadCollectedVillagers() {
  if (!authStore.user) {
    collectedVillagerIds.value = []
    return
  }
  const { data } = await supabase
    .from('catalogue_collected')
    .select('item_id')
    .eq('user_id', authStore.user.id)
    .eq('category', 'villagers')
  collectedVillagerIds.value = (data || []).map(r => r.item_id)
  if (collectedVillagerIds.value.length > 0) {
    loadVillagerData()
  } else {
    villagerDataMap.value = {}
  }
}

async function loadVillagerData() {
  try {
    const arr = await fetchAcnhData('villagers')
    const map = {}
    for (const v of arr || []) {
      const fn = v?.['file-name'] || v?.fileName || v?.id || ''
      if (fn) {
        map[fn] = v
        if (v?.fileName && v.fileName !== fn) map[v.fileName] = v
      }
    }
    villagerDataMap.value = map
  } catch (err) {
    console.error('加载小动物数据失败:', err)
    villagerDataMap.value = {}
  }
}

onMounted(() => {
  syncEditFromProfile()
  loadWishlist()
  loadProgress()
  loadCollectedVillagers()
  loadCollectedCounts()
})
</script>
