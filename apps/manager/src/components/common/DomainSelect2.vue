<template>
  <el-tree-select v-model="value" :data="options" :render-after-expand="false" v-bind="$attrs" filterable
    :props="treeProps">
    <template #prefix>
      <svg-icon icon-class="mp-dir"></svg-icon>
    </template>
  </el-tree-select>
</template>
<script setup lang="ts">
// import type { CategoryVO } from '@/types'
import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'

// import 
const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Number as PropType<number | null>,
    default: () => null,
  },
  rootDomainId: {
    type: Number as PropType<number | null>,
    default: () => allCategoryId,
  }
})
const value = computed({
  get: () => props.modelValue,
  set: (val: number | null) => emit('update:modelValue', val),
});
const domainService = DomainServiceFactory()
const options = domainService.computedRoot(props.rootDomainId)
const treeProps = {
  label: 'name',
  value: 'id',
  children: 'childrenList',
}
</script>
<style scoped lang="scss">
.svg-icon {
  color: var(--el-color-primary);
}
</style>