<template>
  <div class="space-y-4">
    <div class="acnh-card bg-white/95 p-4">
      <h2 class="text-lg font-bold text-[#558B2F] mb-2 flex items-center gap-2">
        <Icon icon="mdi:pin" class="w-5 h-5" />
        好友看板
      </h2>
      <p class="text-gray-600 text-sm mb-4">查看好友缺少的，送完后可划掉～</p>

      <select
        v-model="selectedFriend"
        class="select select-bordered w-full rounded-xl h-11 text-base"
      >
        <option :value="null">选择好友</option>
        <option v-for="f in friends" :key="f.id" :value="f">{{ f.display_name }} - {{ f.island_name }}</option>
      </select>

      <div v-if="selectedFriend" class="space-y-4 mt-4">
        <!-- 好友的愿望清单 -->
        <div>
          <h3 class="font-semibold text-[#558B2F] mb-2 flex items-center gap-1.5">
            <Icon icon="mdi:package-variant" class="w-4 h-4" />
            {{ selectedFriend.display_name }} 缺少的
          </h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="item in friendWishlist"
              :key="item.id"
              :class="[
                'badge gap-1.5 py-2.5 px-3 rounded-xl text-sm cursor-pointer active:scale-95 transition-transform',
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
          <div class="flex gap-2 mb-3">
            <input
              v-model="newPostContent"
              type="text"
              placeholder="给 TA 留个言..."
              class="input input-bordered flex-1 rounded-xl h-11"
              @keyup.enter="addPost"
            />
            <button class="btn bg-[#7CB342] hover:bg-[#558B2F] text-white border-0 rounded-xl h-11 min-h-0 px-4" @click="addPost">
              发送
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="post in boardPosts"
              :key="post.id"
              :class="[
                'p-3 rounded-xl flex items-start justify-between gap-2',
                post.is_resolved ? 'bg-gray-100 opacity-75' : 'bg-[#FFF8E1]/50'
              ]"
            >
              <div class="flex-1 min-w-0">
                <p :class="{ 'line-through text-gray-500': post.is_resolved }" class="text-sm break-words">{{ post.content }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ post.author?.display_name }} · {{ formatDate(post.created_at) }}</p>
              </div>
              <button
                v-if="!post.is_resolved && (post.target_id === authStore.user?.id || post.author_id === authStore.user?.id)"
                @click="resolvePost(post)"
                class="btn btn-sm btn-ghost text-[#7CB342] min-h-0 h-8 flex-shrink-0"
              >
                划掉 ✓
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500 text-sm">
        选择好友查看
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
const friends = ref([])
const selectedFriend = ref(null)
const friendWishlist = ref([])
const boardPosts = ref([])
const newPostContent = ref('')

async function loadFriends() {
  const { data: sent } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', authStore.user.id)
    .eq('status', 'accepted')
  const { data: received } = await supabase
    .from('friendships')
    .select('user_id')
    .eq('friend_id', authStore.user.id)
    .eq('status', 'accepted')

  const ids = [...new Set([
    ...(sent || []).map(f => f.friend_id),
    ...(received || []).map(f => f.user_id)
  ])]
  if (ids.length === 0) {
    friends.value = []
    return
  }
  const { data: profiles } = await supabase.from('profiles').select('id, display_name, island_name').in('id', ids)
  friends.value = profiles || []
}

async function loadFriendWishlist() {
  if (!selectedFriend.value) return
  const { data } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', selectedFriend.value.id)
    .order('created_at', { ascending: false })
  friendWishlist.value = data || []
}

async function loadBoardPosts() {
  if (!selectedFriend.value) return
  const me = authStore.user.id
  const friend = selectedFriend.value.id
  const { data } = await supabase
    .from('board_posts')
    .select('*')
    .or(`and(author_id.eq.${me},target_id.eq.${friend}),and(author_id.eq.${friend},target_id.eq.${me})`)
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
  if (!newPostContent.value.trim() || !selectedFriend.value) return
  await supabase.from('board_posts').insert({
    author_id: authStore.user.id,
    target_id: selectedFriend.value.id,
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

watch(selectedFriend, () => {
  loadFriendWishlist()
  loadBoardPosts()
})

onMounted(async () => {
  await loadFriends()
  const friendId = route.query.friend
  if (friendId && friends.value.length > 0) {
    const f = friends.value.find(x => x.id === friendId)
    if (f) selectedFriend.value = f
  }
})
</script>
