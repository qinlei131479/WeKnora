<template>
  <section class="file-browser-table-shell">
    <div class="file-browser-header">
      <div class="file-browser-path">
        <slot name="toolbar-left">
          <nav class="file-browser-breadcrumbs" :aria-label="t('workspacePage.filePath')">
            <button
              v-for="(item, index) in resolvedBreadcrumbs"
              :key="item.key || item.path || item.name || index"
              type="button"
              class="file-browser-breadcrumb-item"
              :class="{ active: isCurrentBreadcrumb(index) }"
              :disabled="isBreadcrumbDisabled(item, index)"
              :title="item.title || item.path || item.name"
              @click="handleBreadcrumbClick(item, index)"
            >
              <span class="file-browser-breadcrumb-label">{{ item.name || resolvedRootLabel }}</span>
            </button>
            <slot name="breadcrumb-suffix" />
          </nav>
        </slot>
      </div>

      <div class="file-browser-actions">
        <slot name="toolbar-actions" />
        <t-tooltip v-if="refreshable" :content="t('workspacePage.refresh')">
          <t-button
            variant="text"
            shape="square"
            class="file-browser-icon-button"
            :loading="refreshing"
            :aria-label="t('workspacePage.refresh')"
            @click="$emit('refresh')"
          >
            <template #icon><RotateCw :size="16" /></template>
          </t-button>
        </t-tooltip>
      </div>
    </div>

    <slot name="before-table" />

    <div class="file-browser-td-table">
    <t-table
      :columns="tableColumns"
      :data="rows"
      :row-key="resolvedRowKey"
      :loading="loading"
      :pagination="tablePagination"
      :selected-row-keys="selectedRowKeys"
      :reserve-selected-row-on-paginate="reserveSelectedRowOnPaginate"
      :row-class-name="resolveRowClassNameTd"
      :row-attributes="resolveRowAttributes"
      :bordered="false"
      size="small"
      @select-change="handleSelectChange"
      @change="handleTableChange"
    >
      <template #empty>
        <slot name="empty">
          <t-empty :description="resolvedEmptyText" />
        </slot>
      </template>
    </t-table>
    </div>
  </section>
</template>

<script setup>
import { computed, h, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import { RotateCw } from 'lucide-vue-next'
import FileTypeIcon from '@/components/harness/common/FileTypeIcon.vue'

const { t } = useI18n()
const slots = useSlots()

const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  breadcrumbs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  rowKey: { type: [String, Function], default: 'key' },
  selectedKey: { type: [String, Number], default: '' },
  rowClickable: { type: Boolean, default: true },
  rowClassName: { type: [String, Function], default: '' },
  pagination: { type: Object, default: null },
  selection: { type: Object, default: null },
  emptyText: { type: String, default: '' },
  rootLabel: { type: String, default: '' },
  refreshable: { type: Boolean, default: false },
  refreshing: { type: Boolean, default: false }
})

const emit = defineEmits([
  'open-row',
  'breadcrumb-click',
  'update:selectedKeys',
  'page-change',
  'table-change',
  'refresh'
])

const resolvedEmptyText = computed(() => props.emptyText || t('workspacePage.emptyFolder'))
const resolvedRootLabel = computed(() => props.rootLabel || t('harness.chat.file'))

const resolvedBreadcrumbs = computed(() => {
  if (props.breadcrumbs.length) return props.breadcrumbs
  return [{ key: 'root', name: resolvedRootLabel.value, path: '/' }]
})

// TDesign's `row-key` prop only accepts a field-name string (unlike antd,
// which also allowed a resolver function). The `rowKey` prop stays
// `[String, Function]` for API compatibility with existing/future callers,
// but a function value can only be used internally (see `resolveRowKey`)
// and falls back to `'key'` for the value actually handed to `<t-table>`.
const resolvedRowKey = computed(() => (typeof props.rowKey === 'string' ? props.rowKey : 'key'))

const resolveRowKey = (row) => {
  if (typeof props.rowKey === 'function') return props.rowKey(row)
  return row?.[props.rowKey]
}

const tablePagination = computed(() => {
  if (!props.pagination) return null
  const { showSizeChanger, pageSizeOptions, ...rest } = props.pagination
  return {
    size: 'small',
    ...rest,
    ...(showSizeChanger !== undefined ? { showPageSize: showSizeChanger } : {}),
    ...(pageSizeOptions
      ? { pageSizeOptions: pageSizeOptions.map((option) => (typeof option === 'string' ? Number(option) : option)) }
      : {})
  }
})

