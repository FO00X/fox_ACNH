/**
 * 图鉴/日历数据缓存 Store
 * data.json 仅在登录时由 auth 调用 loadOnce() 拉取一次，其余地方只读缓存
 */
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

const CATALOGUE_DATA_URL = 'https://catalogue.ac/data/data.json?v=3.405'

export const useCatalogueStore = defineStore('catalogue', () => {
  const rawData = shallowRef(null)
  const loading = ref(false)
  const error = ref(null)
  let inflightPromise = null

  /**
   * 仅登录时由 auth 调用，确保 data.json 只请求一次；有缓存或进行中则直接返回
   */
  async function loadOnce() {
    if (rawData.value) return rawData.value
    if (inflightPromise) return inflightPromise
    loading.value = true
    error.value = null
    inflightPromise = (async () => {
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
        inflightPromise = null
      }
    })()
    return inflightPromise
  }

  /**
   * 供页面/ acnh-api 使用：只读缓存，不发起请求。有则返回数据，无则返回 null
   */
  function prefetch() {
    if (rawData.value) return Promise.resolve(rawData.value)
    if (inflightPromise) return inflightPromise
    return Promise.resolve(null)
  }

  function getRawData() {
    return rawData.value
  }

  function clear() {
    rawData.value = null
    error.value = null
    inflightPromise = null
  }

  return {
    rawData,
    loading,
    error,
    loadOnce,
    prefetch,
    getRawData,
    clear
  }
})
