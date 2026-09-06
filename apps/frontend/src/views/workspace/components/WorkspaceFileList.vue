<template>
  <FileBrowserTable
    class="workspace-file-list"
    :rows="entries"
    :columns="columns"
    row-key="path"
    :selected-key="selectedPath"
    :row-class-name="rowClassName"
    :loading="loading"
    :breadcrumbs="resolvedBreadcrumbItems"
    :root-label="rootLabel"
    :pagination="pagination"
    :selection="tableSelection"
    :empty-text="t('workspacePage.emptyFolder')"
    @open-row="(entry) => $emit('select-entry', entry)"
    @breadcrumb-click="handleBreadcrumbClick"
    @page-change="(payload) => $emit('page-change', payload)"
  >
    <template #toolbar-actions>
      <span class="entry-count">{{ entryCountText }}</span>
      <t-tooltip v-if="!readonly" :content="t('workspacePage.multiSelect')">
        <t-button
          size="small"
          variant="outline"
          :theme="effectiveSelectionMode ? 'primary' : 'default'"
          :aria-label="t('workspacePage.multiSelect')"
          @click="toggleSelectionMode"
        >
          <ListChecks :size="14" />
        </t-button>
      </t-tooltip>
      <t-button
        v-if="effectiveSelectionMode"
        size="small"
        theme="danger"
        :disabled="!selectedPaths.length"
        :loading="deletingPaths.length > 0"
        @click="$emit('delete-selected')"
      >
        {{ t('workspacePage.deleteSelected') }}
      </t-button>
    </template>

    <template #name="{ row }">
      <span class="name-cell">
        <FileTypeIcon :name="row.name || row.path" :is-dir="row.is_dir" :size="17" />
        <span class="entry-name" :title="row.title || row.name">{{ row.title || row.name }}</span>
      </span>
    </template>

    <template #cell-size="{ row }">
      <span>{{ row.is_dir ? '-' : formatFileSize(row.size) }}</span>
    </template>

    <template #cell-modified_at="{ row }">
      <span class="modified-at">{{ formatDateTime(row.modified_at) }}</span>
    </template>

    <template #row-actions="{ row }">
      <t-dropdown v-if="!row.is_dir || (!readonly && !row.readonly)" trigger="click" attach="body">
        <button
          type="button"
          class="more-action"
          :disabled="isDeleting(row.path)"
          :aria-label="t('workspacePage.moreActions')"
          @click.stop
        >
          <MoreHorizontal :size="16" />
        </button>
        <template #dropdown>
          <t-dropdown-menu>
            <t-dropdown-item v-if="!row.is_dir" @click="$emit('download-entry', row)">
              <span class="menu-item-content">
                <Download :size="14" />
                <span>{{ t('harness.chat.download') }}</span>
              </span>
            </t-dropdown-item>
            <t-dropdown-item
              v-if="!readonly && !row.readonly"
              theme="error"
              @click="$emit('delete-entry', row)"
            >
              <span class="menu-item-content">
                <Trash2 :size="14" />
                <span>{{ t('harness.chat.delete') }}</span>
              </span>
            </t-dropdown-item>
          </t-dropdown-menu>
        </template>
      </t-dropdown>
    </template>
  </FileBrowserTable>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ListChecks, MoreHorizontal, Trash2 } from 'lucide-vue-next'
import FileBrowserTable from '@harness/components/common/FileBrowserTable.vue'
import FileTypeIcon from '@harness/components/common/FileTypeIcon.vue'
import { formatFileSize } from '@harness/utils/file_utils'
import { formatDateTime } from '@harness/utils/time'

const { t } = useI18n()

const props = defineProps({
  entries: { type: Array, default: () => [] },
  currentPath: { type: String, default: '/' },
  selectedPath: { type: String, default: '' },
  selectedPaths: { type: Array, default: () => [] },
  deletingPaths: { type: Array, default: () => [] },
  selectionMode: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  breadcrumbItems: { type: Array, default: null },
  rootLabel: { type: String, default: '' },
  pagination: { type: Object, default: null }
})

