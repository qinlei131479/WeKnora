<template>
  <div
    class="page-header"
    :class="{
      'page-header--bordered': showBorder,
      'page-header--sticky': sticky
    }"
  >
    <div v-if="loading" class="page-header-loading-bar-wrapper">
      <div class="page-header-loading-bar"></div>
    </div>
    <div class="page-header-left">
      <div class="page-header-heading">
        <h1 v-if="title" class="page-header-title">{{ title }}</h1>
        <nav
          v-if="tabs.length > 0"
          class="page-header-tabs"
          :class="{ 'page-header-tabs--solo': !title }"
          :aria-label="ariaLabel"
        >
          <template v-for="item in tabs" :key="item.key">
            <RouterLink
              v-if="item.path"
              :to="item.path"
              class="tab-item"
              :class="{ active: activeKey === item.key }"
              @click="emitChange(item)"
            >
              {{ item.label }}
            </RouterLink>
            <button
              v-else
              type="button"
              class="tab-item"
              :class="{ active: activeKey === item.key }"
              @click="emitChange(item)"
            >
              {{ item.label }}
            </button>
          </template>
        </nav>
      </div>
      <p v-if="subtitle" class="page-header-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.info || $slots.actions" class="page-header-right">
      <slot name="info" />
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  activeKey: { type: String, default: '' },
  tabs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  showBorder: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '视图切换' }
})

const emit = defineEmits(['update:activeKey', 'change'])

function emitChange(item) {
  emit('update:activeKey', item.key)
  emit('change', item)
}
</script>

<style scoped lang="less">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px var(--page-padding) 16px;
  background-color: transparent;
  position: relative;
  z-index: 0;

  &--bordered {
    border-bottom: none;
  }

  &--sticky {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.page-header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.page-header-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.page-header-title {
  margin: 0;
  color: var(--td-text-color-primary, var(--gray-2000));
  font-family: var(--app-font-family, inherit);
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  white-space: nowrap;
}

.page-header-subtitle {
  margin: 0;
  color: var(--td-text-color-placeholder, var(--gray-500));
  font-family: var(--app-font-family, inherit);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.page-header-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding-left: 12px;
  margin-left: 2px;
  border-left: 1px solid var(--gray-200);
  height: 18px;
  line-height: 18px;
  flex-shrink: 0;

  &--solo {
    padding-left: 0;
    margin-left: 0;
    border-left: none;
  }
}

.tab-item {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--gray-600);
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    color: var(--gray-900);
    background-color: var(--gray-50);
  }

  &.active {
    color: var(--main-color);
    background-color: color-mix(in srgb, var(--main-color) 6%, var(--gray-0));
  }
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.page-header-loading-bar-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 101;
  overflow: hidden;
  background: transparent;

  .page-header-loading-bar {
    height: 100%;
    background: var(--main-color);
    width: 30%;
    position: absolute;
    animation: page-header-loading-bar-anim 1.5s infinite linear;
  }
}

@keyframes page-header-loading-bar-anim {
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
}
</style>
