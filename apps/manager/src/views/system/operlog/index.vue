<template>
  <section class="operlog-page">
    <page-name class="page-name" title="操作日志" />

    <div class="search-bar">
      <div class="search-bar__fields">
        <div class="search-bar__field">
          <el-input
            v-model="queryParams.operIp"
            clearable
            placeholder="请输入操作地址"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="search-bar__field">
          <el-input
            v-model="queryParams.title"
            clearable
            placeholder="请输入系统模块"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="search-bar__field">
          <el-input
            v-model="queryParams.operName"
            clearable
            placeholder="请输入操作人员"
            @keyup.enter="handleQuery"
          />
        </div>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.businessType" clearable placeholder="操作类型">
          <el-option v-for="dict in sys_oper_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="操作状态">
          <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <div class="search-bar__date-wrap">
        <el-date-picker
          v-model="dateRange"
          class="search-bar__date"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
        />
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>
    </div>

    <div class="operlog-content-card">
      <div class="table-wrap">
        <el-table
          ref="operlogRef"
          v-loading="loading"
          :data="operlogList"
          height="100%"
          class="operlog-table"
          :default-sort="defaultSort"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="日志编号" prop="operId" width="100" align="left" />
          <el-table-column label="系统模块" prop="title" min-width="140" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="操作类型" prop="businessType" width="100" align="center">
            <template #default="scope">
              <dict-tag :options="sys_oper_type" :value="scope.row.businessType" />
            </template>
          </el-table-column>
          <el-table-column label="请求方式" prop="requestMethod" width="90" align="left" />
          <el-table-column
            label="操作人员"
            prop="operName"
            min-width="110"
            align="left"
            :show-overflow-tooltip="true"
            sortable="custom"
            :sort-orders="['descending', 'ascending']"
          />
          <el-table-column label="操作地址" prop="operIp" min-width="130" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="操作状态" prop="status" width="100" align="center">
            <template #default="scope">
              <dict-tag :options="sys_common_status" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column
            label="操作日期"
            prop="operTime"
            min-width="170"
            align="left"
            sortable="custom"
            :sort-orders="['descending', 'ascending']"
          >
            <template #default="scope">
              <span>{{ parseTime(scope.row.operTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="消耗时间"
            prop="costTime"
            width="110"
            align="left"
            sortable="custom"
            :sort-orders="['descending', 'ascending']"
          >
            <template #default="scope">
              <span>{{ scope.row.costTime }}毫秒</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="left"
            header-align="left"
            width="80"
            fixed="right"
            class-name="action-column"
            label-class-name="action-column-header"
          >
            <template #default="scope">
              <div class="table-action-cell">
                <el-button
                  link
                  class="action-link action-link--primary"
                  @click="handleDetail(scope.row)"
                  v-hasPermi="['system:operlog:query']"
                >
                  详细
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-row">
        <pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>

    <operlog-detail v-model:visible="detailVisible" :row="detailRow" />
  </section>
</template>

<script setup lang="ts" name="Operlog">
import OperlogDetail from './detail.vue'
import { list, delOperlog, cleanOperlog } from '@/api/system/operlog'
import type { SysOperLog, OperlogQueryParams } from '@/types/api/system/operlog'
import { nextTick } from 'vue'

const { proxy } = getCurrentInstance()
const { sys_oper_type, sys_common_status } = proxy.useDict('sys_oper_type', 'sys_common_status')

const operlogList = ref<SysOperLog[]>([])
const operlogRef = ref()
const detailVisible = ref<boolean>(false)
const detailRow = ref<SysOperLog>({})
const loading = ref<boolean>(true)
const ids = ref<number[]>([])
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const dateRange = ref<string[]>([])
const defaultSort = ref({ prop: 'operTime', order: 'descending' })

const data = reactive({
  form: {} as SysOperLog,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    operIp: undefined,
    title: undefined,
    operName: undefined,
    businessType: undefined,
    status: undefined
  } as OperlogQueryParams
})

const { queryParams, form } = toRefs(data)

function getList() {
  loading.value = true
  list(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    operlogList.value = response.rows
    total.value = response.total
    loading.value = false
    nextTick(() => {
      operlogRef.value?.doLayout()
    })
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  dateRange.value = []
  queryParams.value.operIp = undefined
  queryParams.value.title = undefined
  queryParams.value.operName = undefined
  queryParams.value.businessType = undefined
  queryParams.value.status = undefined
  queryParams.value.pageNum = 1
  operlogRef.value?.sort(defaultSort.value.prop, defaultSort.value.order)
  handleQuery()
}

function handleSelectionChange(selection: SysOperLog[]) {
  ids.value = selection.map(item => item.operId!)
  multiple.value = !selection.length
}

function handleSortChange(column: any) {
  queryParams.value.orderByColumn = column.prop
  queryParams.value.isAsc = column.order
  getList()
}

function handleDetail(row: SysOperLog) {
  detailRow.value = row
  detailVisible.value = true
}

function handleDelete(row?: SysOperLog) {
  const operIds = row?.operId || ids.value
  proxy.$modal
    .confirm('是否确认删除日志编号为"' + operIds + '"的数据项?')
    .then(function () {
      return delOperlog(operIds)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

function handleClean() {
  proxy.$modal
    .confirm('是否确认清空所有操作日志数据项?')
    .then(function () {
      return cleanOperlog()
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('清空成功')
    })
    .catch(() => {})
}

function handleExport() {
  proxy.download(
    'system/operlog/export',
    {
      ...queryParams.value
    },
    `config_${new Date().getTime()}.xlsx`
  )
}

getList()
</script>

<style scoped lang="scss">
.operlog-page {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: calc(100vh - var(--navbar-height, 96px));
  flex-direction: column;
  padding: 40px 40px 20px;
  background: #ebf3f5;
  border-radius: 40px 0 0 0;
  overflow: hidden;
}

.page-name {
  margin-bottom: 40px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  &__fields {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 1068px;
    flex: none;
  }

  &__field {
    flex: 1;
    min-width: 0;
    margin-right: 8px;

    :deep(.el-input__wrapper) {
      min-height: 36px;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }

    :deep(.el-input__inner) {
      height: 36px;
      line-height: 36px;
      font-size: 14px;
      color: #303133;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  &__status {
    width: 160px;
    flex: none;
    margin-right: 8px;

    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-select__wrapper) {
      min-height: 36px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }
  }

  &__date-wrap {
    width: 326px;
    flex: none;

    :deep(.el-date-editor) {
      --el-date-editor-daterange-width: 326px;
      --el-date-editor-width: 326px;
      width: 326px !important;
      max-width: 326px !important;
      flex-grow: 0 !important;
    }

    :deep(.el-input__wrapper) {
      width: 100%;
      height: 36px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }
  }

  &__date {
    width: 100%;
  }

  &__reset {
    min-width: 76px;
    height: 36px;
    padding: 0 20px;
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: #ffffff;
    color: #77838f;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    margin-left: 8px;
    margin-right: 8px;

    &:hover {
      border-color: #3297a0;
      color: #3297a0;
    }
  }

  &__submit {
    min-width: 72px;
    height: 36px;
    padding: 0 24px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.92;
    }
  }
}

.operlog-content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0 0 32px;
  border-radius: 24px;
  background: #ffffff;
  overflow: hidden;
}

.table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.operlog-table {
  height: 100%;

  :deep(.el-table) {
    --el-table-border-color: #ebeef5;
    --el-table-header-bg-color: #ffffff !important;
    --el-table-tr-bg-color: #fbfcfd;
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table__body-wrapper) {
    background-color: #fbfcfd;
  }

  :deep(.el-table__header-wrapper th),
  :deep(.el-table__fixed-header-wrapper th) {
    background-color: #ffffff !important;
    color: #77838f;
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.el-table__header-wrapper th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    height: 60px !important;
    padding: 0 !important;
    box-sizing: border-box;
    background-color: #ffffff !important;

    .cell {
      padding: 20px 12px;
      box-sizing: border-box;
      line-height: 20px;
    }
  }

  :deep(.el-table.is-scrolling-none .el-table__header-wrapper th.el-table__cell.gutter) {
    display: none;
    width: 0 !important;
  }

  :deep(.el-table.is-scrolling-none .el-table__fixed-right-patch) {
    display: none;
    width: 0 !important;
  }

  :deep(.el-table.is-scrolling-none) {
    .el-table__fixed-right,
    .el-table__fixed-header-wrapper {
      display: none !important;
    }

    .el-table__header-wrapper th.el-table-fixed-column--right,
    .el-table__header-wrapper th.action-column-header,
    .el-table__body-wrapper td.el-table-fixed-column--right,
    .el-table__body-wrapper td.action-column {
      visibility: visible !important;
    }
  }

  :deep(.el-table__header-wrapper th.el-table-column--selection .cell),
  :deep(.el-table__body td.el-table-column--selection .cell) {
    text-align: center;
  }

  :deep(.el-table__body tr.el-table__row) {
    background-color: #fbfcfd !important;
  }

  :deep(.el-table__body tr.el-table__row td.el-table__cell) {
    background-color: #fbfcfd !important;
    padding: 0 !important;
  }

  :deep(.el-table__body tr.el-table__row td.el-table__cell .cell) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 11px 12px;
    box-sizing: border-box;
    color: #2b2f33;
    font-size: 14px;
    line-height: 20px;
  }

  :deep(.el-table__fixed-right),
  :deep(.el-table__fixed-right-patch) {
    background-color: transparent;
  }

  :deep(.el-table__fixed-right th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    height: 60px !important;
    padding: 0 !important;
    background-color: #ffffff !important;

    .cell {
      padding: 20px 12px;
      box-sizing: border-box;
      line-height: 20px;
      text-align: left;
    }
  }

  :deep(.el-table__fixed-right td.el-table__cell) {
    padding: 0 !important;
    background-color: #fbfcfd !important;

    .cell {
      padding: 11px 12px;
      box-sizing: border-box;
      line-height: 20px;
      text-align: left;
      overflow: visible;
      white-space: nowrap;
    }
  }

  :deep(.table-action-cell) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  :deep(.el-button.is-link) {
    padding: 0;
    margin: 0;
    font-size: 14px;
  }

  :deep(.action-link--primary.el-button.is-link) {
    color: #3297a0;
    background: transparent !important;
    background-image: none !important;
    border: none;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #66b8bf;
    }
  }
}

.pagination-row {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: 24px 40px 0;

  :deep(.pagination-container) {
    padding: 0;
    margin: 0;
    background: transparent;
  }
}

@media (max-width: 768px) {
  .operlog-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .operlog-content-card {
    padding: 0 0 16px;
  }

  .pagination-row {
    padding: 16px 16px 0;
  }

  .search-bar {
    &__fields,
    &__status,
    &__date-wrap {
      width: 100%;
      max-width: none;
    }

    &__date-wrap :deep(.el-date-editor) {
      width: 100% !important;
      max-width: none !important;
    }
  }
}
</style>
