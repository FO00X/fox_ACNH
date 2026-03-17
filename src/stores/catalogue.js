/**
 * 图鉴/日历数据缓存 Store
 * data.json 使用本地 public/data.json 加载一次，其余地方只读缓存
 */
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

// 使用本地 public/*.json（避免依赖外部接口）
// meta.json: 顶层元信息（date 等），不含 data/maps/locale/events
// maps.json: 编码/索引映射
// locale.json: 本地化映射
// events.json: 日历事件
// data/index.json: data 分类列表
// data/<key>.json: 每个分类一个 JSON 文件
const BASE_URL = import.meta.env.BASE_URL || '/'
const CATALOGUE_META_URL = `${BASE_URL}meta.json`
const CATALOGUE_MAPS_URL = `${BASE_URL}maps.json`
const CATALOGUE_LOCALE_URL = `${BASE_URL}locale.json`
const CATALOGUE_EVENTS_URL = `${BASE_URL}events.json`
const CATALOGUE_DATA_INDEX_URL = `${BASE_URL}data/index.json`

export const useCatalogueStore = defineStore('catalogue', () => {
  const rawData = shallowRef(null)
  const loading = ref(false)
  const error = ref(null)
  let inflightPromise = null

  /**
   * 加载一次 data.json；有缓存或进行中则直接返回
   */
  async function loadOnce() {
    if (rawData.value) return rawData.value
    if (inflightPromise) return inflightPromise
    loading.value = true
    error.value = null
    inflightPromise = (async () => {
      try {
        const [metaRes, mapsRes, localeRes, eventsRes, indexRes] = await Promise.all([
          fetch(CATALOGUE_META_URL),
          fetch(CATALOGUE_MAPS_URL),
          fetch(CATALOGUE_LOCALE_URL),
          fetch(CATALOGUE_EVENTS_URL),
          fetch(CATALOGUE_DATA_INDEX_URL)
        ])
        if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status}`)
        if (!mapsRes.ok) throw new Error(`HTTP ${mapsRes.status}`)
        if (!localeRes.ok) throw new Error(`HTTP ${localeRes.status}`)
        if (!eventsRes.ok) throw new Error(`HTTP ${eventsRes.status}`)
        if (!indexRes.ok) throw new Error(`HTTP ${indexRes.status}`)

        const [meta, maps, locale, events, keys] = await Promise.all([
          metaRes.json(),
          mapsRes.json(),
          localeRes.json(),
          eventsRes.json(),
          indexRes.json()
        ])

        const dataKeys = Array.isArray(keys) ? keys : []
        const dataEntries = await Promise.all(
          dataKeys.map(async (k) => {
            const res = await fetch(`${BASE_URL}data/${k}.json`)
            if (!res.ok) throw new Error(`HTTP ${res.status} (${k}.json)`)
            const v = await res.json()
            return [k, v]
          })
        )
        const data = Object.fromEntries(dataEntries)

        const merged = { ...meta, maps, locale, events, data }
        rawData.value = merged
        return merged
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
    // 若尚未加载，则触发一次本地加载，避免页面出现 null
    return loadOnce()
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
