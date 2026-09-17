<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
    <!-- <Embed /> -->
  </el-config-provider>
</template>

<script setup lang="ts">
import eleLocaleZh from 'element-plus/es/locale/lang/zh-cn';
import eleLocaleEn from 'element-plus/es/locale/lang/en';
import { locale } from '@/i18n';
import useSettingsStore from '@/store/modules/settings';
import { handleThemeStyle } from '@/utils/theme';
// import Embed from '@/components/Embed.vue';

const elementLocale = computed(() => (locale.value === 'en-US' ? eleLocaleEn : eleLocaleZh));

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme);
  });
});
</script>
