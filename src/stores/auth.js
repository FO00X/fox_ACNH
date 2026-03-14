import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useCatalogueStore } from './catalogue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    const { data: { user: u } } = await supabase.auth.getUser()
    user.value = u
    if (u) {
      await fetchProfile(u.id)
      useCatalogueStore().prefetch().catch(() => {})
    }
  }

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    profile.value = data
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await fetchProfile(data.user.id)
    useCatalogueStore().prefetch().catch(() => {})
    return data
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    user.value = data.user
    if (data.user) {
      await new Promise(r => setTimeout(r, 500))
      await fetchProfile(data.user.id)
      useCatalogueStore().prefetch().catch(() => {})
    }
    return data
  }

  async function updateProfile(updates) {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
      .select()
      .single()
    if (error) throw error
    profile.value = data
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    useCatalogueStore().clear()
  }

  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
    if (session?.user) {
      fetchProfile(session.user.id)
      useCatalogueStore().prefetch().catch(() => {})
    } else {
      useCatalogueStore().clear()
    }
  })

  return {
    user,
    profile,
    isLoggedIn,
    init,
    signIn,
    signUp,
    signOut,
    updateProfile,
    fetchProfile
  }
})
