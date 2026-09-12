<template>
  <div class="file-tree-wrapper" :class="treeClass">
    <t-tree
      class="custom-file-tree"
      :data="treeData"
      :keys="treeKeys"
      :activable="true"
      :actived="selectedKeys"
      :expanded="expandedKeys"
      :icon="showIcon"
      :label="true"
      :line="showLine"
      :expand-on-click-node="false"
      :lazy="Boolean(loadData)"
      :load="loadData ? handleLoad : undefined"
      @active="handleActive"
    >
      <template #icon="{ node }">
        <span class="tree-node-icon" @click.stop>
          <slot name="icon" :node="node.data" :expanded="node.expanded">
            <template v-if="node.data.isLeaf">
              <FileTypeIcon v-if="useFileIcons" :name="node.data.key" :size="16" />
              <FileText v-else :size="16" class="file-icon" />
            </template>
            <template v-else>
              <span
                v-if="isNodeLoading(node.data.key)"
                class="folder-loading-icon"
                :aria-label="t('harness.chat.loading')"
              ></span>
              <FileTypeIcon v-else is-dir :size="18" />
            </template>
          </slot>
        </span>
      </template>

      <template #label="{ node }">
        <div class="tree-node-wrapper" @click="handleNodeClick(node.data)">
          <div class="tree-node-content">
            <slot name="title" :node="node.data">
              <span class="node-title-text" :title="node.data.title">{{ node.data.title }}</span>
            </slot>
          </div>
          <div v-if="$slots.actions" class="node-actions" @click.stop>
            <slot name="actions" :node="node.data"></slot>
          </div>
        </div>
      </template>
    </t-tree>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText } from 'lucide-vue-next'
import FileTypeIcon from '@/components/harness/common/FileTypeIcon.vue'

const props = defineProps({
  treeData: {
    type: Array,
    required: true,
    default: () => []
  },
  loadData: {
    type: Function,
    default: undefined
  },
  selectedKeys: {
    type: Array,
    default: () => []
  },
  expandedKeys: {
    type: Array,
    default: () => []
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  blockNode: {
    type: Boolean,
    default: true
  },
  showLine: {
    type: Boolean,
    default: false
  },
  treeClass: {
    type: String,
    default: ''
  },
  useFileIcons: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:selectedKeys',
  'update:expandedKeys',
  'select',
  'nodeClick',
  'toggleFolder'
])

const { t } = useI18n()
const treeKeys = { value: 'key', label: 'title' }
const loadingKeys = ref(new Set())

const setNodeLoading = (key, isLoading) => {
  const nextLoadingKeys = new Set(loadingKeys.value)
  if (isLoading) {
    nextLoadingKeys.add(key)
  } else {
    nextLoadingKeys.delete(key)
  }
  loadingKeys.value = nextLoadingKeys
}

const isNodeLoading = (key) => loadingKeys.value.has(key)

const handleActive = (selectedKeys, info) => {
  emit('update:selectedKeys', selectedKeys)
  emit('select', selectedKeys, { node: info?.node?.data })
}

// Same as the previous tree: title click toggles expand. TDesign then
// invokes `load` for unloaded folders (children === true) when expanding.
const handleLoad = async (node) => {
  const rawNode = node?.data
  if (!rawNode || rawNode.isLeaf || !props.loadData) return []

  const key = rawNode.key
  if (key) setNodeLoading(key, true)
  try {
    const result = await props.loadData(rawNode)
    return Array.isArray(result) ? result : []
  } finally {
    if (key) setNodeLoading(key, false)
  }
}

const handleNodeClick = (data) => {
  emit('nodeClick', data)

  const isFolder = data.isLeaf === false || Array.isArray(data.children) || data.children === true

  if (isFolder) {
    const key = data.key
    const newExpandedKeys = [...props.expandedKeys]
    const index = newExpandedKeys.indexOf(key)
    const expanding = index === -1

    if (index > -1) {
      newExpandedKeys.splice(index, 1)
    } else {
      newExpandedKeys.push(key)
    }

    emit('update:expandedKeys', newExpandedKeys)
    emit('toggleFolder', data, expanding)
  }
}
</script>

<style scoped lang="less">
.file-tree-wrapper {
  width: 100%;
  background: transparent;

  :deep(.t-tree),
  :deep(.t-tree__list) {
    background: transparent !important;
    color: var(--td-text-color-primary, var(--gray-900));
  }

  /* Do not set display/min-height on .t-tree__item.
     TDesign keeps collapsed children in the DOM as .t-tree__item--hidden
     (max-height: 0). A min-height here leaves the empty gap after collapse. */
  :deep(.t-tree__item) {
    align-items: center;
    width: 100%;

    .t-icon-caret-right-small,
    .t-fake-arrow {
      display: none;
    }

    .t-tree__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      margin-right: 4px;
      flex-shrink: 0;

      .t-icon {
        display: flex;
        align-items: center;
      }
    }

    .t-tree__label {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      height: 32px;
      line-height: 32px;
      margin-left: 0;
      padding: 0 4px;
      border-radius: 4px;
      background-color: transparent;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--gray-50);
      }
    }

    &.t-is-active .t-tree__label {
      background-color: var(--gray-100);
    }

    .t-tree__operations {
      flex-shrink: 0;
    }
  }

  :deep(.t-tree__item--hidden) {
    min-height: 0 !important;
    max-height: 0 !important;
  }
}

.tree-node-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.tree-node-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.node-title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--td-text-color-primary, var(--gray-800));
}

.folder-icon {
  color: var(--main-500);
  fill: var(--main-500);
  fill-opacity: 0.2;
}

.folder-loading-icon {
  width: 15px;
  height: 15px;
  border: 2px solid var(--gray-200);
  border-top-color: var(--main-500);
  border-radius: 50%;
  animation: file-tree-folder-loading 0.8s linear infinite;
}

@keyframes file-tree-folder-loading {
  to {
    transform: rotate(360deg);
  }
}

.node-actions {
  display: none;
  align-items: center;
  padding-left: 8px;
  flex-shrink: 0;
}

.tree-node-wrapper:hover .node-actions {
  display: flex;
}
</style>
