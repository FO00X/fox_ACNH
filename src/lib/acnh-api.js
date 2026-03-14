/**
 * ACNH 数据与图片 API
 *
 * 数据来源: catalogue.ac (https://catalogue.ac/data/data.json?v=3.405)
 * 图片 CDN: nh-cdn.catalogue.ac (https://nh-cdn.catalogue.ac/FtrIcon/xxx.png)
 */

// 家具类图标：nh-cdn.catalogue.ac
const FTR_ICON_CDN = 'https://nh-cdn.catalogue.ac'

/** 图鉴/日历等图片加载失败时使用的占位图（与参考 main.js 的 onImgError 思路一致，此处用内联 SVG 避免额外请求） */
export const IMG_FALLBACK_SVG =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'

/** 用于 <img @error="onImgError">，将失败图片替换为占位图 */
export function onImgError(e) {
  if (e?.target) e.target.src = IMG_FALLBACK_SVG
}

// 生物/小动物等：ACNH CDN
const ACNH_CDN_BASE = 'https://acnhcdn.com/latest'

// catalogue.ac 分类 -> 我们内部分类
const CATEGORY_MAP = {
  houseware: 'housewares',
  misc: 'misc',
  wallmounted: 'wall_mounted',
  fish: 'fish',
  bugs: 'bugs',
  sea: 'sea',
  fossils: 'fossils',
  art: 'art',
  villagers: 'villagers'
}

// 将 catalogue loc 转为 name 格式（支持 zh-cn 与 zh）
function locToName(loc) {
  if (!loc || typeof loc !== 'object') return {}
  return {
    'name-CNzh': loc['zh-cn'] || loc.zh,
    'name-TWzh': loc['zh-tw'],
    'name-USen': loc.en || loc['en-us'],
    'name-JPja': loc.ja,
    'name-KRko': loc.ko,
    ...Object.fromEntries(
      Object.entries(loc).map(([k, v]) => [`name-${k.replace('-', '').toUpperCase()}`, v])
    )
  }
}

// 从路径提取文件名（用于 icon）
function getFileNameFromPath(path) {
  if (!path) return ''
  const parts = path.split('/')
  return parts[parts.length - 1] || ''
}

export function getItemIconUrl(fileName) {
  if (fileName?.includes('/')) {
    return `${FTR_ICON_CDN}/${fileName}.png`
  }
  return `${FTR_ICON_CDN}/FtrIcon/${fileName}.png`
}

export function getIconUrl(type, fileName) {
  if (!fileName) return ''
  // 若 fileName 含路径（如 FtrIcon/xxx 或 NpcIcon/xxx），使用 catalogue CDN
  if (fileName.includes('/')) {
    const path = fileName.replace(/\.png$/, '')
    return `${FTR_ICON_CDN}/${path}.png`
  }
  if (['houseware', 'misc', 'wallmounted'].includes(type)) {
    return `${FTR_ICON_CDN}/FtrIcon/${fileName}.png`
  }
  // 村民头像统一使用 catalogue NpcIcon，不用 acnhcdn
  if (type === 'villagers') {
    const id = String(fileName).replace(/\.png$/, '')
    return `${FTR_ICON_CDN}/NpcIcon/${id}.png`
  }
  const cdnPath = { fish: 'Fish', bugs: 'Bugs', sea: 'Sea', fossils: 'Fossils', art: 'Art' }[type] || type
  return `${ACNH_CDN_BASE}/${cdnPath}/${fileName}.png`
}

export function getImageUrl(type, fileName) {
  return getIconUrl(type, fileName)
}

/** 鱼类图鉴小图（BookFishIcon），用于详情页 */
export function getFishBookIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Fish') ? base : `Fish${base}`
  return `${FTR_ICON_CDN}/BookFishIcon/${key}.png`
}

/** 鱼类鱼缸图（FtrIcon），用于详情页 */
export function getFishTankIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Fish') ? base : `Fish${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}.png`
}

