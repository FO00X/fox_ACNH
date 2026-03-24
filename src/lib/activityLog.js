import { supabase } from './supabase'

const throttleUntil = new Map()

/**
 * 记录一条全员可见的动态（写入 activity_events）。
 * @param {string} userId
 * @param {string} kind
 * @param {Record<string, unknown>} meta
 * @param {number} [throttleMs] 同一 throttleKey 在窗口内只记一次
 * @param {string} [throttleKey]
 */
export async function logActivity(userId, kind, meta = {}, throttleMs = 0, throttleKey = '') {
  if (!userId || !kind) return
  if (throttleMs > 0 && throttleKey) {
    const k = `${userId}:${kind}:${throttleKey}`
    const now = Date.now()
    const until = throttleUntil.get(k) || 0
    if (now < until) return
    throttleUntil.set(k, now + throttleMs)
  }
  try {
    const { error } = await supabase.from('activity_events').insert({
      user_id: userId,
      kind,
      meta: meta || {}
    })
    if (error) console.warn('activity_events insert:', error)
  } catch (e) {
    console.warn('activity_events insert:', e)
  }
}

export const ACTIVITY_KIND = {
  CATALOGUE_VIEW: 'catalogue_view',
  WISHLIST_ADD: 'wishlist_add',
  CATALOGUE_OWNED_ADD: 'catalogue_owned_add',
  CATALOGUE_OWNED_REMOVE: 'catalogue_owned_remove',
  TURNIP_RECORD: 'turnip_record',
  DAILY_TASK_PROGRESS: 'daily_task_progress',
  DAILY_TASK_COMPLETE: 'daily_task_complete',
  BOARD_POST_RESOLVED: 'board_post_resolved',
  WISHLIST_FULFILLED: 'wishlist_fulfilled',
  VILLAGER_BIRTHDAY: 'villager_birthday',
  USER_BIRTHDAY: 'user_birthday'
}
