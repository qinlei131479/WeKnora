<script setup lang="ts"></script>

<template>
  <div class="page-content">
    <slot name="header" />
    <div class="page-content-body">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>

<style lang="scss" scoped>
$height: calc(100vh - var(--navbar-height) - var(--page-name-height) - var(--layout-margin) * 2);

.page-content {
  padding: var(--layout-margin) 0;
  background-color: var(--el-color-white);
  border-radius: var(--layout-radius);
  display: flex;
  flex-direction: column;
  height: $height;

  &-body {
    flex: 1;
    min-width: 0;
    overflow-y: hidden;
  }
}
</style>