/** 鱼类模型图（FtrIcon FtrXxxToy），用于详情页 */
export function getFishModelIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Fish') ? base : `Fish${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}Toy.png`
}

/** 昆虫图鉴小图（BookInsectIcon），用于详情页 */
export function getBugsBookIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Insect') ? base : `Insect${base}`
  return `${FTR_ICON_CDN}/BookInsectIcon/${key}.png`
}

/** 昆虫笼/展示图（FtrIcon），用于详情页 */
export function getBugsCageIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Insect') ? base : `Insect${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}.png`
}

/** 昆虫模型图（FtrIcon FtrXxxToy），用于详情页 */
export function getBugsModelIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Insect') ? base : `Insect${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}Toy.png`
}

/** 海洋生物图鉴小图（BookDiveFishIcon），用于详情页 */
export function getSeaBookIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('DiveFish') ? base : `DiveFish${base}`
  return `${FTR_ICON_CDN}/BookDiveFishIcon/${key}.png`
}

/** 海洋生物展示图（FtrIcon），用于详情页 */
export function getSeaCageIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('DiveFish') ? base : `DiveFish${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}.png`
}

/** 海洋生物模型图（若有），用于详情页 */
export function getSeaModelIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('DiveFish') ? base : `DiveFish${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}Toy.png`
}

/** 化石图标（FtrIcon），用于详情页，仅单图 */
export function getFossilIconUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Fossil') ? base : `Fossil${base}`
  return `${FTR_ICON_CDN}/FtrIcon/Ftr${key}.png`
}

/** 艺术品图标（FtrIcon），用于详情页侧栏小图 */
/** 艺术品图标（支持真品/赝品切换），isFake 为 true 时返回 xxxFake.png */
export function getArtIconUrl(fileName, isFake = false) {
  if (!fileName) return ''
  const base = String(fileName).replace(/\.png$/i, '').replace(/Fake$/i, '')
  return `${FTR_ICON_CDN}/FtrIcon/${base}${isFake ? 'Fake' : ''}.png`
}

/** 艺术品大图（art 目录），用于详情页「艺术品」Tab */
export function getArtImageUrl(fileName) {
  if (!fileName) return ''
  const base = String(fileName).replace(/^Ftr/i, '')
  const key = base.startsWith('Art') ? base : `Art${base}`
  return `${FTR_ICON_CDN}/art/Ftr${key}.png`
}

export function resolveIconUri(item, type) {
  const path = item?.iconPath || item?.icon_uri
  if (path) {
    const fullPath = path.startsWith('http') ? path : path.includes('/') ? `${FTR_ICON_CDN}/${path}.png`.replace('.png.png', '.png') : path
    if (fullPath.startsWith('http')) return fullPath
    return getIconUrl(type, path)
  }
  const fn = item?.['file-name'] || item?.fileName
  if (fn) return getIconUrl(type, fn)
  return ''
}

export function resolveImageUri(item, type) {
  return resolveIconUri(item, type)
}

import { useCatalogueStore } from '../stores/catalogue'

async function fetchCatalogueData() {
  const store = useCatalogueStore()
  return store.prefetch()
}

// 转换家具类（housewares, misc, wall_mounted）
// 列表只展示一件（首个变体图标），多颜色/变体在详情页展示
function transformFurniture(raw, mapVar) {
  const items = []
  for (const [key, obj] of Object.entries(raw)) {
    const ipf = (obj.ipf || '').replace('FtrIcon/', '')
    const imgs = obj.img || []
    const vars = obj.var || []
    const baseName = obj.loc ? locToName(obj.loc) : { 'name-USen': ipf.replace(/^Ftr|_Remake_$|_$/g, ' ').trim() || key }
    const firstSuffix = imgs[0] || ''
    const firstFileName = ipf + firstSuffix
    const variantCount = imgs.length
    items.push({
      'file-name': firstFileName,
      fileName: firstFileName,
      baseKey: key,
      name: baseName,
      iconPath: `FtrIcon/${firstFileName}`,
      variantCount
    })
  }
  return items
}

