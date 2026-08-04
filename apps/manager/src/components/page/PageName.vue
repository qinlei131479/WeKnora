<template>
  <div class="page-name">
    <div class="page-name-left">
      <svg-icon :icon-class="iconClass || meta.icon" />
      <div class="name-container">
        <div class="name-text">{{ title || meta.title || meta.name }}</div>
        <div v-if="$slots.subtitle || subtitle" class="subtitle-text">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
      </div>
    </div>
    <div class="page-name-right">
      <slot></slot>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  subtitle: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
})
const route = useRoute()
const meta = route.meta || {}
</script>
<style scoped lang="scss">
$size: 32px;

.page-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-name-left {
  line-height: $size;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: flex-start;

  .svg-icon {
    color: var(--el-color-primary);
    width: $size;
    height: $size;
    margin-right: 8px;
  }

  .name-text {
    font-weight: bold;
    font-size: 20px;
    color: #2b2f33;
    text-align: left;
    font-style: normal;
    text-transform: none;
  }

  .subtitle-text {
    font-weight: 400;
    font-size: 14px;
    color: #77838F;
    line-height: 20px;
    margin-top: 7px;
  }
}
</style>
