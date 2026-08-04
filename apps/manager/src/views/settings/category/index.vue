<template>
  <my-page class="category-settings-my-page">
    <section class="category-settings-page">
      <page-name class="page-name">
        <template #subtitle> 配置全局的业务领域和层级细分类目。 </template>
      </page-name>

      <div class="category-tree-panel" :class="{ 'is-editing': addingParentId !== null || editingId !== null }">
        <el-tree
          ref="treeRef"
          class="category-tree"
          :class="{ 'is-editing': addingParentId !== null || editingId !== null }"
          :data="treeData"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :indent="18"
          :props="treeProps"
        >
          <template #default="{ node, data }">
            <div v-if="isAppendRow(data)" class="add-node-row" :class="{ 'is-active': addingParentId === data.parentId }" @click.stop>
              <template v-if="addingParentId === data.parentId">
                <el-input
                  ref="addInputRef"
                  v-model="addLabel"
                  class="node-input"
                  maxlength="255"
                  show-word-limit
                  placeholder="请输入子类目名称"
                  @keyup.enter="apiInsert(data.parentId)"
                  @keyup.esc="cancelAdd"
                />
                <button
                  type="button"
                  class="inline-action-button inline-action-button--confirm"
                  title="确定"
                  aria-label="确定"
                  @click="apiInsert(data.parentId)"
                >
                  <Check />
                </button>
                <button type="button" class="inline-action-button inline-action-button--cancel" title="取消" aria-label="取消" @click="cancelAdd">
                  <X />
                </button>
              </template>
              <button v-else class="add-child-button" type="button" @click.stop="startAdd(data.parentId)">
                <Plus />
                <span>添加子类目</span>
              </button>
            </div>

            <div
              v-else
              class="category-node-row"
              :class="{
                'is-active': editingId === data.id,
                'is-root': node.level === 1,
                'is-card-heading': node.level === 2
              }"
              @click.stop="editingId === data.id ? undefined : toggleNode(data.id)"
            >
              <template v-if="editingId === data.id">
                <el-input
                  ref="editInputRef"
                  v-model="editLabel"
                  class="node-input"
                  maxlength="255"
                  show-word-limit
                  placeholder="请输入类目名称"
                  @keyup.enter="apiUpdate(data.id)"
                  @keyup.esc="cancelEdit"
                />
                <button
                  type="button"
                  class="inline-action-button inline-action-button--confirm"
                  title="确定"
                  aria-label="确定"
                  @click.stop="apiUpdate(data.id)"
                >
                  <Check />
                </button>
                <button
                  type="button"
                  class="inline-action-button inline-action-button--cancel"
                  title="取消"
                  aria-label="取消"
                  @click.stop="cancelEdit"
                >
                  <X />
                </button>
              </template>
              <template v-else>
                <span class="node-label-wrap">
                  <span class="node-label" :title="data.name">{{ data.name }}</span>
                  <el-tag v-if="data.builtInFlag === 1" class="preset-tag" type="primary2" effect="light" size="small"> 系统预设 </el-tag>
                </span>
                <span class="node-actions">
                  <el-button
                    v-if="data.builtInFlag !== 1"
                    link
                    class="node-action-button"
                    :icon="PencilLine"
                    title="编辑"
                    aria-label="编辑"
                    @click.stop="startEdit(data.id, data.name)"
                  />
                  <el-button
                    v-if="data.builtInFlag !== 1"
                    link
                    class="node-action-button node-action-button--delete"
                    :icon="Trash2"
                    title="删除"
                    aria-label="删除"
                    @click.stop="apiDelete(data.id)"
                  />
                </span>
              </template>
            </div>
          </template>
        </el-tree>
      </div>
    </section>
  </my-page>
</template>

<script setup lang="ts">
import { Check, PencilLine, Plus, Trash2, X } from 'lucide-vue-next';
import { ElMessage, ElMessageBox } from 'element-plus';
import { agiCategory } from '@/api/agi';
import type { CategoryVO } from '@/types';

const ADD_CATEGORY_ID_BASE = -1000000000;

