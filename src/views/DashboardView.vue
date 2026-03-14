<template>
  <div class="space-y-4 motion-rise">
    <!-- 护照卡 -->
    <div class="acnh-card">
      <div
        class="rounded-3xl p-4 border border-base-300 bg-base-100 relative"
      >
        <button
          type="button"
          class="btn btn-circle btn-sm absolute top-3 right-3 bg-[#7CB342] text-white border-0 hover:bg-[#558B2F] min-h-0 h-9 w-9 acnh-btn"
          title="编辑护照"
          aria-label="编辑护照"
          @click="openEdit = true"
        >
          <Icon icon="mdi:pencil" class="w-5 h-5" />
        </button>
        <p class="text-sm text-base-content/60 text-center mb-3">我的护照</p>

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
                <span class="text-base-content/60">生日</span>
                <span class="font-semibold truncate">{{ profileBirthdayLabel }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/60">好友码</span>
                <span class="font-semibold truncate">{{ authStore.profile?.friend_code || '未设置' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 居民头像行：一行 5 个，多行换行 -->
      <div class="mt-4 grid grid-cols-5 gap-2 motion-stagger">
        <div
          v-for="r in residentBadges"
          :key="r.key"
          class="w-12 h-12 rounded-full bg-base-100 border border-base-300 flex items-center justify-center overflow-hidden motion-pop justify-self-start"
          :title="r.name"
        >
          <img v-if="r.photo" :src="r.photo" :alt="r.name" class="w-full h-full object-cover" />
          <span v-else class="text-sm font-bold text-base-content/70">{{ r.initial }}</span>
        </div>
        <div v-if="residentBadges.length === 0" class="col-span-5 text-sm text-base-content/60 py-2">
          去图鉴标记小动物后在此显示
        </div>
      </div>

      <!-- 进度卡片：移动端大触控区 -->
      <div class="mt-4 grid grid-cols-2 gap-3 motion-stagger">
        <RouterLink
          v-for="card in progressCards"
          :key="card.id"
          :to="card.to"
          class="rounded-3xl border border-base-300 bg-base-100 p-3 sm:p-4 hover:bg-base-200/60 active:scale-[0.99] transition-all min-h-[88px] tap-lift"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden', card.bg]">
                <img v-if="card.acnhIcon" :src="card.acnhIcon" :alt="card.label" class="w-7 h-7 object-contain" loading="lazy" />
                <Icon v-else :icon="card.icon" :class="['w-6 h-6', card.fg]" />
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
            <div class="form-control">
              <span class="label-text text-sm mb-2">头像</span>
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-2xl border border-base-300 bg-base-100 overflow-hidden flex items-center justify-center shrink-0">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="avatar preview" class="w-full h-full object-cover" />
                  <Icon v-else icon="mdi:account-circle" class="w-10 h-10 text-base-content/40" />
                </div>
                <div class="flex-1 min-w-0 space-y-1.5">
                  <input
                    :key="avatarInputKey"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    class="file-input file-input-bordered file-input-sm w-full"
                    :disabled="uploadingAvatar || processingAvatar || savingProfile"
                    @change="onAvatarSelected"
                  />
                  <p class="text-xs text-base-content/60">支持 JPG/PNG/WebP，建议 8MB 内，将自动 1:1 裁剪并压缩</p>
                  <p v-if="avatarCompressedInfo" class="text-xs text-success">{{ avatarCompressedInfo }}</p>
                  <p v-if="avatarUploadError" class="text-xs text-error">{{ avatarUploadError }}</p>
                </div>
              </div>
            </div>
            <label class="form-control">
              <span class="label-text text-sm">岛名</span>
              <input v-model="edit.island_name" class="input input-bordered rounded-2xl h-12 text-base" />
            </label>
            <label class="form-control">
              <span class="label-text text-sm">昵称</span>
              <input v-model="edit.display_name" class="input input-bordered rounded-2xl h-12 text-base" />
            </label>
            <label class="form-control">
              <span class="label-text text-sm">生日</span>
              <input v-model="edit.birthday" type="date" class="input input-bordered rounded-2xl h-12 text-base" />
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
            <button class="btn rounded-2xl bg-[#7CB342] text-white border-0 hover:bg-[#558B2F] min-h-(--touch-min) flex-1 acnh-btn" :disabled="savingProfile || uploadingAvatar || processingAvatar || cropModalOpen" @click="saveProfile">
              {{ savingProfile ? '保存中...' : uploadingAvatar ? '上传中...' : processingAvatar ? '处理中...' : '保存' }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="openEdit = false">close</button>
        </form>
      </dialog>

      <dialog class="modal" :open="cropModalOpen">
        <div class="modal-box rounded-3xl w-[95vw] max-w-sm">
          <h3 class="font-bold text-lg mb-3">裁剪头像（1:1）</h3>
          <div class="w-full aspect-square rounded-2xl bg-base-200 overflow-hidden relative">
            <img
              v-if="cropSourceUrl"
              :src="cropSourceUrl"
              alt="crop source"
              class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              :style="{ transform: `scale(${cropScale})`, transformOrigin: 'center', objectPosition: `${50 + cropOffsetX}% ${50 + cropOffsetY}%` }"
            />
          </div>
          <div class="mt-4 space-y-3">
            <label class="form-control">
              <span class="label-text text-xs text-base-content/70 mb-1">缩放</span>
              <input v-model.number="cropScale" type="range" min="1" max="3" step="0.01" class="range range-success range-sm" />
            </label>
            <label class="form-control">
              <span class="label-text text-xs text-base-content/70 mb-1">水平位置</span>
              <input v-model.number="cropOffsetX" type="range" min="-40" max="40" step="1" class="range range-sm" />
            </label>
            <label class="form-control">
              <span class="label-text text-xs text-base-content/70 mb-1">垂直位置</span>
              <input v-model.number="cropOffsetY" type="range" min="-40" max="40" step="1" class="range range-sm" />
            </label>
          </div>
          <div class="modal-action gap-2">
            <button class="btn rounded-2xl flex-1" :disabled="processingAvatar" @click="cancelAvatarCrop">取消</button>
            <button class="btn rounded-2xl bg-[#7CB342] text-white border-0 flex-1" :disabled="processingAvatar" @click="applyAvatarCrop">
              {{ processingAvatar ? '处理中...' : '确认裁剪' }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="cancelAvatarCrop">close</button>
        </form>
      </dialog>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { CATALOGUE_CATEGORIES, fetchAcnhData, getIconUrl, VILLAGER_SPECIES_ZH } from '../lib/acnh-api'

const authStore = useAuthStore()
const openEdit = ref(false)
const savingProfile = ref(false)
const uploadingAvatar = ref(false)
const processingAvatar = ref(false)
const avatarFile = ref(null)
const avatarPreview = ref('')
const avatarUploadError = ref('')
const avatarCompressedInfo = ref('')
const avatarInputKey = ref(0)
const cropModalOpen = ref(false)
const cropSourceUrl = ref('')
const cropScale = ref(1.2)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const edit = ref({
  display_name: '',
  island_name: '',
  birthday: '',
  friend_code: '',
  hemisphere: ''
})

const collectedVillagerIds = ref([])
const villagerDataMap = ref({}) // item_id -> { name, species, icon }

const categoryIconMap = ref({})

const hemisphereLabel = computed(() => {
  const h = authStore.profile?.hemisphere
  if (h === 'south') return '南半球'
  if (h === 'north') return '北半球'
  return '半球未设置'
})

const profileBirthdayLabel = computed(() => {
  const raw = authStore.profile?.birthday
  if (!raw) return '未设置'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '未设置'
  return `${d.getMonth() + 1}月${d.getDate()}日`
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
      acnhIcon: getAcnhIcon(c.id),
      current,
      total,
      percent,
      countText: c.custom ? '' : `${current}/${total}`
    }
  })
})

function syncEditFromProfile() {
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  if (cropSourceUrl.value?.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
  edit.value = {
    display_name: authStore.profile?.display_name || '',
    island_name: authStore.profile?.island_name || '',
    birthday: authStore.profile?.birthday || '',
    friend_code: authStore.profile?.friend_code || '',
    hemisphere: authStore.profile?.hemisphere || ''
  }
  avatarPreview.value = authStore.profile?.avatar_url || ''
  avatarFile.value = null
  avatarUploadError.value = ''
  avatarCompressedInfo.value = ''
  cropModalOpen.value = false
  cropSourceUrl.value = ''
  cropScale.value = 1.2
  cropOffsetX.value = 0
  cropOffsetY.value = 0
  avatarInputKey.value += 1
}

function onAvatarSelected(event) {
  avatarUploadError.value = ''
  avatarCompressedInfo.value = ''
  const file = event?.target?.files?.[0]
  if (!file) {
    avatarFile.value = null
    return
  }
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    avatarUploadError.value = '仅支持 JPG / PNG / WebP 格式'
    avatarFile.value = null
    return
  }
  const maxSize = 8 * 1024 * 1024
  if (file.size > maxSize) {
    avatarUploadError.value = '图片大小不能超过 8MB'
    avatarFile.value = null
    return
  }
  if (cropSourceUrl.value?.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
  cropSourceUrl.value = URL.createObjectURL(file)
  cropScale.value = 1.2
  cropOffsetX.value = 0
  cropOffsetY.value = 0
  cropModalOpen.value = true
  if (event?.target) event.target.value = ''
}

function cancelAvatarCrop() {
  cropModalOpen.value = false
  if (cropSourceUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(cropSourceUrl.value)
  }
  cropSourceUrl.value = ''
  avatarInputKey.value += 1
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('图片处理失败'))
      resolve(blob)
    }, type, quality)
  })
}

