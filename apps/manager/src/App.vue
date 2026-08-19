<template>
  <router-view />
</template>

<script setup lang="ts">
import useSettingsStore from '@/store/modules/settings';
import { handleThemeStyle, handleThemeSuccessStyle } from '@/utils/theme';

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme);
    handleThemeSuccessStyle(useSettingsStore().themeSuccess);
  });
});
</script>
