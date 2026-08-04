<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme, '--current-color-light': theme + '1a', '--current-color-dark-bg': theme + '33' }">
    <app-main />
  </div>
</template>

<script setup lang="ts">
// import { useWindowSize } from '@vueuse/core'
// import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Navbar, Settings, TagsView } from './components'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'

const settingsStore = useSettingsStore()
const theme = computed(() => settingsStore.theme)
const sidebar = computed(() => useAppStore().sidebar)

const classObj = computed(() => ({
  withoutAnimation: sidebar.value.withoutAnimation,
}))

</script>

<style lang="scss" scoped>
@use "@/assets/styles/mixin.scss" as mix;

.app-wrapper {
  @include mix.clearfix;
  position: relative;
  height: 100%;
  width: 100%;
}
.app-main {
  height: 100%;
  min-height: 100vh;
}
</style>