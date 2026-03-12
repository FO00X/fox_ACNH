<template>
  <div class="space-y-4">
    <div class="acnh-card bg-white/95 p-4">
      <h2 class="text-lg font-bold text-[#558B2F] mb-3 flex items-center gap-2">
        <Icon icon="mdi:island" class="w-5 h-5" />
        {{ authStore.profile?.island_name }}
      </h2>

      <!-- 快捷入口：日历 -->
      <RouterLink
        to="/calendar"
        class="flex items-center justify-between gap-3 p-3 rounded-2xl border border-base-300 bg-base-100 hover:bg-base-200/60 transition-colors mb-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl bg-[#E3F2FD] flex items-center justify-center shrink-0">
            <Icon icon="mdi:calendar" class="w-6 h-6 text-[#1976D2]" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-sm truncate">日历与活动</p>
            <p class="text-xs text-base-content/60 truncate">村民生日 · 即将到来活动</p>
          </div>
        </div>
        <Icon icon="mdi:chevron-right" class="w-6 h-6 text-base-content/40" />
      </RouterLink>

      <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-hide" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          role="tab"
          :class="[
            'tab shrink-0 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5',
            activeTab === tab.id ? 'bg-[#7CB342] text-white' : 'bg-[#E8F5E9]/70 text-gray-600'
          ]"
          @click="activeTab = tab.id"
        >
          <Icon :icon="tab.icon" class="w-4 h-4" />
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
            class="input input-bordered rounded-xl h-11"
          />
          <div class="flex gap-2">
            <select v-model="newItemType" class="select select-bordered rounded-xl flex-1 h-11">
              <option value="material">材料</option>
              <option value="furniture">家具</option>
            </select>
            <input
              v-model.number="newItemQty"
              type="number"
              min="1"
              placeholder="数量"
              class="input input-bordered w-16 rounded-xl h-11 text-center"
            />
            <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl h-11 min-h-0 px-4" @click="addWishlistItem">
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
            class="input input-bordered rounded-xl h-11"
          />
          <div class="flex gap-2 items-center">
            <input
              v-model.number="newAreaProgress"
              type="number"
              min="0"
              max="100"
              placeholder="进度"
              class="input input-bordered flex-1 rounded-xl h-11"
            />
            <span class="text-sm">%</span>
            <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl h-11 min-h-0 px-4" @click="addProgress">
              添加
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div
            v-for="p in islandProgress"
            :key="p.id"
            class="flex items-center gap-2 p-3 rounded-xl bg-[#FFF8E1]/50"
          >
            <span class="font-medium text-sm min-w-[80px] truncate">{{ p.area_name }}</span>
            <progress class="progress progress-success flex-1 h-2" :value="p.progress_percent" max="100"></progress>
            <span class="text-sm w-10">{{ p.progress_percent }}%</span>
            <button @click="removeProgress(p.id)" class="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0">✕</button>
          </div>
        </div>
      </div>

      <!-- 居民 -->
      <div v-show="activeTab === 'residents'" class="space-y-4 mt-4">
        <div class="flex flex-col gap-2">
          <input
            v-model="newResidentName"
            type="text"
            placeholder="居民名字"
            class="input input-bordered rounded-xl h-11"
          />
          <div class="flex gap-2 flex-wrap">
            <input
              v-model="newResidentSpecies"
              type="text"
              placeholder="物种"
              class="input input-bordered rounded-xl h-11 flex-1 min-w-0"
            />
            <label class="flex items-center gap-2 shrink-0 py-2">
              <input v-model="newResidentDreamie" type="checkbox" class="checkbox checkbox-success checkbox-sm" />
              <span class="text-sm">梦寐以求</span>
            </label>
            <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl h-11 min-h-0 px-4" @click="addResident">
              添加
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="r in residents"
            :key="r.id"
            class="p-3 rounded-xl bg-[#E8F5E9]/50 border-2 border-[#9CCC65]/30"
          >
            <h3 class="font-bold text-sm">{{ r.resident_name }}</h3>
            <p v-if="r.species" class="text-xs opacity-75">{{ r.species }}</p>
            <span v-if="r.is_dreamie" class="badge badge-sm badge-warning mt-1">梦寐以求</span>
            <button @click="removeResident(r.id)" class="btn btn-ghost btn-xs mt-1 min-h-0 h-6 text-xs">移除</button>
          </div>
        </div>
      </div>

      <!-- 图鉴 -->
      <div v-show="activeTab === 'catalog'" class="space-y-4 mt-4">
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="c in catalogTypes"
            :key="c.type"
            class="p-3 rounded-xl bg-[#E3F2FD]/50 border-2 border-[#64B5F6]/30"
          >
            <h4 class="font-semibold text-[#1976D2] text-sm flex items-center gap-1.5">
              <Icon :icon="c.icon" class="w-4 h-4" />
              {{ c.label }}
            </h4>
            <div class="flex items-center gap-2 mt-2">
              <input
                :value="getCatalogCount(c.type)"
                @input="updateCatalog(c.type, $event.target.value)"
                type="number"
                min="0"
                :max="c.total"
                class="input input-bordered input-sm w-14 rounded-lg h-8 text-sm"
              />
              <span class="text-xs">/ {{ c.total }}</span>
            </div>
            <progress
              class="progress progress-info mt-2 h-1.5"
              :value="(getCatalogCount(c.type) / c.total) * 100"
              max="100"
            ></progress>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()