async function buildCompressedAvatarBlob(canvas) {
  const qualities = [0.9, 0.82, 0.74, 0.66, 0.58]
  const maxBytes = 420 * 1024
  let chosen = null
  for (const q of qualities) {
    const blob = await canvasToBlob(canvas, 'image/webp', q)
    chosen = blob
    if (blob.size <= maxBytes) break
  }
  if (!chosen) throw new Error('头像压缩失败，请重试')
  return chosen
}

async function applyAvatarCrop() {
  if (!cropSourceUrl.value) return
  processingAvatar.value = true
  avatarUploadError.value = ''
  try {
    const img = await loadImage(cropSourceUrl.value)
    const w = img.naturalWidth
    const h = img.naturalHeight
    const zoom = clamp(Number(cropScale.value) || 1, 1, 3)
    const base = Math.min(w, h)
    const cropSize = base / zoom
    const maxX = (w - cropSize) / 2
    const maxY = (h - cropSize) / 2
    const shiftX = (clamp(Number(cropOffsetX.value) || 0, -40, 40) / 40) * maxX
    const shiftY = (clamp(Number(cropOffsetY.value) || 0, -40, 40) / 40) * maxY
    const sx = clamp((w - cropSize) / 2 + shiftX, 0, w - cropSize)
    const sy = clamp((h - cropSize) / 2 + shiftY, 0, h - cropSize)

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('头像画布初始化失败')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 512, 512)

    const compressedBlob = await buildCompressedAvatarBlob(canvas)
    const processedFile = new File([compressedBlob], `avatar-${Date.now()}.webp`, { type: 'image/webp' })
    avatarFile.value = processedFile
    avatarCompressedInfo.value = `已裁剪并压缩：${Math.round(compressedBlob.size / 1024)}KB`

    if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
    avatarPreview.value = URL.createObjectURL(processedFile)
    cropModalOpen.value = false
    if (cropSourceUrl.value?.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
    cropSourceUrl.value = ''
    avatarInputKey.value += 1
  } catch (err) {
    console.error('头像裁剪失败:', err)
    avatarUploadError.value = err?.message || '头像处理失败，请重试'
  } finally {
    processingAvatar.value = false
  }
}

