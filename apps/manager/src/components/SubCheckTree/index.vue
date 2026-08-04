<template>
  <el-tree ref="treeRef" :data="props.data" :default-expand-all="props.defaultExpandAll"
    :expand-on-click-node="props.expandOnClickNode" :props="props.props" v-bind="$attrs" class="dept-tree"
    :filter-node-method="filterNode" @node-click="handleNodeClick" :class="props.size">
    <template #default="{ node, data }">
      <div class="custom-tree-node">
        <span class="custom-label">{{ node.label }}</span>
        <slot name="right" :data="data" :node="node">
          <div class="flex items-center gap-1">
            <el-button v-if="data.children?.length" class="mini-btn" @click.stop="handleSubClick(data)">子</el-button>
            <el-checkbox @click.stop @change="handleCheckboxClick(data)" v-model="data.checked" />
          </div>
        </slot>
      </div>
    </template>
  </el-tree>
</template>
<script setup>

const emit = defineEmits(['sub', 'check', 'item'])
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  defaultExpandAll: {
    type: Boolean,
    default: true,
  },
  expandOnClickNode: {
    type: Boolean,
    default: false,
  },
  props: {
    type: Object,
    default: () => undefined,
  },
  size: {
    type: String,
    default: '',
  },
})

const treeRef = ref(null);
const filterNode = computed(() => {
  const pp = props.props || {};
  const labelKey = pp.label || 'label';
  return (value, data) => {
    if (!value) return true
    return data[labelKey].includes(value)
  }
});
const filter = (value) => {
  treeRef.value?.filter(value)
}
const handleNodeClick = (data, node, a, b) => {
  // console.log('handleNodeClick',data,node,a,b)
  emit('item', data)
}

const handleSubClick = (data) => {
  // console.log('handleSubClick1', data)
  emit('sub', data)
}

const handleCheckboxClick = (data) => {
  // console.log('handleCheckboxClick1', data)
  emit('check', data)
}
defineExpose({
  filter
})
</script>
<style scoped lang="scss">
.dept-tree {
  &.big {
    --el-tree-node-content-height: 40px;
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
  min-width: 0;

  .custom-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.mini-btn {
  opacity: 0;
}

.dept-tree {
  :deep(.el-tree-node__content) {
    &:hover {
      .mini-btn {
        opacity: 1;
      }
    }
  }
}
</style>
