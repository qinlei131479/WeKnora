<template>
  <div>
    <el-tree ref="treeRef" :data="props.data" :default-expand-all="props.defaultExpandAll"
      :expand-on-click-node="props.expandOnClickNode" v-bind="$attrs" class="dept-tree" @node-click="handleNodeClick">
      <template #default="{ node, data }">
        <div class="custom-tree-node">
          <span class="custom-label">{{ node.label }}</span>
          <div class="flex items-center gap-1">
            <el-checkbox @click.stop @change="handleCheckboxClick(data)" v-model="data.checked" />
            <el-button class="mini-btn" @click.stop="handleSubClick(data)">子</el-button>
            <!-- <el-link underline="never">子</el-link> -->
          </div>
        </div>
      </template>
    </el-tree>
  </div>
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
})

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
</script>
<style scoped lang="scss">
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