/**
 * 将 catalogue 原始 nhd/shd 数组展开为「可捕获月份」集合（参考 tools.catalogue.js 的 g 与 y）
 * 原始格式：成对 [start1, end1, start2, end2, ...]，月份 0–11，首尾均含
 */
function expandNhdShd(arr) {
  const set = new Set()
  if (!arr || !Array.isArray(arr)) return set
  // 若已是对象形式（如 { 1: true, 2: true }），取 key 作为月份
  if (arr.length > 0 && typeof arr[0] === 'object' && !Array.isArray(arr[0])) {
    Object.keys(arr).forEach((k) => {
      const n = parseInt(k, 10)
      if (!isNaN(n) && n >= 0 && n <= 11) set.add(n)
    })
    return set
  }
  for (let s = 0; s < arr.length / 2; s++) {
    let a = arr[2 * s]
    let n = arr[2 * s + 1] + 1
    if (n === 12) n = 0
    do {
      set.add(a)
      a = a === 11 ? 0 : a + 1
    } while (a !== n)
  }
  return set
}

/** 判断生物在指定半球、月份是否可捕获；无月份数据时视为不匹配（筛选时排除） */
export function isCritterAvailableInMonth(item, hemisphere, monthIndex) {
  const months = hemisphere === 'south' ? item.monthsSouth : item.monthsNorth
  if (!months || !months.size) return false
  return months.has(monthIndex)
}

/** 判断生物是否关联指定活动（evt 为 item 上的 eventIds，selectedIds 为勾选的活动 id 列表） */
export function hasCritterEvent(eventIds, selectedIds) {
  if (!selectedIds || !selectedIds.length) return true
  if (!eventIds || !eventIds.length) return false
  const set = new Set(selectedIds)
  return eventIds.some((id) => set.has(String(id)))
}

// 转换生物类（fish, bugs, sea），附带 nhd/shd/evt 供按月份、半球、活动筛选
function transformCritter(raw, mapEvt) {
  return Object.entries(raw).map(([key, obj]) => {
    const loc = obj.loc || {}
    const img = obj.img || obj.fim || ''
    const fileName = img.includes('/') ? getFileNameFromPath(img) : img
    const nhd = obj.nhd
    const shd = obj.shd
    const evtRaw = obj.evt
    const monthsNorth = expandNhdShd(nhd)
    const monthsSouth = expandNhdShd(shd)
    const mapEvtArr = Array.isArray(mapEvt) ? mapEvt : null
    const resolveEvtId = (e) => (mapEvtArr && typeof e === 'number' && mapEvtArr[e] != null ? mapEvtArr[e] : e)
    const eventIds =
      evtRaw == null
        ? []
        : Array.isArray(evtRaw)
          ? evtRaw.map(resolveEvtId).filter((id) => id != null && id !== '')
          : [resolveEvtId(evtRaw)].filter((id) => id != null && id !== '')
    return {
      'file-name': fileName,
      fileName,
      id: key,
      name: locToName(loc),
      iconPath: img,
      monthsNorth,
      monthsSouth,
      eventIds
    }
  })
}

// 转换 villagers（maps.vsp 为物种码数组 ["brd","squ","pig",...]，obj.vsp 为索引）
function transformVillagers(raw, mapVsp, localeVsp) {
  const vspArr = Array.isArray(mapVsp) ? mapVsp : null
  return Object.entries(raw).map(([key, obj]) => {
    const img = obj.img || ''
    const fileId = img.includes('/') ? getFileNameFromPath(img) : key
    const vsp = obj.vsp
    const spCode = vspArr && vsp != null ? (vspArr[vsp] ?? '') : ''
    const spLoc = spCode && localeVsp ? localeVsp[spCode] : null
    const species = spLoc ? (spLoc['en'] || spLoc['zh-cn'] || spCode) : spCode
    const vbd = obj.vbd || []
    const birthday = vbd.length >= 2 ? `${vbd[0]}/${vbd[1]}` : ''
    const loc = obj.loc || {}
    return {
      'file-name': fileId,
      fileName: img || fileId,
      id: key,
      name: locToName(loc),
      species: species ? species.charAt(0).toUpperCase() + species.slice(1) : '',
      birthday,
      iconPath: img
    }
  })
}

