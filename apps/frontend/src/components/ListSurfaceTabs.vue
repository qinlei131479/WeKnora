<template>
  <nav class="list-surface-tabs" :aria-label="ariaLabel">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="tab-item"
      :class="{ active: modelValue === item.value }"
      @click="$emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  items: Array<{ value: string; label: string }>
  ariaLabel?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped lang="less">
.list-surface-tabs {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid var(--td-component-stroke);
  margin: 0 28px 12px 0;
  flex-shrink: 0;
}

.tab-item {
  padding: 10px 0;
  cursor: pointer;
  color: var(--td-text-color-secondary);
  font-family: var(--app-font-family);
  font-size: 14px;
  font-weight: 400;
  background: none;
  border: none;
  line-height: 20px;
  transition: color 0.2s;

  &:hover {
    color: var(--td-text-color-primary);
  }

  &.active {
    color: var(--td-brand-color);
    font-weight: 600;
    border-bottom: 2px solid var(--td-brand-color);
    margin-bottom: -1px;
  }
}
</style>
