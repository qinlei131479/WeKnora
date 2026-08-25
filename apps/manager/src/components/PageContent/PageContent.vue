<script setup lang="ts"></script>

<template>
  <div class="page-content">
    <slot name="header" />
    <div class="page-content-body">
      <slot />
    </div>
    <div class="content-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$height: calc(100vh - var(--navbar-height) - var(--page-name-height) - var(--layout-padding) * 2);

.page-content {
  padding: var(--layout-padding) 0;
  background-color: var(--el-color-white);
  box-sizing: border-box;
  border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
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

.content-footer {
  margin: var(--layout-padding) var(--layout-padding) 0 var(--layout-padding);
  display: flex;
  justify-content: flex-end;
  min-height: 0;
}
</style>