// 转换 art：每件艺术品只显示一条，真品/赝品在详情内切换
function transformArt(raw) {
  const items = []
  for (const [key, obj] of Object.entries(raw)) {
    const imgs = Array.isArray(obj.img) ? obj.img : [obj.img].filter(Boolean)
    const loc = obj.loc || {}
    const baseName = locToName(loc)
    const realImg = imgs[0] || ''
    const realFileName = realImg.includes('/') ? getFileNameFromPath(realImg) : realImg
    const fakeFileName = imgs[1] ? (imgs[1].includes('/') ? getFileNameFromPath(imgs[1]) : imgs[1]) : null
    items.push({
      'file-name': realFileName,
      fileName: realFileName,
      id: key,
      baseKey: key,
      name: baseName && Object.keys(baseName).length ? baseName : { 'name-USen': realFileName },
      iconPath: realImg,
      variants: [
        { type: 'real', fileName: realFileName },
        ...(fakeFileName ? [{ type: 'fake', fileName: fakeFileName }] : [])
      ]
    })
  }
  return items
}

// 转换 fossils
function transformFossils(raw) {
  return Object.entries(raw).map(([key, obj]) => {
    const loc = obj.loc || {}
    const img = obj.img || obj.fim || ''
    const fileName = img.includes('/') ? getFileNameFromPath(img) : img
    return {
      'file-name': fileName,
      fileName,
      id: key,
      name: locToName(loc),
      iconPath: img
    }
  })
}

export async function fetchAcnhData(category) {
  const data = await fetchCatalogueData()
  if (!data) return []
  const dataObj = data.data || data
  const maps = data.maps || {}
  const locale = data.locale || {}

  const catKey = CATEGORY_MAP[category] || category

  if (['housewares', 'misc', 'wall_mounted'].includes(catKey)) {
    const raw = dataObj[catKey]
    if (!raw) return []
    return transformFurniture(raw, locale.var)
  }

  if (['fish', 'bugs', 'sea'].includes(catKey)) {
    const raw = dataObj[catKey]
    if (!raw) return []
    return transformCritter(raw, maps.evt)
  }

  if (catKey === 'villagers') {
    const raw = dataObj[catKey]
    if (!raw) return []
    return transformVillagers(raw, maps.vsp, locale.vsp)
  }

  if (catKey === 'art') {
    const raw = dataObj[catKey]
    if (!raw) return []
    return transformArt(raw)
  }

  if (catKey === 'fossils') {
    const raw = dataObj[catKey]
    if (!raw) return []
    return transformFossils(raw)
  }

  return []
}

// 根据 itemId 获取单个物品（用于详情页，无 state 时回退加载）
export async function fetchAcnhItem(category, itemId) {
  const items = await fetchAcnhData(category)
  const id = decodeURIComponent(itemId)
  const idStr = String(id)
  return items.find(i => (
    i.baseKey === idStr || i.baseKey === id ||
    i['file-name'] === id || i.fileName === id || i.id === id || String(i.id) === id
  )) || null
}

// 获取原始 catalogue 数据（用于详情页展示更多信息）
export async function fetchCatalogueRaw() {
  return fetchCatalogueData()
}

