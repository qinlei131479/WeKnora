<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 v-else class="sidebar-title">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/images/logo/logo@1x.png';
import useSettingsStore from '@/store/modules/settings';
import variables from '@/assets/styles/variables.module.scss';
import { t } from '@/i18n';

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
});

const title = t('app.title_short');
const settingsStore = useSettingsStore();
const sideTheme = computed(() => settingsStore.sideTheme);

// 获取Logo背景色
const getLogoBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)';
  }
  if (settingsStore.navType == 3) {
    return variables.menuLightBg;
  }
  return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg;
});

// 获取Logo文字颜色
const getLogoTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-logo-text)';
  }
  if (settingsStore.navType == 3) {
    return variables.menuLightText;
  }
  return sideTheme.value === 'theme-dark' ? '#fff' : variables.menuLightText;
});
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  background: v-bind(getLogoBackground);
  text-align: center;
  overflow: hidden;
  border-radius: var(--layout-radius) var(--layout-radius) 0 0;
  border-bottom: 1px dashed var(--layout-bg-color-page);
  height: 60px;
  display: flex;
  align-items: center;

  & .sidebar-logo-link {
    // height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 36px;
      height: 36px;
      vertical-align: middle;
    }

    & .sidebar-title {
      display: inline-block;
      margin-left: 0.5em;
      color: v-bind(getLogoTextColor);
      font-weight: bold;
      font-size: 20px;
      line-height: 1em;
      vertical-align: middle;
    }
  }
}
</style>
