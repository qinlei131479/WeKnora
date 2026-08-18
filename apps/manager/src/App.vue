<template>
  <t-config-provider :globalConfig="tdGlobalConfig">
    <router-view />
  </t-config-provider>
</template>

<script setup lang="ts">
import useSettingsStore from '@/store/modules/settings';
import { handleThemeStyle, handleThemeSuccessStyle } from '@/utils/theme';

// import { MessagePlugin, NotifyPlugin } from 'tdesign-vue-next'

// TDesign locale configs
import enUSConfig from 'tdesign-vue-next/esm/locale/en_US'
import zhCNConfig from 'tdesign-vue-next/esm/locale/zh_CN'
import koKRConfig from 'tdesign-vue-next/esm/locale/ko_KR'
import ruRUConfig from 'tdesign-vue-next/esm/locale/ru_RU'

// import { useI18n } from 'vue-i18n'
// const { locale, t, tm } = useI18n()
const locale = ref('en-US')

const tdLocaleMap: Record<string, object> = {
  'en-US': enUSConfig,
  'zh-CN': zhCNConfig,
  'ko-KR': koKRConfig,
  'ru-RU': ruRUConfig,
}

const tdGlobalConfig = computed(() => tdLocaleMap[locale && locale.value] || zhCNConfig)

// TDesign NotifyPlugin 只有四角 placement，进出场用 translateX 滑向右侧。
// 卡片已 CSS 居中，这里把 WAAPI 改成向上滑入/滑出，避免仍往右消失。
const patchNotificationSlideUp = () => {
  const proto = Element.prototype as Element & { animate: typeof Element.prototype.animate; __wkNotifySlideUp?: boolean }
  if (proto.__wkNotifySlideUp || typeof proto.animate !== 'function') return
  proto.__wkNotifySlideUp = true
  const original = proto.animate
  proto.animate = function (this: Element, keyframes, options) {
    if (this.classList?.contains('t-notification') && Array.isArray(keyframes) && keyframes.length >= 2) {
      const from = keyframes[0] as Keyframe
      const to = keyframes[keyframes.length - 1] as Keyframe
      const h = (this as HTMLElement).offsetHeight || 80
      if (from.opacity === 0 && to.opacity === 1) {
        keyframes = [
          { opacity: 0, transform: `translateY(-${h}px)` },
          { opacity: 1, transform: 'translateY(0px)' },
        ]
      } else if (from.opacity === 1 && to.opacity === 0) {
        keyframes = [
          { opacity: 1, transform: 'translateY(0px)' },
          { opacity: 0, transform: `translateY(-${h}px)` },
        ]
      }
    }
    return original.call(this, keyframes as Keyframe[] | PropertyIndexedKeyframes | null, options)
  }
}
patchNotificationSlideUp()

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme);
    handleThemeSuccessStyle(useSettingsStore().themeSuccess);
  });
});
</script>