type CategoryTreeNode = {
  level: number;
};

const categories = ref<CategoryVO[]>([]);
const treeRef = ref();
const addingParentId = ref<number | null>(null);
const addLabel = ref('');
const addInputRef = ref();
const editingId = ref<number | null>(null);
const editLabel = ref('');
const editInputRef = ref();

// 创建空白类目
const emptyCategory = (id: number, parentId: number, name: string): CategoryVO => ({
  createBy: '',
  createTime: '',
  updateBy: '',
  updateTime: '',
  id,
  parentId,
  name,
  builtInFlag: 0,
  delFlag: 0,
  childrenList: undefined
});

// 判断是否【添加子类目】行
const isAppendRow = (item: CategoryVO) => item.id !== undefined && item.id <= ADD_CATEGORY_ID_BASE;

// 给 Element Plus 树节点附加分层样式类
const getCategoryNodeClass = (data: CategoryVO, node: CategoryTreeNode) => {
  const appendRow = isAppendRow(data);
  return {
    'category-root-node': node.level === 1 && !appendRow,
    'category-card-node': node.level === 2 && !appendRow,
    'category-detail-node': node.level > 2 && !appendRow,
    'category-append-node': appendRow,
    'category-root-append-node': appendRow && node.level === 2
  };
};

const treeProps = {
  children: 'childrenList',
  label: 'name',
  class: getCategoryNodeClass
};

// 树节点收起/展开
const toggleNode = (id?: number) => {
  if (id === undefined) {
    return;
  }
  const node = treeRef.value?.getNode?.(id);
  if (node) {
    node.expanded = !node.expanded;
  }
};

// 创建【添加子类目】行
const createAppendRow = (parentId: number): CategoryVO => emptyCategory(ADD_CATEGORY_ID_BASE - parentId, parentId, '添加子类目');

// 递归组装树绑定数据
const combTreeData = (items: CategoryVO[]): CategoryVO[] => {
  return items.map((item: CategoryVO) => ({
    ...item,
    childrenList: [...combTreeData(item.childrenList || []), createAppendRow(item.id ?? 0)]
  }));
};

const treeData = computed<CategoryVO[]>(() => combTreeData(categories.value));

const focusInput = (inputRef: unknown) => {
  const target = Array.isArray(inputRef) ? inputRef[0] : inputRef;
  (target as { focus?: () => void } | undefined)?.focus?.();
};

// UI添加：开始
const startAdd = (parentId?: number) => {
  if (!parentId) {
    return;
  }

  cancelEdit();
  addingParentId.value = parentId;
  addLabel.value = '';
  nextTick(() => focusInput(addInputRef.value));
};

// UI添加：取消
const cancelAdd = () => {
  addingParentId.value = null;
  addLabel.value = '';
};

// UI修改：开始
const startEdit = (categoryId?: number, name?: string) => {
  if (categoryId === undefined) {
    return;
  }
  cancelAdd();
  editingId.value = categoryId;
  editLabel.value = name || '';
  nextTick(() => focusInput(editInputRef.value));
};

// UI修改：取消
const cancelEdit = () => {
  editingId.value = null;
  editLabel.value = '';
};

// API: 新增
const apiInsert = (parentId?: number) => {
  if (!parentId) {
    return;
  }
  const name = addLabel.value.trim();
  if (!name) {
    ElMessage.warning('请输入子类目名称');
    return;
  }

  const appendToChildrenList = (items: CategoryVO[], addItem: CategoryVO) => {
    for (const item of items) {
      if (item.id === addItem.parentId) {
        item.childrenList = [...(item.childrenList || []), addItem];
        return;
      }
      appendToChildrenList(item.childrenList || [], addItem);
    }
  };

  agiCategory
    .insert({ parentId, name })
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      if (!res.data) {
        return Promise.reject('添加子类目失败');
      }
      return res.data as CategoryVO;
    })
    .then((resItem) => {
      appendToChildrenList(categories.value, resItem);
      ElMessage.success('添加子类目成功');
      cancelAdd();
    })
    .catch((err) => {
      console.error('--> --> 添加子类目失败', err);
    });
};