async function uploadAvatarIfNeeded() {
  if (!avatarFile.value || !authStore.user?.id) return authStore.profile?.avatar_url || null
  uploadingAvatar.value = true
  avatarUploadError.value = ''
  try {
    const file = avatarFile.value
    const path = `${authStore.user.id}/avatar-${Date.now()}.webp`
    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      if (String(uploadError.message || '').toLowerCase().includes('bucket')) {
        throw new Error('头像存储桶不存在，请先在 Supabase 创建名为 avatars 的 public bucket')
      }
      throw uploadError
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    if (!data?.publicUrl) throw new Error('头像地址获取失败')
    return data.publicUrl
  } finally {
    uploadingAvatar.value = false
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    const avatarUrl = await uploadAvatarIfNeeded()
    await authStore.updateProfile({
      display_name: edit.value.display_name || '岛民',
      island_name: edit.value.island_name || '未命名小岛',
      birthday: edit.value.birthday || null,
      friend_code: edit.value.friend_code || null,
      hemisphere: edit.value.hemisphere || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    })
    avatarFile.value = null
    avatarCompressedInfo.value = ''
    openEdit.value = false
  } catch (err) {
    console.error('保存护照失败:', err)
    avatarUploadError.value = err?.message || '保存失败，请稍后重试'
  } finally {
    savingProfile.value = false
  }
}

function getAcnhIcon(type) {
  return categoryIconMap.value[type] || ''
}

async function loadCatalogTotals() {
  const types = ['fish', 'bugs', 'sea', 'fossils', 'art', 'houseware', 'misc', 'wallmounted']
  const entries = await Promise.all(
    types.map(async (type) => {
      try {
        const data = await fetchAcnhData(type)
        const list = Array.isArray(data) ? data : Object.values(data || {})
        const total = list.length
        const first = list[0]
        const iconPath = first?.iconPath || first?.['file-name'] || first?.fileName || ''
        const icon = iconPath ? getIconUrl(type, iconPath) : ''
        return [type, { total, icon }]
      } catch (err) {
        console.error(`加载 ${type} 总数失败:`, err)
        return [type, { total: 0, icon: '' }]
      }
    })
  )
  const map = Object.fromEntries(entries)
  categoryIconMap.value = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.icon]))
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
  loadCollectedVillagers()
  loadCollectedCounts()
  loadCatalogTotals()
})

onUnmounted(() => {
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  if (cropSourceUrl.value?.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
})
</script>
