<template>
  <div class="page-shoulder">
    <div class="page-shoulder-left">
      <t-input
        v-if="!$slots.search"
        v-model="searchModel"
        :placeholder="searchPlaceholder"
        clearable
        class="search-input"
      >
        <template #prefixIcon><Search :size="14" class="text-muted" /></template>
      </t-input>
      <slot name="search" />
      <slot name="filters" />
    </div>
    <div v-if="$slots.actions" class="page-shoulder-right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { Search } from 'lucide-vue-next'

const searchModel = defineModel('search', { type: String, default: '' })

defineProps({
  searchPlaceholder: { type: String, default: '搜索...' }
})
</script>

<style lang="less" scoped>
.page-shoulder {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px var(--page-padding) 0;

  &-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.search-input {
  width: 280px;
}

.text-muted {
  color: var(--gray-400);
}
</style>