const emit = defineEmits([
  'select-entry',
  'select-path',
  'breadcrumb-click',
  'update:selectedPaths',
  'update:selectionMode',
  'delete-selected',
  'delete-entry',
  'download-entry',
  'page-change'
])

const columns = computed(() => [
  { title: t('workspacePage.name'), dataIndex: 'name', key: 'name', ellipsis: true },
  { title: t('workspacePage.size'), dataIndex: 'size', key: 'size', width: 86 },
  { title: t('workspacePage.modifiedAt'), dataIndex: 'modified_at', key: 'modified_at', width: 148 },
  {
    title: t('workspacePage.actions'),
    key: 'action',
    dataIndex: 'path',
    width: 88,
    align: 'center',
    ellipsis: false
  }
])

const deletingPathSet = computed(() => new Set(props.deletingPaths))
const entryPathSet = computed(() => new Set(props.entries.map((entry) => entry.path)))
const readonlyPathSet = computed(() =>
  new Set(props.entries.filter((entry) => entry.readonly).map((entry) => entry.path))
)
const normalizedCurrentPath = computed(() => (props.currentPath || '/').replace(/\/+$/, '') || '/')
const effectiveSelectionMode = computed(() => !props.readonly && props.selectionMode)
const entryCountText = computed(() => {
  if (props.pagination?.total !== undefined) {
    return t('workspacePage.itemCount', { count: props.pagination.total })
  }
  return t('workspacePage.itemCount', { count: props.entries.length })
})

const resolvedBreadcrumbItems = computed(() => {
  if (props.breadcrumbItems?.length) return props.breadcrumbItems

  const normalizedPath = normalizedCurrentPath.value
  const rootName = props.rootLabel || t('workspacePage.rootLabel')
  if (normalizedPath === '/') {
    return [{ name: rootName, path: '/' }]
  }

  const segments = normalizedPath.split('/').filter(Boolean)
  return segments.reduce(
    (items, segment) => {
      const parentPath = items[items.length - 1].path
      const path = parentPath === '/' ? `/${segment}` : `${parentPath}/${segment}`
      items.push({ name: segment, path })
      return items
    },
    [{ name: rootName, path: '/' }]
  )
})

const tableSelection = computed(() => {
  if (!effectiveSelectionMode.value) return null

  return {
    selectedRowKeys: props.selectedPaths,
    getCheckboxProps: (row) => ({ disabled: row.readonly || isDeleting(row.path) }),
    onChange: (keys) => {
      emit(
        'update:selectedPaths',
        keys.filter((path) => entryPathSet.value.has(path) && !readonlyPathSet.value.has(path))
      )
    }
  }
})

const isDeleting = (path) => deletingPathSet.value.has(path)

const rowClassName = (entry) => (isDeleting(entry.path) ? 'is-deleting' : '')

const toggleSelectionMode = () => {
  if (props.readonly) return
  const nextMode = !props.selectionMode
  emit('update:selectionMode', nextMode)
  if (!nextMode) {
    emit('update:selectedPaths', [])
  }
}

const handleBreadcrumbClick = ({ item, index }) => {
  emit('breadcrumb-click', { item, index })
  emit('select-path', item.path)
}
</script>

<style scoped lang="less">
.workspace-file-list {
  min-width: 0;
  min-height: 0;
}

.entry-count {
  flex: 0 0 auto;
  color: var(--gray-500);
  font-size: 12px;
}

.name-cell {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  gap: 8px;
  vertical-align: middle;
}

.entry-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modified-at {
  white-space: nowrap;
}

.more-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--gray-500);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--gray-100);
    color: var(--gray-900);
  }

  &:disabled {
    color: var(--gray-300);
    cursor: not-allowed;
  }
}

.menu-item-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
