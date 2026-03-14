/**
 * 图鉴/日历数据缓存 Store
 * 登录后预加载，供图鉴、日历等页面使用，提升后续访问流畅度
 */
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

const CATALOGUE_DATA_URL = 'https://catalogue.ac/data/data.json?v=3.405'

export const useCatalogueStore = defineStore('catalogue', () => {
  const rawData = shallowRef(null)
  const loading = ref(false)
  const error = ref(null)

  async function prefetch() {
    if (rawData.value) return rawData.value
    loading.value = true
    error.value = null
    try {
      const res = await fetch(CATALOGUE_DATA_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      rawData.value = data
      return data
    } catch (err) {
      error.value = err?.message || '数据加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function getRawData() {
    return rawData.value
  }

  function clear() {
    rawData.value = null
    error.value = null
  }

  return {
    rawData,
    loading,
    error,
    prefetch,
    getRawData,
    clear
  }
})
