<template>
  <div class="space-y-4">
    <div class="acnh-card bg-white/95 p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3 gap-2">
        <h1 class="page-title flex items-center gap-2 shrink-0">
          <Icon icon="mdi:palm-tree" class="w-6 h-6 shrink-0" />
          广场便签板
        </h1>
        <RouterLink
          to="/dashboard"
          class="btn rounded-2xl bg-base-100 border-base-300 hover:bg-base-200/60 text-sm min-h-(--touch-min) shrink-0"
        >
          我的小岛 →
        </RouterLink>
      </div>
      <p class="page-desc mb-4">
        把你缺的东西写在便签上，让好友帮忙；看到能帮的，也可以撕掉别人的便签。
      </p>

      <!-- 统计 -->
      <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div class="rounded-2xl bg-[#E8F5E9] border border-[#C5E1A5] px-4 py-3 flex items-center justify-between min-h-[52px]">
          <span class="text-[#558B2F] flex items-center gap-1.5">
            <Icon icon="mdi:note-text" class="w-5 h-5 shrink-0" />
            我想要
          </span>
          <span class="font-bold text-lg">{{ myOpenCount }}</span>
        </div>
        <div class="rounded-2xl bg-[#E3F2FD] border border-[#90CAF9] px-4 py-3 flex items-center justify-between min-h-[52px]">
          <span class="text-[#1565C0] flex items-center gap-1.5">
            <Icon icon="mdi:hand-heart" class="w-5 h-5 shrink-0" />
            我已帮忙完成
          </span>
          <span class="font-bold text-lg">{{ myHelpCount }}</span>
        </div>
      </div>

      <!-- 新建便签 -->
      <div class="mb-4 space-y-3">
        <p class="text-sm text-base-content/60">我也贴一张便签</p>
        <div class="flex flex-col gap-3">
          <input
            v-model="newNoteName"
            type="text"
            placeholder="想要的材料/家具/物品..."
            class="input input-bordered rounded-2xl h-12 text-base"
            @keyup.enter="addNote"
          />
          <div class="flex flex-wrap gap-2 items-center">
            <select v-model="newNoteType" class="select select-bordered rounded-2xl h-11 text-base flex-1 min-w-0 max-w-[140px]">
              <option value="material">材料</option>
              <option value="furniture">家具</option>
              <option value="other">其他</option>
            </select>
            <input
              v-model.number="newNoteQty"
              type="number"
              min="1"
              class="input input-bordered rounded-2xl h-11 w-20 text-center text-base shrink-0"
              placeholder="数量"
            />
            <button
              class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-2xl px-5 min-h-(--touch-min) acnh-btn shrink-0"
              @click="addNote"
            >
              贴上去
            </button>
          </div>
        </div>
      </div>

      <!-- 便签墙（按类型分列，移动端单列） -->
      <div class="relative min-h-[120px]">
        <div
          class="absolute inset-2 rounded-3xl border border-dashed border-base-300 bg-[url('/leaf.svg')] bg-size-[160px_160px] bg-repeat opacity-20 pointer-events-none"
        ></div>
        <div class="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- 材料 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-[#558B2F]">
              <Icon icon="mdi:package-variant" class="w-4 h-4" />
              <span>材料</span>
              <span class="text-base-content/40">({{ groupedNotes.material.length }})</span>
            </div>
            <div class="space-y-2">
              <NoteCard
                v-for="note in groupedNotes.material"
                :key="note.id"
                :note="note"
                color="material"
                @click="handleNoteClick(note)"
              />
            </div>
          </div>

          <!-- 家具 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-[#F9A825]">
              <Icon icon="mdi:sofa" class="w-4 h-4" />
              <span>家具</span>
              <span class="text-base-content/40">({{ groupedNotes.furniture.length }})</span>
            </div>
            <div class="space-y-2">
              <NoteCard
                v-for="note in groupedNotes.furniture"
                :key="note.id"
                :note="note"
                color="furniture"
                @click="handleNoteClick(note)"
              />
            </div>
          </div>

          <!-- 其他 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs text-[#1565C0]">
              <Icon icon="mdi:star-four-points" class="w-4 h-4" />
              <span>其他</span>
              <span class="text-base-content/40">({{ groupedNotes.other.length }})</span>
            </div>
            <div class="space-y-2">
              <NoteCard
                v-for="note in groupedNotes.other"
                :key="note.id"
                :note="note"
                color="other"
                @click="handleNoteClick(note)"
              />
            </div>
          </div>

          <div v-if="notes.length === 0" class="col-span-1 sm:col-span-3 text-center text-sm text-base-content/60 py-6">
            还没有便签，先贴一张自己的需求吧～
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const authStore = useAuthStore()

const notes = ref([])
const newNoteName = ref('')
const newNoteType = ref('material')
const newNoteQty = ref(1)

const myOpenCount = computed(() => notes.value.filter(n => n.isMine && !n.is_fulfilled).length)
const myHelpCount = computed(() => notes.value.filter(n => n.fulfilled_by === authStore.user?.id).length)

const groupedNotes = computed(() => {
  const groups = {
    material: [],
    furniture: [],
    other: []
  }
  for (const n of notes.value) {
    const t = n.item_type === 'material' ? 'material' : n.item_type === 'furniture' ? 'furniture' : 'other'
    groups[t].push(n)
  }
  return groups
})

async function loadNotes() {
  const { data } = await supabase
    .from('wishlist_items')
    .select('*, user_id')
    .order('created_at', { ascending: false })

  const rows = data || []
  const ownerIds = [...new Set(rows.map(r => r.user_id))]
  let owners = {}
  if (ownerIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, island_name')
      .in('id', ownerIds)
    owners = Object.fromEntries((profiles || []).map(p => [p.id, p]))
  }

  notes.value = rows.map(r => {
    const owner = owners[r.user_id] || {}
    return {
      ...r,
      isMine: r.user_id === authStore.user?.id,
      ownerName: owner.display_name || '岛民',
      ownerIsland: owner.island_name || '小岛'
    }
  })
}

async function addNote() {
  if (!newNoteName.value.trim()) return
  await supabase.from('wishlist_items').insert({
    user_id: authStore.user.id,
    item_name: newNoteName.value.trim(),
    item_type: newNoteType.value,
    quantity: newNoteQty.value || 1
  })
  newNoteName.value = ''
  newNoteQty.value = 1
  await loadNotes()
}

async function handleNoteClick(note) {
  if (note.is_fulfilled) return
  if (note.isMine) {
    // 自己的：标记已完成/撕掉
    await supabase
      .from('wishlist_items')
      .update({
        is_fulfilled: true,
        fulfilled_by: authStore.user.id,
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', note.id)
  } else {
    // 别人的：帮忙完成
    await supabase
      .from('wishlist_items')
      .update({
        is_fulfilled: true,
        fulfilled_by: authStore.user.id,
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', note.id)
  }
  await loadNotes()
}

function formatShortDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    loadNotes()
  }
})
</script>

<script>
// 内联便签卡组件，用于分列显示不同类型
export default {
  name: 'HomeView',
  components: {
    NoteCard: {
      props: {
        note: { type: Object, required: true },
        color: { type: String, required: true }
      },
      emits: ['click'],
      computed: {
        baseClasses() {
          const n = this.note
          const common =
            'relative rounded-3xl p-3 shadow-md cursor-pointer transition-transform active:scale-95 border'
          const byType =
            this.color === 'material'
              ? n.isMine
                ? 'bg-[#FFFDE7] border-[#FFE082]'
                : 'bg-[#E8F5E9] border-[#C5E1A5]'
              : this.color === 'furniture'
              ? n.isMine
                ? 'bg-[#FFF3E0] border-[#FFCC80]'
                : 'bg-[#FFF8E1] border-[#FFE082]'
              : n.isMine
              ? 'bg-[#E3F2FD] border-[#90CAF9]'
              : 'bg-[#E1F5FE] border-[#81D4FA]'
          const done = n.is_fulfilled ? 'opacity-60 line-through' : ''
          return [common, byType, done].join(' ')
        }
      },
      methods: {
        formatShortDate(d) {
          if (!d) return ''
          const date = new Date(d)
          return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        }
      },
      template: `
        <div :class="baseClasses" @click="$emit('click')">
          <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-b-full bg-red-200"></div>
          <p class="font-semibold text-sm mb-1 break-words">
            {{ note.item_name }}<span v-if="note.quantity > 1"> ×{{ note.quantity }}</span>
          </p>
          <p class="text-[11px] text-base-content/60 mb-1 truncate">
            {{ note.ownerName }} · {{ note.ownerIsland }}
          </p>
          <p class="text-[10px] text-base-content/50">
            {{ note.item_type === 'material' ? '材料' : note.item_type === 'furniture' ? '家具' : '其他' }}
          </p>
          <div class="mt-2 flex items-center justify-between text-[11px]">
            <span v-if="note.is_fulfilled" class="text-emerald-700 flex items-center gap-1">
              <Icon icon="mdi:check-circle" class="w-3.5 h-3.5" />
              已完成
            </span>
            <span v-else-if="note.isMine" class="text-amber-800">点一下标记已完成</span>
            <span v-else class="text-[#1565C0] flex items-center gap-1">
              帮 Ta 完成
              <Icon icon="mdi:hand-heart" class="w-3.5 h-3.5" />
            </span>
            <span class="text-[10px] text-base-content/40">
              {{ formatShortDate(note.created_at) }}
            </span>
          </div>
        </div>
      `
    }
  }
}
</script>
