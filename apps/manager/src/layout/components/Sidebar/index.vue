<template>
  <div :class="['sidebar-theme-wrapper', { 'has-logo': showLogo }, sideTheme]" class="sidebar-container">
    <div v-if="showLogo && isCollapse" class="sidebar-logo-slot" aria-hidden="true" />
    <logo v-if="showLogo && !isCollapse" :collapse="false" />
    <!-- <CompanySwitch/> -->
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu :default-active="activeMenu" :default-openeds="defaultOpeneds" :collapse="isCollapse"
        :background-color="'transparent'" :text-color="'#77838F'" :active-text-color="'#FFFFFF'"
        :collapse-transition="false" mode="vertical" :class="sideTheme">
        <!-- <div class="search-field">
          <input name="_left_view_input" style="display: none;"/>
          <el-input
            v-model="keyword"
            placeholder="搜索"
            clearable
            @keyup.enter="handleQuery"
          />
        </div> -->
        <sidebar-item v-for="(route, index) in sidebarRouters" :key="route.path + index" :item="route"
          :base-path="route.path" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import Logo from './Logo.vue'
import SidebarItem from './SidebarItem.vue'
// import CompanySwitch from './CompanySwitch.vue'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

import { isExternal } from '@/utils/validate'
import { getNormalPath } from '@/utils/ruoyi'

function resolvePath(routePath: string, routeQuery?: string, basePath?: string): string {
  if (isExternal(routePath)) {
    return routePath
  }
  const _basePath = basePath || ''
  if (isExternal(_basePath)) {
    return _basePath
  }
  if (routeQuery) {
    const query = JSON.parse(routeQuery)
    return getNormalPath(basePath + '/' + routePath) + '?' + query
  }
  return getNormalPath(basePath + '/' + routePath)
}

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
const defaultOpeneds = computed(() => {
  const defaultOpeneds: string[] = []
  const add = (item: any, basePath?: string) => {
    if (item.hidden) {
      return;
    }
    let onlyOneChild = null;
    const children = item.children || []
    let hasOneShowingChild = false;
    const showingChildren = children.filter((item: any) => {
      if (item.hidden) {
        return false
      }
      onlyOneChild = item
      return true
    });
    if (showingChildren.length === 1) {
      hasOneShowingChild = true
    } else if (showingChildren.length === 0) {
      onlyOneChild = { ...item, path: '', noShowingChildren: true }
      hasOneShowingChild = true
    }
    if (hasOneShowingChild && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow) {
      // 
    } else {
      const path = resolvePath(item.path, item.query, basePath)
      defaultOpeneds.push(path)
    }
    item.children?.forEach((child: any) => add(child, resolvePath(child.path, undefined, basePath)))
  }
  sidebarRouters.value.forEach((item: any) => add(item, item.path))
  return defaultOpeneds
})
const showLogo = computed(() => settingsStore.sidebarLogo)
const sideTheme = computed(() => settingsStore.sideTheme)
const isCollapse = computed(() => !appStore.sidebar.opened)

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

// const keyword = ref('')
// const handleQuery = () => {}

</script>

<style lang="scss" scoped>
.sidebar-container {
  background-color: transparent;

  .scrollbar-wrapper {
    background-color: transparent;
  }

  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    background-color: transparent !important;
  }

  .search-field {
    margin: 10px
  }

  .sidebar-logo-slot {
    flex: 0 0 var(--navbar-height, 96px);
    height: var(--navbar-height, 96px);
  }
}
</style>