// TDesign models row selection as a dedicated checkbox column (`type:
// 'multiple'`) plus table-level `selected-row-keys` / `@select-change`,
// rather than antd's single `row-selection` config object. The public
// `selection` prop keeps its antd-shaped API (selectedRowKeys/selectedKeys,
// getCheckboxProps, onChange, disabledKeys, preserveSelectedRowKeys) and is
// translated into that shape here. Note: antd's `hideSelectAll` has no
// direct TDesign equivalent and is not currently applied by any caller.
const rowSelectionColumn = computed(() => {
  if (!props.selection) return null

  const disabledKeys = new Set(props.selection.disabledKeys || [])
  const getCheckboxProps = props.selection.getCheckboxProps

  return {
    colKey: 'row-select',
    type: 'multiple',
    width: 44,
    checkProps: ({ row }) => {
      if (typeof getCheckboxProps === 'function') {
        return getCheckboxProps(row)
      }
      return { disabled: disabledKeys.has(resolveRowKey(row)) }
    }
  }
})

const selectedRowKeys = computed(() => {
  if (!props.selection) return undefined
  return props.selection.selectedRowKeys || props.selection.selectedKeys || []
})

const reserveSelectedRowOnPaginate = computed(() => Boolean(props.selection?.preserveSelectedRowKeys))

const handleSelectChange = (keys, context) => {
  if (!props.selection) return
  if (typeof props.selection.onChange === 'function') {
    props.selection.onChange(keys, context?.selectedRowData || [], context)
  }
  emit('update:selectedKeys', keys)
}

const resolveRowName = (row) => row?.name || row?.filename || row?.displayName || ''

const resolveRowIsDir = (row) => Boolean(row?.isDir ?? row?.is_dir ?? row?.is_folder)

const columnKey = (column) => column?.key || column?.dataIndex || ''

const cellSlotName = (column) => `cell-${columnKey(column)}`

const isNameColumn = (column) => ['name', 'filename'].includes(columnKey(column))

const isStatusColumn = (column) => columnKey(column) === 'status'

const isActionColumn = (column) => ['action', 'actions'].includes(columnKey(column))

// Mirrors the previous antd `<template #bodyCell>` dispatch: prefer a
// caller-provided `cell-<key>` slot, otherwise fall back to the well-known
// `name` / `status` / `row-actions` slots, otherwise render the raw text.
const renderCell = (column, row, rowIndex) => {
  const dataIndex = column.dataIndex || columnKey(column)
  const text = row?.[dataIndex]
  const scope = { row, record: row, column, text, index: rowIndex }

  const genericSlot = slots[cellSlotName(column)]
  if (genericSlot) return genericSlot(scope)

  if (isNameColumn(column)) {
    if (slots.name) return slots.name(scope)
    return h('span', { class: 'file-browser-default-name' }, [
      h(FileTypeIcon, { name: resolveRowName(row), isDir: resolveRowIsDir(row) }),
      h('span', { class: 'file-browser-name-text', title: resolveRowName(row) }, resolveRowName(row))
    ])
  }

  if (isStatusColumn(column)) {
    if (slots.status) return slots.status(scope)
    return text || '-'
  }

  if (isActionColumn(column)) {
    return h(
      'div',
      { class: 'file-browser-row-actions', onClick: (event) => event.stopPropagation() },
      slots['row-actions']?.({ row, record: row, index: rowIndex })
    )
  }

  return text ?? '-'
}

// TDesign columns use `colKey` (not antd's `dataIndex`/`key`) and render
// custom cell content via a per-column `cell` function rather than a
// dispatched `<template #bodyCell>` slot. Columns still arrive from the
// parent in antd shape (`title`/`dataIndex`/`key`/`width`/`align`/
// `ellipsis`) and are transformed here via computed so the parent
// (WorkspaceFileList.vue) doesn't need to change.
const tableColumns = computed(() => {
  const cols = props.columns.map((column) => ({
    ...column,
    colKey: columnKey(column),
    cell: (_h, { row, rowIndex }) => renderCell(column, row, rowIndex)
  }))
  return rowSelectionColumn.value ? [rowSelectionColumn.value, ...cols] : cols
})

const isCurrentBreadcrumb = (index) => index === resolvedBreadcrumbs.value.length - 1

const isBreadcrumbDisabled = (item, index) => Boolean(item.disabled || isCurrentBreadcrumb(index))

const handleBreadcrumbClick = (item, index) => {
  if (isBreadcrumbDisabled(item, index)) return
  emit('breadcrumb-click', { item, index })
}

const resolveRowClassName = (row, index) => {
  const classes = []
  if (props.rowClickable) classes.push('file-browser-row-clickable')
  if (props.selectedKey && String(resolveRowKey(row)) === String(props.selectedKey)) {
    classes.push('file-browser-row-selected')
  }

  if (typeof props.rowClassName === 'function') {
    const customClass = props.rowClassName(row, index)
    if (customClass) classes.push(customClass)
  } else if (props.rowClassName) {
    classes.push(props.rowClassName)
  }

  return classes.join(' ')
}

// TDesign passes a single `{ row, rowIndex }` params object to
// `row-class-name` instead of antd's `(row, index)` positional arguments.
const resolveRowClassNameTd = ({ row, rowIndex }) => resolveRowClassName(row, rowIndex)