const activeTab = ref('wishlist')

const wishlistItems = ref([])
const newItemName = ref('')
const newItemType = ref('material')
const newItemQty = ref(1)

const islandProgress = ref([])
const newAreaName = ref('')
const newAreaProgress = ref(0)

const residents = ref([])
const newResidentName = ref('')
const newResidentSpecies = ref('')
const newResidentDreamie = ref(false)

const catalogData = ref({})
const catalogTypes = [
  { type: 'fish', label: '鱼类', icon: 'mdi:fish', total: 80 },
  { type: 'insect', label: '昆虫', icon: 'mdi:butterfly', total: 80 },
  { type: 'fossil', label: '化石', icon: 'mdi:bone', total: 73 },
  { type: 'art', label: '艺术品', icon: 'mdi:image-frame', total: 43 },
  { type: 'sea_creature', label: '海洋生物', icon: 'mdi:octopus', total: 40 }
]

const tabs = [
  { id: 'wishlist', label: '材料/家具', icon: 'mdi:package-variant' },
  { id: 'progress', label: '岛建', icon: 'mdi:island' },
  { id: 'residents', label: '居民', icon: 'mdi:cat' },
  { id: 'catalog', label: '图鉴', icon: 'mdi:book-open-page-variant' }
]

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

async function loadResidents() {
  const { data } = await supabase
    .from('island_residents')
    .select('*')
    .eq('user_id', authStore.user.id)
  residents.value = data || []
}

async function addResident() {
  if (!newResidentName.value.trim()) return
  await supabase.from('island_residents').insert({
    user_id: authStore.user.id,
    resident_name: newResidentName.value.trim(),
    species: newResidentSpecies.value || null,
    is_dreamie: newResidentDreamie.value
  })
  newResidentName.value = ''
  newResidentSpecies.value = ''
  newResidentDreamie.value = false
  loadResidents()
}

async function removeResident(id) {
  await supabase.from('island_residents').delete().eq('id', id)
  loadResidents()
}

async function loadCatalog() {
  const { data } = await supabase
    .from('catalog_progress')
    .select('*')
    .eq('user_id', authStore.user.id)
  catalogData.value = Object.fromEntries((data || []).map(d => [d.catalog_type, d]))
}

function getCatalogCount(type) {
  return catalogData.value[type]?.collected_count ?? 0
}

async function updateCatalog(type, val) {
  const count = Math.max(0, parseInt(val) || 0)
  const total = catalogTypes.find(c => c.type === type)?.total ?? 80
  await supabase.from('catalog_progress').upsert({
    user_id: authStore.user.id,
    catalog_type: type,
    total_count: total,
    collected_count: Math.min(count, total)
  }, { onConflict: 'user_id,catalog_type' })
  loadCatalog()
}

onMounted(() => {
  loadWishlist()
  loadProgress()
  loadResidents()
  loadCatalog()
})
</script>