// API: 更新
const apiUpdate = (id?: number) => {
  if (id === undefined) {
    return;
  }
  const name = editLabel.value.trim();
  if (!name) {
    ElMessage.warning('请输入类目名称');
    return;
  }

  const refreshCategoryName = (items: CategoryVO[], editItem: CategoryVO) => {
    for (const item of items) {
      if (item.id === editItem.id) {
        item.name = editItem.name;
        return;
      }
      refreshCategoryName(item.childrenList || [], editItem);
    }
  };

  agiCategory
    .update({ id, name })
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      if (!res.data) {
        return Promise.reject('修改子类目失败');
      }
      return res.data as CategoryVO;
    })
    .then((resItem) => {
      refreshCategoryName(categories.value, resItem);
      ElMessage.success('修改类目成功');
      cancelEdit();
    })
    .catch((err) => {
      console.error('--> --> 修改子类目失败', err);
    });
};

// API: 删除
const apiDelete = async (id?: number) => {
  if (id === undefined) {
    return;
  }

  const removeItem = (items: CategoryVO[]) => {
    const index = items.findIndex((item: CategoryVO) => item.id === id);
    if (index > -1) {
      if (items[index].childrenList?.length) {
        ElMessage.warning('所选分类已包含子类目，不可删除');
        return;
      }

      agiCategory
        .deleteById(id)
        .then((res) => {
          if (res.code !== 200) {
            return Promise.reject(res.msg);
          }
        })
        .then(() => {
          items.splice(index, 1);
          ElMessage.success('删除类目成功');
          cancelEdit();
        })
        .catch((err) => {
          console.error('--> --> 删除类目失败', err);
        });
    }

    for (const item of items) {
      removeItem(item.childrenList || []);
    }
  };

  try {
    await ElMessageBox.confirm('确定要删除吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }

  removeItem(categories.value);
};

// API: 获取树
const apiTree = () => {
  agiCategory
    .tree()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      categories.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取类目树失败', err);
    });
};

onMounted(apiTree);
</script>

<style lang="scss" scoped>
.category-settings-my-page {
  width: 100%;

  :deep(.my-page-content) {
    min-width: 0;
  }

  .page-name {
    margin-bottom: 20px;

    :deep(.page-name-left) {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: 8px;
      row-gap: 7px;
      align-items: center;

      .svg-icon {
        grid-column: 1;
        grid-row: 1;
        margin-right: 0;
        align-self: center;
      }

      .name-container {
        display: contents;
      }

      .name-text {
        grid-column: 2;
        grid-row: 1;
        line-height: 28px;
      }

      .subtitle-text {
        grid-column: 2;
        grid-row: 2;
        margin-top: 0;
      }
    }
  }
}

.category-settings-page {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  display: flex;
  min-width: 0;
  flex: none;
  align-items: center;
  margin-bottom: 18px;
}

.page-heading {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 12px;

  &__icon {
    width: 24px;
    height: 24px;
    flex: none;
    margin-top: 2px;
    color: var(--el-color-primary);
    stroke-width: 2;
  }

  &__text {
    min-width: 0;
  }

  h1 {
    margin: 0;
    color: #2b2f33;
    font-size: 20px;
    font-weight: bold;
    line-height: 28px;
  }

  p {
    margin: 6px 0 0;
    color: #77838f;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
  }
}

.category-tree-panel {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 20px 24px 24px;
  flex: 1;
  border: 0;
  border-radius: 24px;
  background: var(--el-color-white);
  overflow: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &.is-editing::after {
    position: absolute;
    z-index: 2;
    inset: 0;
    border-radius: 24px;
    background: var(--el-mask-color-extra-light);
    content: '';
    pointer-events: none;
  }
}

