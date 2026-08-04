<script setup lang="ts">
import type { CategoryVO } from '@/types'
import DomainServiceFactory from '@/service/domainService'

import TreeCategory from '../controls/TreeCategory.vue'

interface Props {
  modelValue: number | null // 选中的分类ID，null表示全部分类
  rootDomainId?: number | null // 根分类ID，null表示全部分类
  rootLabel?: string // 根分类名称
  service?: any
}

const props = withDefaults(defineProps<Props>(), {
  // rootLabel: '全部分类',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void,
  (e: 'change', value: { item: CategoryVO }): void,
}>()

const domainService = props.service || DomainServiceFactory()

const value = computed({
  get() {
    return props.modelValue
  },
  set(value: number | null) {
    if (value! < 0) {
      value = null;
    }
    handleSelect(value)
  }
});
const categories = ref<CategoryVO[]>([]);
const title = ref()

watchEffect(() => {
  let rootDomainId: number | null = props.rootDomainId
  let showDatas: CategoryVO[] = []
  if (rootDomainId) {
    rootDomainId = Number(rootDomainId)
    const rootNode = domainService.dataMap[rootDomainId]
    if (rootNode) {
      showDatas = rootNode.childrenList || []
      title.value = rootNode.name
    } else {
      rootDomainId = null
      showDatas = domainService.allData
    }
  } else {
    rootDomainId = null
    showDatas = domainService.allData
  }
  categories.value = showDatas
})

const handleSelect = (id: number | null) => {
  emit('update:modelValue', id)
  const item = domainService.dataMap[id]
  emit('change', { item })
}

</script>
<script lang="ts">
export { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
</script>
<template>
  <TreeCategory v-model="value" :categories="categories" :title="rootLabel || title" />
</template>
