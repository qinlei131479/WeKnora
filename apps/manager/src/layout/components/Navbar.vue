<template>
  <div class="navbar" :class="'nav' + settingsStore.navType">
    <!--
    <router-link v-if="!appStore.sidebar.opened && settingsStore.sidebarLogo" to="/" class="navbar-collapsed-logo">
      <img :src="logoUrl" width="25" height="28" alt="logo" />
    </router-link>
    -->
    <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
    <breadcrumb v-if="settingsStore.navType == 1" id="breadcrumb-container" class="breadcrumb-container" />
    <top-nav v-if="settingsStore.navType == 2" id="topmenu-container" class="topmenu-container" />
    <template v-if="settingsStore.navType == 3">
      <logo v-show="settingsStore.sidebarLogo" :collapse="false"></logo>
      <top-bar id="topbar-container" class="topbar-container" />
    </template>

    <div v-if="appStore.device !== 'mobile'" class="navbar-right">
      <header-search id="header-search" class="navbar-search" />
      <TopRightMenu @setLayout="setLayout" />
    </div>
    <TopRightMenu v-else @setLayout="setLayout" />
  </div>
</template>

<script setup lang="ts">
import Breadcrumb from '@/components/Breadcrumb/index.vue';
import TopNav from './TopNav/index.vue';
import TopBar from './TopBar/index.vue';
import Logo from './Sidebar/Logo.vue';
// import logoUrl from '@/assets/logo/logo@1x.png';
import TopRightMenu from './TopRightMenu.vue';
// import CompanySwitch from './Sidebar/CompanySwitch.vue'

import Hamburger from '@/components/Hamburger/index.vue';
import HeaderSearch from '@/components/HeaderSearch/index.vue';
import useAppStore from '@/store/modules/app';
import useSettingsStore from '@/store/modules/settings';

const appStore = useAppStore();
const settingsStore = useSettingsStore();

function toggleSideBar(): void {
  appStore.toggleSideBar();
}

const emits = defineEmits(['setLayout']);
function setLayout(): void {
  emits('setLayout');
}
</script>

<style lang="scss" scoped>
.navbar.nav3 {
  .hamburger-container {
    display: none !important;
  }
}

.navbar {
  // width: 100%;
  height: var(--navbar-height, 96px);
  overflow: hidden;
  position: relative;
  background: var(--navbar-bg);
  box-shadow: none;
  display: flex;
  align-items: center;
  // padding-right: 16px;
  box-sizing: border-box;
  border: var(--border);
  border-radius: var(--layout-radius);

  .hamburger-container {
    //   line-height: var(--navbar-height, 96px);
    line-height: 46px;
    height: 100%;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-right: 8px;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    flex-shrink: 0;
  }

  .navbar-right {
    display: flex;
    align-items: center;
    margin-left: auto;
    flex-shrink: 0;
    gap: 16px;
    min-width: 0;
  }

  // .navbar-search {
  //   flex-shrink: 0;
  // }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .topbar-container {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    margin-left: 8px;
  }
}
</style>
