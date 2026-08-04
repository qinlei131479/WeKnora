<template>
  <div class="page-layout" :class="{ 'page-layout-row': row }" :style="{ gap: `${gap}px` }">
    <div class="page-start" v-if="$slots.start">
      <slot name="start"></slot>
    </div>
    <div class="page-main">
      <slot></slot>
    </div>
    <div class="page-end" v-if="$slots.end">
      <slot name="end"></slot>
    </div>
  </div>
</template>
<script setup>
defineProps({
  row: Boolean,
  gap: Number,
})
</script>
<style scoped lang="scss">
.page-layout {
  height: 100%;
  width: 100%;
  display: flex;
  min-height: 0;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  gap: 40px;

  &.page-layout-row {
    flex-direction: row;
  }

  .page-start {
    flex-grow: 0;
    flex-shrink: 0;
  }

  .page-main {
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    min-height: 0;
  }

  .page-end {
    flex-grow: 0;
    flex-shrink: 0;

    :deep(.pagination-container) {
      margin-top: 0;
    }
  }
}
</style>