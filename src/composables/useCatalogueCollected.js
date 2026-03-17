import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const collectedSet = ref(new Set())

/**
 * 统一管理图鉴「已收集」状态的 composable。
 * 使用 `${category}:${item_id}` 作为键，保证不同分类下 ID 不冲突。
 */
export function useCatalogueCollected() {
  const authStore = useAuthStore()

  async function loadCollected() {
    if (!authStore.user) {
      collectedSet.value = new Set()
      return
    }

    try {
      const { data, error } = await supabase
        .from('catalogue_collected')
        .select('category, item_id')
        .eq('user_id', authStore.user.id)

      if (error) throw error

      const set = new Set()
      for (const row of data || []) {
        set.add(`${row.category}:${row.item_id}`)
      }
      collectedSet.value = set
    } catch (err) {
      console.error('加载图鉴收集状态失败:', err)
      collectedSet.value = new Set()
    }
  }

  function isCollected(category, itemId) {
    if (!category || itemId == null || itemId === '') return false
    const key = `${category}:${itemId}`
    return collectedSet.value.has(key)
  }

  async function toggleCollected(category, itemId) {
    if (!authStore.user || !category || itemId == null || itemId === '') return

    const key = `${category}:${itemId}`
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

        const next = new Set(collectedSet.value)
        next.delete(key)
        collectedSet.value = next
      } else {
        const { error } = await supabase.from('catalogue_collected').insert({
          user_id: authStore.user.id,
          category,
          item_id: itemId
        })

        if (error) throw error

        const next = new Set(collectedSet.value)
        next.add(key)
        collectedSet.value = next
      }
    } catch (err) {
      console.error('图鉴同步失败:', err)
      throw err
    }
  }

  return {
    collectedSet,
    loadCollected,
    isCollected,
    toggleCollected
  }
}