// 根据 category 和 itemId 获取原始物品数据（data.json 接口结构）
export async function fetchAcnhRawItem(category, itemId) {
  const full = await fetchCatalogueData()
  if (!full) return null
  const data = full.data || full
  const catKey = CATEGORY_MAP[category] || category
  const raw = data[catKey]
  if (!raw) return null

  const id = decodeURIComponent(itemId)
  const idLower = String(id).toLowerCase()

  if (catKey === 'villagers') {
    return raw[id] || raw[idLower] || null
  }

  if (catKey === 'art') {
    const idBase = String(id).replace(/_\d+$/, '')
    const idNoFtr = idBase.replace(/^Ftr/i, '')
    return raw[id] || raw[idBase] || raw[idNoFtr] || raw[idLower] || raw[idBase.toLowerCase()] || raw[idNoFtr.toLowerCase()] || null
  }

  if (['housewares', 'misc', 'wall_mounted'].includes(catKey)) {
    if (raw[id] || raw[idLower]) return raw[id] || raw[idLower]
    for (const [key, obj] of Object.entries(raw)) {
      const ipf = (obj.ipf || '').replace('FtrIcon/', '')
      const imgs = obj.img || []
      for (const suffix of imgs) {
        const fileName = (ipf + suffix).toLowerCase()
        if (fileName === idLower || idLower.includes(fileName)) return obj
      }
    }
    return null
  }

  for (const [key, obj] of Object.entries(raw)) {
    const img = obj?.img || obj?.fim || ''
    const fn = (Array.isArray(img) ? img[0] : img) || ''
    const fileName = (fn.includes('/') ? fn.split('/').pop() : fn).toLowerCase()
    if (fileName === idLower || fileName.includes(idLower) || key === id || String(key) === id) {
      return obj
    }
  }
  return raw[id] || raw[idLower] || null
}

// 家具类数据需要扁平化（兼容旧格式，catalogue 已返回扁平数组）
export function flattenFurnitureData(raw) {
  if (Array.isArray(raw)) return raw
  const items = []
  for (const [key, variants] of Object.entries(raw)) {
    if (!Array.isArray(variants)) continue
    for (const v of variants) {
      const fn = v['file-name'] || v?.fileName
      if (!fn) continue
      items.push({ ...v, fileName: fn, baseKey: key })
    }
  }
  return items
}

// 分类配置
export const CATALOGUE_CATEGORIES = [
  { id: 'fish', label: '鱼类', icon: 'mdi:fish', api: 'fish', total: 80, flat: false },
  { id: 'bugs', label: '昆虫', icon: 'mdi:butterfly', api: 'bugs', total: 80, flat: false },
  { id: 'sea', label: '海洋生物', icon: 'mdi:octopus', api: 'sea', total: 40, flat: false },
  { id: 'fossils', label: '化石', icon: 'mdi:bone', api: 'fossils', total: 73, flat: false },
  { id: 'art', label: '艺术品', icon: 'mdi:image-frame', api: 'art', total: 43, flat: false },
  { id: 'villagers', label: '小动物', icon: 'mdi:cat', api: 'villagers', total: 413, flat: false },
  { id: 'houseware', label: '家具', icon: 'mdi:sofa', api: 'houseware', total: 1800, flat: true },
  { id: 'misc', label: '小物件', icon: 'mdi:package-variant', api: 'misc', total: 1200, flat: true },
  { id: 'wallmounted', label: '墙挂', icon: 'mdi:image-frame-outline', api: 'wallmounted', total: 500, flat: true }
]

export const VILLAGER_SPECIES_ZH = {
  Alligator: '鳄鱼', Anteater: '食蚁兽', Bear: '熊', Bird: '鸟', Bull: '牛', Cat: '猫',
  Chicken: '鸡', Cow: '奶牛', Cub: '小熊', Deer: '鹿', Dog: '狗', Duck: '鸭',
  Eagle: '老鹰', Elephant: '象', Frog: '青蛙', Goat: '山羊', Gorilla: '大猩猩',
  Hamster: '仓鼠', Hippo: '河马', Horse: '马', Kangaroo: '袋鼠', Koala: '考拉',
  Lion: '狮子', Monkey: '猴子', Mouse: '老鼠', Octopus: '章鱼', Ostrich: '鸵鸟',
  Penguin: '企鹅', Pig: '猪', Rabbit: '兔子', Rhino: '犀牛', Sheep: '羊',
  Squirrel: '松鼠', Tiger: '老虎', Wolf: '狼'
}

