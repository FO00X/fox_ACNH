<template>
  <div class="space-y-4 motion-rise">
    <div class="acnh-card bg-base-100 p-3.5 sm:p-5">
      <h2 class="page-title mb-2 flex items-center gap-2">
        <Icon icon="mdi:pin" class="w-5 h-5 shrink-0" />
        看板
      </h2>
      <p class="page-desc">查看大家缺少的，送完后可划掉～</p>

      <select
        v-model="selectedUser"
        class="select select-bordered w-full rounded-2xl h-12 text-base"
      >
        <option :value="null">选择岛民</option>
        <option v-for="u in allUsers" :key="u.id" :value="u">{{ u.display_name }} - {{ u.island_name }}</option>
      </select>

      <div v-if="selectedUser" class="space-y-4 mt-4 motion-stagger">
        <div>
          <h3 class="font-semibold text-[#558B2F] mb-2 flex items-center gap-1.5">
            <Icon icon="mdi:package-variant" class="w-4 h-4" />
            {{ selectedUser.display_name }} 缺少的
          </h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="item in friendWishlist"
              :key="item.id"
              :class="[
                'badge gap-1.5 py-2.5 px-3 rounded-xl text-sm cursor-pointer active:scale-95 transition-transform tap-lift motion-pop',
                item.is_fulfilled ? 'badge-success opacity-75 line-through' : 'badge-warning'
              ]"
              @click="toggleFulfill(item)"
            >
              <span>{{ item.item_name }} {{ item.quantity > 1 ? `×${item.quantity}` : '' }}</span>
              <span class="text-xs">{{ item.item_type === 'material' ? '材' : '具' }}</span>
              <span v-if="item.is_fulfilled" class="text-xs">✓</span>
            </div>
          </div>
        </div>

        <!-- 留言区 -->
        <div>
          <h3 class="font-semibold text-[#558B2F] mb-2 flex items-center gap-1.5">
            <Icon icon="mdi:comment-text" class="w-4 h-4" />
            留言
          </h3>
          <div class="flex flex-col min-[420px]:flex-row gap-2 mb-3">
            <input
              v-model="newPostContent"
              type="text"
              placeholder="给 TA 留个言..."
              class="input input-bordered flex-1 min-w-0 rounded-2xl h-12 text-base"
              @keyup.enter="addPost"
            />
            <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-2xl h-12 min-h-(--touch-min) px-4 shrink-0 acnh-btn tap-lift" @click="addPost">
              发送
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="post in boardPosts"
              :key="post.id"
              :class="[
                'p-3 rounded-xl flex items-start justify-between gap-2 motion-pop',
                post.is_resolved ? 'bg-gray-100 opacity-75' : 'bg-[#FFF8E1]/50'
              ]"
            >
              <div class="flex-1 min-w-0">
                <p :class="{ 'line-through text-gray-500': post.is_resolved }" class="text-sm wrap-break-word">{{ post.content }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ post.author?.display_name }} · {{ formatDate(post.created_at) }}</p>
              </div>
              <button
                v-if="!post.is_resolved && (post.target_id === authStore.user?.id || post.author_id === authStore.user?.id)"
                @click="resolvePost(post)"
                class="btn btn-sm btn-ghost text-[#7CB342] min-h-0 h-8 shrink-0"
              >
                划掉 ✓
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500 text-sm">
        选择岛民查看
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const route = useRoute()
const authStore = useAuthStore()
const allUsers = ref([])
const selectedUser = ref(null)
const friendWishlist = ref([])
const boardPosts = ref([])
const newPostContent = ref('')

async function loadAllUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, island_name')
    .neq('id', authStore.user.id)
    .order('display_name')
  allUsers.value = data || []
}

async function loadFriendWishlist() {
  if (!selectedUser.value) return
  const { data } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', selectedUser.value.id)
    .order('created_at', { ascending: false })
  friendWishlist.value = data || []
}

async function loadBoardPosts() {
  if (!selectedUser.value) return
  const me = authStore.user.id
  const other = selectedUser.value.id
  const { data } = await supabase
    .from('board_posts')
    .select('*')
    .or(`and(author_id.eq.${me},target_id.eq.${other}),and(author_id.eq.${other},target_id.eq.${me})`)
    .order('created_at', { ascending: false })
  const posts = data || []
  const authorIds = [...new Set(posts.map(p => p.author_id))]
  let authors = {}
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', authorIds)
    authors = Object.fromEntries((profiles || []).map(p => [p.id, p]))
  }
  boardPosts.value = posts.map(p => ({ ...p, author: authors[p.author_id] }))
}

async function toggleFulfill(item) {
  if (item.is_fulfilled) return
  await supabase
    .from('wishlist_items')
    .update({
      is_fulfilled: true,
      fulfilled_by: authStore.user.id,
      fulfilled_at: new Date().toISOString()
    })
    .eq('id', item.id)
  loadFriendWishlist()
}

async function addPost() {
  if (!newPostContent.value.trim() || !selectedUser.value) return
  await supabase.from('board_posts').insert({
    author_id: authStore.user.id,
    target_id: selectedUser.value.id,
    content: newPostContent.value.trim(),
    post_type: 'message'
  })
  newPostContent.value = ''
  loadBoardPosts()
}

async function resolvePost(post) {
  await supabase
    .from('board_posts')
    .update({
      is_resolved: true,
      resolved_by: authStore.user.id,
      resolved_at: new Date().toISOString()
    })
    .eq('id', post.id)
  loadBoardPosts()
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN')
}

watch(selectedUser, () => {
  loadFriendWishlist()
  loadBoardPosts()
})

onMounted(async () => {
  await loadAllUsers()
  const userId = route.query.user || route.query.friend
  if (userId && allUsers.value.length > 0) {
    const u = allUsers.value.find(x => x.id === userId)
    if (u) selectedUser.value = u
  }
})
</script>
