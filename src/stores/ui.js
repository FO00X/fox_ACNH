import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const THEME_KEY = 'acnh-theme'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
}

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const theme = ref('light')

  const isDark = computed(() => theme.value === 'dark')

  function init() {
    theme.value = getInitialTheme()
    applyTheme(theme.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme.value)
    applyTheme(theme.value)
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  return {
    sidebarOpen,
    theme,
    isDark,
    init,
    toggleTheme,
    openSidebar,
    closeSidebar,
    toggleSidebar
  }
})

