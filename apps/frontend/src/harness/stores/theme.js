import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { theme } from 'ant-design-vue'
import { useTheme } from '@/composables/useTheme'

export const useThemeStore = defineStore('harness-theme', () => {
  const { isDark: weknoraIsDark } = useTheme()

  // 公共主题配置
  const commonTheme = {
    token: {
      fontFamily:
        "'HarmonyOS Sans SC', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;",
      colorPrimary: '#24839b',
      colorLink: 'var(--main-color)',
      colorLinkHover: 'var(--main-600)',
      colorLinkActive: 'var(--main-800)',
      borderRadius: 8,
      wireframe: false
    }
  }

  // 浅色主题配置
  const lightTheme = {
    ...commonTheme
  }

  // 深色主题配置
  const darkTheme = {
    ...commonTheme,
    algorithm: theme.darkAlgorithm
  }

  const isDark = ref(!!weknoraIsDark.value)
  const currentTheme = ref(isDark.value ? darkTheme : lightTheme)

  watch(
    weknoraIsDark,
    (dark) => {
      isDark.value = !!dark
      currentTheme.value = dark ? darkTheme : lightTheme
    },
    { immediate: true }
  )

  return {
    isDark,
    currentTheme
  }
})
