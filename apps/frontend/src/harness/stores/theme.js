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
      colorPrimary: '#07c05f',
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

  // 深色主题配置：页面与普通容器统一为 #181818，浮层保留 #242424
  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      ...commonTheme.token,
      colorBgBase: '#181818',
      colorTextBase: '#ffffff',
      colorBgContainer: '#181818',
      colorBgElevated: '#242424',
      colorBgLayout: '#181818',
      colorBgSpotlight: '#2c2c2c',
      colorBgMask: 'rgba(0, 0, 0, 0.6)',
      colorBorder: '#5e5e5e',
      colorBorderSecondary: '#383838',
      colorText: 'rgba(255, 255, 255, 0.9)',
      colorTextSecondary: 'rgba(255, 255, 255, 0.55)',
      colorTextTertiary: 'rgba(255, 255, 255, 0.35)',
      colorTextQuaternary: 'rgba(255, 255, 255, 0.22)',
      colorFill: 'rgba(255, 255, 255, 0.08)',
      colorFillSecondary: 'rgba(255, 255, 255, 0.06)',
      colorFillTertiary: 'rgba(255, 255, 255, 0.04)',
      colorFillQuaternary: 'rgba(255, 255, 255, 0.02)'
    }
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
