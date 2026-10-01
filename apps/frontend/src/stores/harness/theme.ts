import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useTheme } from '@/composables/useTheme'

// harness 曾经通过配置提供者组件把一份主题令牌(token/algorithm)传给所有旧组件库子组件。
// 现在 harness 已全面切换到 TDesign，暗色模式统一由全局 CSS 变量 + body class 驱动
// （见已移除的 harness 岛 syncOverlayTheme），不再需要单独维护那份主题令牌对象，
// 这里只保留 isDark。
export const useThemeStore = defineStore('harness-theme', () => {
  const { isDark: weknoraIsDark } = useTheme()

  const isDark = ref(!!weknoraIsDark.value)

  watch(
    weknoraIsDark,
    (dark) => {
      isDark.value = !!dark
    },
    { immediate: true }
  )

  return {
    isDark
  }
})