const isInteractiveTarget = (event) => {
  return Boolean(
    event.target?.closest?.('button,a,input,textarea,select,[role="button"],.t-checkbox,.t-dropdown,.t-popup')
  )
}

// TDesign has no direct equivalent of antd's `customRow`; the same
// click/keydown-driven row activation is reproduced via the `row-attributes`
// prop, whose returned object is spread directly onto the rendered `<tr>`.
const resolveRowAttributes = ({ row, rowIndex }) => {
  if (!props.rowClickable) return {}

  return {
    tabindex: 0,
    onClick: (event) => {
      if (isInteractiveTarget(event)) return
      emit('open-row', row, rowIndex)
    },
    onKeydown: (event) => {
      if (event.key !== 'Enter') return
      if (isInteractiveTarget(event)) return
      event.preventDefault()
      emit('open-row', row, rowIndex)
    }
  }
}

// TDesign's `<t-table>` emits a single `@change` event (covering sorter,
// filter and pagination changes) instead of antd's `onChange(pagination,
// filters, sorter, extra)`. This preserves the same `table-change` /
// `page-change` external emit contract as before.
const handleTableChange = (data, context) => {
  const pagination = data?.pagination || null
  emit('table-change', { pagination, filters: data?.filter, sorter: data?.sorter, extra: context })

  if (!props.pagination || !pagination) return
  const current = pagination.current
  const pageSize = pagination.pageSize
  if (current === props.pagination.current && pageSize === props.pagination.pageSize) return

  emit('page-change', { page: current, pageSize, pagination, filters: data?.filter, sorter: data?.sorter, extra: context })
}
</script>

<style scoped lang="less">
.file-browser-table-shell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--gray-0);
  overflow: hidden;
}

.file-browser-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 0 14px;
  border-bottom: 1px solid var(--gray-100);
  flex: 0 0 auto;
}

.file-browser-path {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
}

.file-browser-breadcrumbs {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  font-size: 14px;
  line-height: 26px;
}

.file-browser-breadcrumb-item {
  display: inline-flex;
  align-items: center;
  max-width: 220px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--main-800);
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.16s ease;

  &::after {
    flex: 0 0 auto;
    content: '/';
    margin: 0 8px;
    color: var(--gray-300);
    font-weight: 400;
  }

  &:last-of-type::after {
    display: none;
  }

  &:hover:not(:disabled) {
    color: var(--main-600);
  }

  &.active,
  &:disabled {
    color: var(--gray-900);
    cursor: default;
  }
}

.file-browser-breadcrumb-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-browser-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  flex: 0 0 auto;
}

.file-browser-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  color: var(--gray-600);
  background: var(--gray-0);
  box-shadow: 0 0 0 1px var(--shadow-1);
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    background: var(--gray-50);
    color: var(--main-color);
    box-shadow: 0 0 0 1px var(--main-100);
  }
}

.file-browser-td-table {
  --td-component-border: #f3f3f3;
  --td-component-stroke: #f3f3f3;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 0 8px;
  background: var(--gray-0);
}

.file-browser-td-table :deep(.t-table) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  --td-component-border: #f3f3f3;
  --td-component-stroke: #f3f3f3;
}

.file-browser-td-table :deep(.t-table__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: var(--gray-0);
  border: none;
}

.file-browser-td-table :deep(th),
.file-browser-td-table :deep(td) {
  position: relative;
  border: none !important;
  border-bottom: 1px solid #f3f3f3 !important;
  box-shadow: none !important;
}

.file-browser-td-table :deep(th) {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 8px 10px;
  color: var(--gray-500);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
  background: var(--gray-0);
}

.file-browser-td-table :deep(td) {
  padding: 7px 10px;
  background: var(--gray-0);
  color: var(--gray-700);
  font-size: 13px;
  line-height: 20px;
  vertical-align: middle;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

.file-browser-td-table :deep(tbody tr.file-browser-row-clickable) {
  cursor: pointer;
}

.file-browser-td-table :deep(tbody tr:hover > td) {
  background: var(--main-20);
  color: var(--gray-1000);
}

.file-browser-td-table :deep(tbody tr.file-browser-row-selected > td) {
  background: var(--main-20);
  color: var(--gray-1000);
}

.file-browser-td-table :deep(tbody tr.is-deleting > td) {
  opacity: 0.62;
}

.file-browser-td-table :deep(.t-table__body tr:last-child td) {
  border-bottom: 0;
}

.file-browser-td-table :deep(.t-table__pagination) {
  margin: 10px 0;
  padding: 0 6px;
}

.file-browser-default-name {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  gap: 8px;
  vertical-align: middle;
}

.file-browser-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-browser-row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
}

@media (max-width: 767px) {
  .file-browser-header {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px;
  }

  .file-browser-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
