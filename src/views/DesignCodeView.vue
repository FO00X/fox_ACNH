<template>
  <div class="space-y-4 motion-rise">
    <!-- 分类标签 -->
    <div class="flex gap-2 p-1 rounded-2xl bg-base-200/50">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all tap-lift',
          activeTab === tab.key
            ? 'bg-white text-[#558B2F] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <span class="flex items-center justify-center gap-2">
          <Icon :icon="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </span>
      </button>
    </div>

    <!-- 我的设计码列表 -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-[#558B2F] flex items-center gap-2">
          <Icon icon="mdi:wardrobe" class="w-4 h-4" />
          {{ activeTab === 'clothing' ? '我的服装码' : '我的地砖码' }}
        </h3>
        <button
          @click="showUploadModal = true"
          class="btn btn-sm bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl tap-lift"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
          上传
        </button>
      </div>
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg text-[#7CB342]"></span>
      </div>
      <div v-else-if="myDesignSets.length === 0" class="text-center py-8 text-gray-500 text-sm">
        还没有上传的设计码，点击右上角上传吧~
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="set in myDesignSets"
          :key="set.group_id"
          class="relative group rounded-xl overflow-hidden bg-base-100 border border-base-300 cursor-zoom-in tap-lift"
          role="button"
          tabindex="0"
          @click="openSetPreview(set)"
          @keydown.enter.prevent="openSetPreview(set)"
          @keydown.space.prevent="openSetPreview(set)"
        >
          <img
            :src="set.cover_url"
            class="w-full aspect-square object-cover"
            :alt="set.design_code || '设计码'"
          />
          <div class="absolute top-2 left-2 flex gap-2">
            <span
              v-if="set.rows.length > 1"
              class="px-2 py-1 rounded-full bg-black/60 text-white text-[10px] leading-none"
            >{{ set.rows.length }} 张</span>
            <span
              v-if="set.design_code"
              class="px-2 py-1 rounded-full bg-black/60 text-white text-[10px] leading-none"
            >{{ set.design_code }}</span>
          </div>
          <div class="absolute bottom-2 right-2 flex gap-2 transition-opacity">
            <button
              @click.stop="startEditSet(set)"
              class="w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center tap-lift"
              title="编辑"
            >
              <Icon icon="mdi:pencil" class="w-4 h-4" />
            </button>
            <button
              @click.stop="deleteDesignSet(set)"
              class="w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center tap-lift"
              title="删除"
            >
              <Icon icon="mdi:delete" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 好友的设计码 -->
    <div class="space-y-3 pt-4 border-t border-base-300">
      <h3 class="font-semibold text-[#558B2F] flex items-center gap-2">
        <Icon icon="mdi:account-group" class="w-4 h-4" />
        好友的设计码
      </h3>
      <div v-if="loadingFriends" class="flex justify-center py-6">
        <span class="loading loading-spinner loading-md text-[#7CB342]"></span>
      </div>
      <div v-else-if="friendDesignSets.length === 0" class="text-center py-6 text-gray-500 text-sm">
        好友们还没有上传设计码
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="set in friendDesignSets"
          :key="set.group_id"
          class="relative rounded-xl overflow-hidden bg-base-100 border border-base-300 cursor-zoom-in tap-lift"
          role="button"
          tabindex="0"
          @click="openSetPreview(set)"
          @keydown.enter.prevent="openSetPreview(set)"
          @keydown.space.prevent="openSetPreview(set)"
        >
          <img
            :src="set.cover_url"
            class="w-full aspect-square object-cover"
            :alt="set.design_code || '设计码'"
          />
          <div class="absolute top-2 left-2 flex gap-2">
            <span
              v-if="set.rows.length > 1"
              class="px-2 py-1 rounded-full bg-black/60 text-white text-[10px] leading-none"
            >{{ set.rows.length }} 张</span>
            <span
              v-if="set.design_code"
              class="px-2 py-1 rounded-full bg-black/60 text-white text-[10px] leading-none"
            >{{ set.design_code }}</span>
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p class="text-white text-xs">{{ set.owner_name || '岛民' }}</p>
            <p class="text-white/70 text-[10px]">{{ formatDate(set.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传弹窗 -->
    <dialog :open="showUploadModal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box rounded-2xl max-w-lg">
        <h3 class="font-bold text-lg text-[#558B2F] flex items-center gap-2 mb-4">
          <Icon icon="mdi:cloud-upload" class="w-5 h-5" />
          {{ editMode ? '编辑设计码' : '上传设计码' }}
        </h3>

        <!-- 设计码输入 -->
        <div class="grid grid-cols-4 gap-2 mb-4">
          <label class="form-control col-span-1">
            <span class="label-text text-xs text-gray-600">前缀</span>
            <select v-model="codePrefix" class="select select-bordered rounded-2xl h-12">
              <option value="MA">MA</option>
              <option value="MO">MO</option>
            </select>
          </label>
          <label class="form-control col-span-3">
            <span class="label-text text-xs text-gray-600">设计码</span>
            <input
              v-model="codeBody"
              class="input input-bordered rounded-2xl h-12"
              placeholder="XXXX-XXXX-XXXX（可不带横线）"
            />
          </label>
        </div>
        
        <!-- 上传区域 -->
        <div class="rounded-2xl border-2 border-dashed border-[#9CCC65]/50 bg-[#E8F5E9]/30 p-6 text-center mb-4">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          <button
            @click="fileInput?.click()"
            class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-2xl h-12 px-6 tap-lift"
            :disabled="uploading"
          >
            <Icon icon="mdi:image-plus" class="w-5 h-5 mr-2" />
            选择图片
          </button>
          <p class="text-xs text-gray-500 mt-2">支持一次选择多张图片，图片上应包含设计码</p>
        </div>

        <!-- 图片区域：已上传 + 待上传 合并展示 -->
        <div v-if="(editMode && editingSet) || pendingUploads.length > 0" class="space-y-2 mb-3">
          <p class="text-sm text-gray-600">
            图片
            <span v-if="editMode && editingSet">· 已上传 {{ editingSet.rows.length }}</span>
            <span v-if="pendingUploads.length > 0">· 待上传 {{ pendingUploads.length }}</span>
          </p>
          <div class="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
            <!-- 已上传图片 -->
            <div
              v-if="editMode && editingSet"
              v-for="r in editingSet.rows"
              :key="'ex-' + r.id"
              class="relative group rounded-lg overflow-hidden bg-base-100 border border-base-300"
              title="已上传"
            >
              <img :src="(r.image_url || '').trim()" class="w-full aspect-square object-cover" alt="已上传图片" />
              <button
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center transition-opacity tap-lift"
                title="删除"
                @click.stop="deleteExistingImage(r)"
                :disabled="uploading"
              >
                <Icon icon="mdi:delete" class="w-3 h-3" />
              </button>
            </div>

            <!-- 待上传图片 -->
            <div
              v-for="(item, index) in pendingUploads"
              :key="'pd-' + index"
              class="relative group rounded-lg overflow-hidden bg-base-100 border border-base-300"
              title="待上传"
            >
              <img :src="item.preview" class="w-full aspect-square object-cover" alt="待上传预览" />
              <button
                @click="removePending(index)"
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center transition-opacity tap-lift"
                title="删除"
                :disabled="uploading"
              >
                <Icon icon="mdi:delete" class="w-3 h-3" />
              </button>
            </div>
          </div>
          <p v-if="editMode && editingSet" class="text-xs text-gray-500">
            提示：你可以逐张删除；如果重新选择图片并保存，会用新图片替换整组。
          </p>
        </div>

        <div class="modal-action mt-4">
          <button 
            class="btn rounded-xl" 
            @click="closeUploadModal"
            :disabled="uploading"
          >
            取消
          </button>
          <button 
            class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl"
            @click="uploadAll"
            :disabled="uploading || (!editMode && pendingUploads.length === 0)"
          >
            <Icon v-if="uploading" icon="mdi:loading" class="w-4 h-4 mr-1 animate-spin" />
            {{ uploading ? (editMode ? '保存中...' : '上传中...') : (editMode ? '保存' : '确认上传') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeUploadModal">close</button>
      </form>
    </dialog>

    <!-- 大图预览弹窗 -->
    <dialog :open="showPreviewModal" class="modal">
      <div class="modal-box rounded-2xl max-w-4xl p-3 sm:p-4">
        <div class="flex items-center justify-between gap-3 px-1 pb-3">
          <div class="min-w-0">
            <p v-if="selectedSet?.design_code" class="text-base font-bold text-[#558B2F] truncate">
              {{ selectedSet.design_code }}
            </p>
            <p class="text-xs text-gray-500">
              {{ selectedSet?.owner_name || (selectedSet?.owner_id === authStore.user?.id ? '我' : '岛民') }}
              <span v-if="selectedSet?.design_code"> · </span>
              {{ formatDate(selectedSet?.created_at) }}
            </p>
          </div>
        </div>
        <div v-if="selectedSet" class="space-y-3">
          <div class="rounded-2xl overflow-hidden bg-base-200/30 border border-base-300">
            <img
              :src="selectedSet.cover_url"
              class="w-full max-h-[70vh] object-contain bg-black/5"
              :alt="selectedSet.design_code || '设计码大图'"
            />
          </div>
          <div v-if="selectedSet.rows.length > 1" class="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <button
              v-for="r in selectedSet.rows"
              :key="r.id"
              class="rounded-xl overflow-hidden border border-base-300 bg-base-100 tap-lift"
              @click="selectedSet = { ...selectedSet, cover_url: (r.image_url || '').trim() }"
              title="切换预览"
            >
              <img :src="(r.image_url || '').trim()" class="w-full aspect-square object-cover" alt="缩略图" />
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closePreview">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()

const tabs = [
  { key: 'clothing', label: '服装码', icon: 'mdi:tshirt-crew' },
  { key: 'tile', label: '地砖码', icon: 'mdi:floor-plan' }
]

const activeTab = ref('clothing')
const fileInput = ref(null)
const pendingUploads = ref([])
const uploading = ref(false)
const loading = ref(false)
const loadingFriends = ref(false)
const myDesignCodeRows = ref([])
const friendDesignCodeRows = ref([])
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const selectedSet = ref(null) // { group_id, rows, owner_name, ... }

const codePrefix = ref('MA')
const codeBody = ref('')
const editMode = ref(false)
const editingGroupId = ref(null)

function closePreview() {
  showPreviewModal.value = false
  selectedSet.value = null
}

function normalizeDesignCode(prefix, body) {
  const p = (prefix || '').trim().toUpperCase()
  const raw = (body || '').trim().toUpperCase()
  if (!raw) return null
  const cleaned = raw.replace(/[^A-Z0-9]/g, '')
  if (cleaned.length === 12) {
    return `${p}-${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
  }
  // 用户也可能直接输入 MA-xxxx-...，我们只强制前缀，剩下按原样（去掉首尾空格）
  if (raw.startsWith('MA-') || raw.startsWith('MO-')) return raw
  return `${p}-${raw}`
}

function groupRowsToSets(rows) {
  const map = new Map()
  for (const r of rows || []) {
    const gid = r.group_id || r.id
    if (!map.has(gid)) map.set(gid, [])
    map.get(gid).push(r)
  }
  const sets = Array.from(map.entries()).map(([group_id, groupRows]) => {
    const sorted = [...groupRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const cover = sorted[0]
    return {
      group_id,
      rows: sorted,
      cover_url: (cover?.image_url || '').trim(),
      created_at: cover?.created_at,
      design_code: cover?.design_code || null,
      owner_id: cover?.user_id,
      owner_name: cover?.profiles?.display_name || null
    }
  })
  // 最近的集合优先
  return sets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

const myDesignSets = computed(() => groupRowsToSets(myDesignCodeRows.value))
const friendDesignSets = computed(() => groupRowsToSets(friendDesignCodeRows.value))
const editingSet = computed(() => {
  if (!editingGroupId.value) return null
  return myDesignSets.value.find(s => s.group_id === editingGroupId.value) || null
})

function openSetPreview(set) {
  selectedSet.value = set
  showPreviewModal.value = true
}

// 加载我的设计码
async function loadMyDesignCodes() {
  if (!authStore.user?.id) return
  loading.value = true
  const { data, error } = await supabase
    .from('design_codes')
    .select('*')
    .eq('user_id', authStore.user.id)
    .eq('code_type', activeTab.value)
    .order('created_at', { ascending: false })
  
  if (!error) {
    myDesignCodeRows.value = data || []
  }
  loading.value = false
}

// 加载其他用户的设计码（默认所有用户互可见，排除自己）
async function loadFriendDesignCodes() {
  if (!authStore.user?.id) return
  loadingFriends.value = true

  const { data, error } = await supabase
    .from('design_codes')
    .select(`
      *,
      profiles:user_id (display_name)
    `)
    .neq('user_id', authStore.user.id)
    .eq('code_type', activeTab.value)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('获取好友设计码失败:', error)
    friendDesignCodeRows.value = []
  } else {
    friendDesignCodeRows.value = data || []
  }
  loadingFriends.value = false
}

// 关闭上传弹窗
function closeUploadModal() {
  if (uploading.value) return
  showUploadModal.value = false
  pendingUploads.value = []
  codePrefix.value = 'MA'
  codeBody.value = ''
  editMode.value = false
  editingGroupId.value = null
}

// 处理文件选择
function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      pendingUploads.value.push({
        file,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  })
  
  // 清空 input 以便可以重复选择相同文件
  event.target.value = ''
}

// 移除待上传项
function removePending(index) {
  pendingUploads.value.splice(index, 1)
}

// 上传所有图片
async function uploadAll() {
  uploading.value = true
  
  try {
    const designCode = normalizeDesignCode(codePrefix.value, codeBody.value)
    const groupId = editingGroupId.value || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

    // 编辑模式：如果选择了新图片，则先删掉旧图片和记录（同一组）
    if (editMode.value && editingGroupId.value) {
      if (pendingUploads.value.length > 0) {
        const existingRows = myDesignCodeRows.value.filter(r => (r.group_id || r.id) === editingGroupId.value)
        if (existingRows.length > 0) {
          const paths = existingRows.map(r => r.storage_path).filter(Boolean)
          if (paths.length > 0) {
            const { error: removeErr } = await supabase.storage.from('design-codes').remove(paths)
            if (removeErr) console.warn('删除旧图片失败:', removeErr)
          }
          const { error: delErr } = await supabase.from('design_codes').delete().eq('group_id', editingGroupId.value)
          if (delErr) console.warn('删除旧记录失败:', delErr)
        }
      } else if (designCode) {
        // 只改设计码：更新该组所有记录
        const { error: upErr } = await supabase.from('design_codes').update({ design_code: designCode }).eq('group_id', editingGroupId.value)
        if (upErr) throw upErr
        pendingUploads.value = []
        showUploadModal.value = false
        await loadMyDesignCodes()
        return
      } else {
        // 编辑模式但没有新图片也没有设计码，直接返回
        return
      }
    }
    
    // 非编辑模式下必须有待上传图片
    if (!editMode.value && pendingUploads.value.length === 0) return

    for (const item of pendingUploads.value) {
      const file = item.file
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${authStore.user.id}/${groupId}/${fileName}`
      
      // 上传到 Storage
      const { error: uploadError } = await supabase.storage
        .from('design-codes')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('design-codes')
        .getPublicUrl(filePath)
      
      // 插入数据库记录
      const { error: dbError } = await supabase
        .from('design_codes')
        .insert({
          user_id: authStore.user.id,
          code_type: activeTab.value,
          image_url: publicUrl,
          storage_path: filePath,
          group_id: groupId,
          design_code: designCode
        })
      
      if (dbError) throw dbError
    }
    
    // 清空待上传列表并关闭弹窗
    pendingUploads.value = []
    showUploadModal.value = false
    // 刷新列表
    await loadMyDesignCodes()
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

// 删除设计码
async function deleteDesignSet(set) {
  if (!confirm('确定要删除这个设计码集合吗？')) return
  
  try {
    const paths = (set?.rows || []).map(r => r.storage_path).filter(Boolean)
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('design-codes').remove(paths)
      if (storageError) console.warn('删除存储文件失败:', storageError)
    }

    const { error: dbError } = await supabase.from('design_codes').delete().eq('group_id', set.group_id)
    
    if (dbError) throw dbError
    
    // 刷新列表
    await loadMyDesignCodes()
    if (selectedSet.value?.group_id === set.group_id) closePreview()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

function startEditSet(set) {
  editMode.value = true
  editingGroupId.value = set.group_id
  const dc = (set.design_code || '').toUpperCase()
  if (dc.startsWith('MA-')) codePrefix.value = 'MA'
  else if (dc.startsWith('MO-')) codePrefix.value = 'MO'
  codeBody.value = dc ? dc.replace(/^MA-/, '').replace(/^MO-/, '') : ''
  pendingUploads.value = []
  showUploadModal.value = true
  // 从预览弹窗进入编辑时，先关闭预览，避免状态叠加
  if (showPreviewModal.value) closePreview()
}

async function deleteExistingImage(row) {
  if (!row?.id) return
  if (!confirm('确定要删除这张图片吗？')) return

  try {
    if (row.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('design-codes')
        .remove([row.storage_path])
      if (storageError) console.warn('删除存储图片失败:', storageError)
    }

    const { error: dbError } = await supabase
      .from('design_codes')
      .delete()
      .eq('id', row.id)

    if (dbError) throw dbError

    await loadMyDesignCodes()
  } catch (error) {
    console.error('删除图片失败:', error)
    alert('删除失败，请重试')
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 监听标签切换
watch(activeTab, () => {
  loadMyDesignCodes()
  loadFriendDesignCodes()
})

onMounted(() => {
  loadMyDesignCodes()
  loadFriendDesignCodes()
})
</script>