.category-tree {
  position: relative;
  z-index: 1;
  width: 100%;
  background: transparent;

  :deep(.el-tree-node__expand-icon) {
    display: none;
  }

  :deep(.el-tree-node__content) {
    box-sizing: border-box;
    height: auto;
    min-height: 30px;
    background: transparent;
  }

  :deep(.el-tree-node__content:hover),
  :deep(.el-tree-node:focus > .el-tree-node__content) {
    background: transparent;
  }

  :deep(.category-root-node) {
    margin-bottom: 20px;
  }

  :deep(.category-root-node:last-child) {
    margin-bottom: 0;
  }

  :deep(.category-root-node > .el-tree-node__content) {
    min-height: 36px;
    padding-left: 0 !important;
  }

  :deep(.category-root-node > .el-tree-node__children) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  :deep(.category-card-node) {
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: var(--el-color-white);
    overflow: hidden;
  }

  :deep(.category-card-node > .el-tree-node__content) {
    min-height: 44px;
    padding-left: 16px !important;
    border-bottom: 1px solid #e1e6ec;
  }

  :deep(.category-card-node > .el-tree-node__children) {
    padding: 6px 0 10px;
  }

  :deep(.category-root-append-node > .el-tree-node__content) {
    min-height: 30px;
    padding-left: 16px !important;
  }

  :deep(.category-append-node:not(.category-root-append-node) > .el-tree-node__content) {
    min-height: 28px;
  }

  &.is-editing {
    z-index: 3;

    :deep(.el-tree-node__content) {
      pointer-events: none;
    }

    .category-node-row,
    .add-node-row {
      opacity: 0.35;
    }

    .category-node-row.is-active,
    .add-node-row.is-active {
      opacity: 1;
      pointer-events: auto;
    }

    :deep(.el-tree-node__content:has(.category-node-row.is-active)),
    :deep(.el-tree-node__content:has(.add-node-row.is-active)) {
      background: var(--el-color-white);
      pointer-events: auto;
    }
  }
}

.category-node-row,
.add-node-row {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 30px;
  align-items: center;
  gap: 8px;
  padding: 2px 16px 2px 0;
}

.category-node-row {
  &:not(.is-root, .is-card-heading):hover {
    .node-label {
      color: var(--el-color-primary);
    }
  }

  &.is-root {
    min-height: 36px;
    padding: 0;

    .node-label {
      font-size: 14px;
      font-weight: bold;
    }
  }

  &.is-card-heading {
    min-height: 44px;
    padding-top: 0;
    padding-bottom: 0;

    .node-label {
      font-size: 14px;
      font-weight: bold;
    }
  }
}

.node-label-wrap {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.node-label {
  min-width: 0;
  overflow: hidden;
  color: #2b2f33;
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.preset-tag.el-tag {
  --el-tag-bg-color: #e3f3f5;
  --el-tag-border-color: #bbdfe8;
  --el-tag-text-color: var(--el-color-primary);

  height: 24px;
  flex: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
}

.node-actions {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.node-action-button.el-button {
  width: 28px;
  height: 28px;
  margin-left: 0;
  padding: 0;
  color: #77838f;

  :deep(.el-icon) {
    font-size: 16px;
  }

  &:hover,
  &:focus {
    color: var(--el-color-primary);
  }

  &--delete:hover,
  &--delete:focus {
    color: var(--el-color-danger);
  }
}

.node-input {
  width: 0;
  min-width: 160px;
  height: 32px;
  flex: 1 1 0;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.edit-row-action.el-button {
  height: 28px;
  margin-left: 0;
  padding: 0 4px;
  font-size: 12px;
}

.add-child-button {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  line-height: 28px;

  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2;
  }

  &:hover {
    color: var(--el-color-primary-dark-2);
  }
}

.inline-action-button {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition:
    filter 0.2s ease,
    background-color 0.2s ease;

  svg {
    width: 15px;
    height: 15px;
    stroke-width: 2.4;
  }

  &:hover {
    filter: brightness(0.96);
  }

  &--confirm {
    background: var(--el-color-success);
    color: var(--el-color-white);
  }

  &--cancel {
    background: #f1f3f5;
    color: var(--el-color-danger);
  }
}
</style>