export const DATA_SOURCES = [
  { name: 'Data Spreadsheet for ACNH', url: 'https://tinyurl.com/acnh-sheet' },
  { name: 'ACNH CDN', url: 'https://acnhcdn.com' },
  { name: 'catalogue.ac', url: 'https://catalogue.ac' }
]

/**
 * 从原始数据中取出活动列表，供图鉴「按活动筛选」下拉使用
 * @param {object} rawData - catalogue loadOnce/prefetch 返回的完整数据
 * @returns {{ id: string, title: string }[]}
 */
export function getCritterEventsList(rawData) {
  const events = rawData?.events || {}
  const locale = rawData?.locale?.evt || {}
  const getTitle = (id) => {
    const loc = locale[id]
    return loc?.['zh-cn'] || loc?.zh || loc?.en || loc?.['en-us'] || (id && id.replace(/_/g, ' ')) || id
  }
  return Object.keys(events)
    .filter((id) => events[id] && typeof events[id] === 'object')
    .map((id) => ({ id, title: getTitle(id) }))
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
}

// 解析 API 事件为日历日期映射（供 CalendarView 使用）
// 返回 { "month/day": [{ type, title, icon, id }] }
// hemisphere: 'north' | 'south'
export function parseCalendarEvents(rawData, hemisphere = 'north') {
  const events = rawData?.events || {}
  const locale = rawData?.locale?.evt || {}
  const dataObj = rawData?.data || rawData
  const map = {}

  function addEvent(key, evt) {
    if (!map[key]) map[key] = []
    map[key].push(evt)
  }

  function getTitle(id) {
    const loc = locale[id]
    return loc?.['zh-cn'] || loc?.zh || loc?.en || loc?.['en-us'] || id?.replace(/_/g, ' ') || id
  }

  function getNthWeekday(month, nth, weekday, year = new Date().getFullYear()) {
    const first = new Date(year, month - 1, 1)
    let count = 0
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month - 1, d)
      if (date.getMonth() !== month - 1) break
      if (date.getDay() === weekday) {
        count++
        if (count === nth) return d
      }
    }
    return null
  }

  for (const [id, ev] of Object.entries(events || {})) {
    if (!ev || typeof ev !== 'object') continue
    const arr = hemisphere === 'south' ? ev.sh : ev.nh
    const dateArr = ev.date
    const title = getTitle(id)
    const icon = ev.img ? `https://nh-cdn.catalogue.ac/${String(ev.img).replace(/\.png$/, '')}.png` : null
    const item = { type: 'event', title, icon, id }

    if (ev.type === 'weekday' && Array.isArray(arr) && arr.length >= 3) {
      const [month, nth, weekday] = arr
      const year = new Date().getFullYear()
      for (let y = year - 1; y <= year + 1; y++) {
        const d = getNthWeekday(month, nth, weekday, y)
        if (d) addEvent(`${month}/${d}`, { ...item, year: y })
      }
    } else if ((ev.type === 'range' || !ev.type) && Array.isArray(dateArr)) {
      if (dateArr.length >= 4) {
        const [m1, d1, m2, d2] = dateArr
        for (let m = m1; m <= m2; m++) {
          const lastD = m === m2 ? d2 : new Date(2000, m, 0).getDate()
          const firstD = m === m1 ? d1 : 1
          for (let d = firstD; d <= lastD; d++) addEvent(`${m}/${d}`, item)
        }
      } else if (dateArr.length >= 2) {
        addEvent(`${dateArr[0]}/${dateArr[1]}`, item)
      }
    } else if (Array.isArray(arr) && arr.length >= 2 && !ev.type) {
      addEvent(`${arr[0]}/${arr[1]}`, item)
    }
  }
  return map
}

/**
 * 防抖（参考 tools.ratelimiter 的节流思路，此处为防抖：常用于搜索框输入）
 * @param {Function} fn 要延迟执行的函数
 * @param {number} ms 延迟毫秒数
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, ms) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, ms)
  }
}
