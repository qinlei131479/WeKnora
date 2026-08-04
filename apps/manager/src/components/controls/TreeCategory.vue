<template>
  <el-card shadow="never" class="category-panel" header-class="category-panel__header" body-class="category-panel__body">
    <template #header>
      <div class="category-header">
        <svg-icon icon-class="tree-category" color="var(--el-color-primary)" className="category-header__icon" />
        <span>{{ props.title }}</span>
      </div>
    </template>

    <div class="category-scroll-body">
      <el-tree
        :data="nodesAll"
        :props="treeProps"
        :current-node-key="modelValue"
        :default-expanded-keys="defaultExpandedKeys"
        :icon="ArrowRight"
        node-key="id"
        highlight-current
        class="category-tree"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div
            class="tree-node"
            :class="{
              'tree-node--leaf': node.isLeaf,
              'tree-node--root': node.level === 1
            }"
          >
            <span>{{ data.name }}</span>
          </div>
        </template>
      </el-tree>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue';
import type { CategoryVO } from '@/types';

defineOptions({
  name: 'TreeCategory'
});

type TreeNode = CategoryVO | { id: number; idPath: string; name: string };

const ALL_CATEGORY: TreeNode = {
  id: -9999,
  idPath: '',
  name: '全部分类'
};

const props = withDefaults(
  defineProps<{
    modelValue: number;
    categories: CategoryVO[];
    title?: string;
  }>(),
  {
    title: '全部分类'
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  select: [value: TreeNode];
}>();

const treeProps = {
  label: 'name',
  children: 'childrenList'
};

const nodesAll = computed<TreeNode[]>(() => [ALL_CATEGORY, ...props.categories]);

const defaultExpandedKeys = computed(() => nodesAll.value.map((item: TreeNode) => item.id));

const handleNodeClick = (node: TreeNode) => {
  emit('update:modelValue', node.id);
  emit('select', node);
};
</script>

<style lang="scss" scoped>
:global(.category-panel > .el-card__header) {
  padding: 24px 20px 12px !important;
}

:global(.category-panel > .el-card__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 12px 20px !important;
  overflow: hidden;
}

.category {
  &-panel {
    display: flex;
    height: 100%;
    min-height: 0;
    width: 280px;
    flex: none;
    flex-direction: column;
    overflow: hidden;
    border-width: 0;
    border-radius: 24px;
  }

  &-scroll-body {
    min-height: 0;
    flex: 1;
    overflow: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &-tree {
    padding: 0;

    :deep(.el-tree-node__content) {
      height: 36px;
      background-color: transparent !important;
      margin-bottom: 4px;
    }

    :deep(.el-tree-node__expand-icon) {
      position: relative;
      z-index: 1;
    }

    :deep(.el-tree-node:not(.is-current) > .el-tree-node__content:hover .tree-node),
    :deep(.el-tree-node:focus:not(.is-current) > .el-tree-node__content .tree-node) {
      --tree-node-background-color: var(--el-tree-node-hover-bg-color);
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content .tree-node) {
      --tree-node-background-color: var(--el-color-primary-light-9);

      color: var(--el-color-primary);
      font-weight: 700;
    }
  }
}

.category-header {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;

  &__icon {
    width: 24px;
    height: 24px;
    flex: none;
  }
}
.tree-node {
  --tree-node-background-color: transparent;

  position: relative;
  z-index: 0;
  display: flex;
  min-width: 0;
  flex: 1;
  align-self: stretch;
  align-items: center;
  isolation: isolate;
  color: #2b2f33;
  font-size: 14px;
  font-weight: 400;

  &::before {
    position: absolute;
    z-index: -1;
    inset: 0 0 0 -24px;
    border-radius: 12px;
    background-color: var(--tree-node-background-color);
    content: '';
  }
  &--leaf {
    color: #77838f;
    font-size: 13px;
  }

  &--root {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
  }


  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 992px) {
  .category {
    &-panel {
      width: 100%;
      height: auto;
      max-height: 360px;
    }
  }
}
</style>
