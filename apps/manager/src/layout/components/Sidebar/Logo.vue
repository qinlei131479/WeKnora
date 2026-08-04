<template>
  <div class="sidebar-logo-container">
    <router-link class="sidebar-logo-link" to="/">
      <img :src="logoUrl" class="sidebar-logo" width="25" height="28" alt="logo" />
      <h1 class="sidebar-title">{{ title }}</h1>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import logoUrl from '@/assets/logo/logo.png'
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: {
    type: Boolean,
    default: false
  }
})

const title = import.meta.env.VITE_APP_TITLE
const settingsStore = useSettingsStore()

const getLogoBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)'
  }
  return 'transparent'
})

const getLogoTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)'
  }
  return '#303133'
})
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  height: 100px;
  background: v-bind(getLogoBackground);

  .sidebar-logo-link {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 20px;
    box-sizing: border-box;
    overflow: hidden;
    text-decoration: none;
  }

  .sidebar-logo {
    width: 25px;
    height: 28px;
    flex-shrink: 0;
    display: block;
  }

  .sidebar-title {
    margin: 0 0 0 12px;
    color: v-bind(getLogoTextColor);
    font-weight: 600;
    font-size: 20px;
    line-height: 1.2;
    font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
