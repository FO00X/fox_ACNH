/**
 * ACNH 数据 API
 * 数据来源: https://github.com/alexislours/ACNHAPI
 * 物品图片: https://nh-cdn.catalogue.ac (catalogue.ac CDN)
 * 生物/化石等: jsdelivr CDN
 */

const ACNH_API_BASE = 'https://raw.githubusercontent.com/alexislours/ACNHAPI/master'
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/alexislours/ACNHAPI@master'
// 物品图鉴: catalogue.ac CDN (https://nh-cdn.catalogue.ac/FtrIcon/xxx.png)
const ITEM_CDN_BASE = 'https://nh-cdn.catalogue.ac'

export function getItemIconUrl(fileName) {
  return `${ITEM_CDN_BASE}/FtrIcon/${fileName}.png`
}

export function getIconUrl(type, fileName) {
  if (['houseware', 'misc', 'wallmounted'].includes(type)) {
    return getItemIconUrl(fileName)
  }
  return `${CDN_BASE}/icons/${type}/${fileName}.png`
}

export function getImageUrl(type, fileName) {
  return `${CDN_BASE}/images/${type}/${fileName}.png`
}

// 从 API 数据解析图标/图片 URL
export function resolveIconUri(item, type) {
  const fn = item?.['file-name'] || item?.fileName
  if (fn) return getIconUrl(type, fn)
  return item?.icon_uri || ''
}

export function resolveImageUri(item, type) {
  const fn = item?.['file-name'] || item?.fileName
  if (fn) return getImageUrl(type, fn)
  return item?.image_uri || ''
}

// 备用数据源（GitHub raw 在某些网络下会 RESET，用 jsdelivr 兜底）
const ACNH_API_FALLBACK = 'https://cdn.jsdelivr.net/gh/alexislours/ACNHAPI@master'

async function fetchFromUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// 获取数据（先主源，失败则走备用源）
export async function fetchAcnhData(category) {
  const primary = `${ACNH_API_BASE}/${category}.json`
  const fallback = `${ACNH_API_FALLBACK}/${category}.json`
  let lastErr
  for (const url of [primary, fallback]) {
    try {
      return await fetchFromUrl(url)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error(`无法加载 ${category} 数据，请检查网络后重试`)
}

// 家具类数据需要扁平化（每个变体单独一条）
export function flattenFurnitureData(raw) {
  const items = []
  for (const [key, variants] of Object.entries(raw)) {
    if (!Array.isArray(variants)) continue
    for (const v of variants) {
      const fn = v['file-name']
      if (!fn) continue
      items.push({
        ...v,
        fileName: fn,
        baseKey: key
      })
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

// 小动物物种中文
export const VILLAGER_SPECIES_ZH = {
  Alligator: '鳄鱼', Anteater: '食蚁兽', Bear: '熊', Bird: '鸟', Bull: '牛', Cat: '猫',
  Chicken: '鸡', Cow: '奶牛', Cub: '小熊', Deer: '鹿', Dog: '狗', Duck: '鸭',
  Eagle: '老鹰', Elephant: '象', Frog: '青蛙', Goat: '山羊', Gorilla: '大猩猩',
  Hamster: '仓鼠', Hippo: '河马', Horse: '马', Kangaroo: '袋鼠', Koala: '考拉',
  Lion: '狮子', Monkey: '猴子', Mouse: '老鼠', Octopus: '章鱼', Ostrich: '鸵鸟',
  Penguin: '企鹅', Pig: '猪', Rabbit: '兔子', Rhino: '犀牛', Sheep: '羊',
  Squirrel: '松鼠', Tiger: '老虎', Wolf: '狼'
}
