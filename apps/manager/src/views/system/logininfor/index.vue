<template>
  <section class="login-log-page">
    <page-name class="page-name" title="登录日志" />

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input
          v-model="queryParams.userName"
          class="search-bar__input"
          clearable
          placeholder="请输入用户名称"
          @keyup.enter="handleQuery"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="登录状态">
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

    <div class="login-log-content-card">
      <div class="table-wrap">
        <el-table
          ref="logininforRef"
          v-loading="loading"
          :data="logininforList"
          height="100%"
          class="login-log-table"
          :default-sort="defaultSort"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="访问编号" prop="infoId" width="100" align="left" />
          <el-table-column
            label="用户名称"
            prop="userName"
            min-width="140"
            align="left"
            :show-overflow-tooltip="true"
            sortable="custom"
            :sort-orders="['descending', 'ascending']"
          />
          <el-table-column label="登录状态" prop="status" width="100" align="center">
            <template #default="scope">
              <dict-tag :options="sys_common_status" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="描述" prop="msg" min-width="200" align="left" :show-overflow-tooltip="true" />
          <el-table-column
            label="访问时间"
            prop="accessTime"
            min-width="170"
            align="left"
            sortable="custom"
            :sort-orders="['descending', 'ascending']"
          >
            <template #default="scope">
              <span>{{ parseTime(scope.row.accessTime) }}</span>
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
  </section>
</template>

<script setup lang="ts" name="Logininfor">
import { list, delLogininfor, cleanLogininfor, unlockLogininfor } from '@/api/system/logininfor'
import type { SysLogininfor, LogininforQueryParams } from '@/types/api/system/logininfor'
import { nextTick } from 'vue'

const { proxy } = getCurrentInstance()
const { sys_common_status } = proxy.useDict('sys_common_status')

const logininforList = ref<SysLogininfor[]>([])
const logininforRef = ref()
const loading = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const selectName = ref<string[]>([])
const total = ref<number>(0)
const dateRange = ref<string[]>([])
const defaultSort = ref({ prop: 'accessTime', order: 'descending' })

const queryParams = ref<LogininforQueryParams>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: undefined,
  userName: undefined,
  status: undefined,
  orderByColumn: undefined,
  isAsc: undefined
})

function getList() {
  loading.value = true
  list(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    logininforList.value = response.rows
    total.value = response.total
    loading.value = false
    nextTick(() => {
      logininforRef.value?.doLayout()
    })
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  dateRange.value = []
  queryParams.value.userName = undefined
  queryParams.value.status = undefined
  queryParams.value.pageNum = 1
  logininforRef.value?.sort(defaultSort.value.prop, defaultSort.value.order)
  handleQuery()
}

function handleSelectionChange(selection: SysLogininfor[]) {
  ids.value = selection.map(item => item.infoId!)
  multiple.value = !selection.length
  single.value = selection.length != 1
  selectName.value = selection.map(item => item.userName!)
}

function handleSortChange(column: any) {
  queryParams.value.orderByColumn = column.prop
  queryParams.value.isAsc = column.order
  getList()
}

function handleDelete(row?: SysLogininfor) {
  const infoIds = row?.infoId || ids.value
  proxy.$modal
    .confirm('是否确认删除访问编号为"' + infoIds + '"的数据项?')
    .then(function () {
      return delLogininfor(infoIds)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

function handleClean() {
  proxy.$modal
    .confirm('是否确认清空所有登录日志数据项?')
    .then(function () {
      return cleanLogininfor()
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('清空成功')
    })
    .catch(() => {})
}

function handleUnlock() {
  const username = selectName.value
  proxy.$modal
    .confirm('是否确认解锁用户"' + username + '"数据项?')
    .then(function () {
      return unlockLogininfor(username)
    })
    .then(() => {
      proxy.$modal.msgSuccess('用户' + username + '解锁成功')
    })
    .catch(() => {})
}

function handleExport() {
  proxy.download(
    'system/logininfor/export',
    {
      ...queryParams.value
    },
    `logininfor_${new Date().getTime()}.xlsx`
  )
}

getList()
</script>

<style scoped lang="scss">
.login-log-page {
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

  &__keyword {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 420px;
    height: 36px;
    padding: 0 8px 0 16px;
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: #ffffff;
    box-sizing: border-box;
  }

  &__input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      padding: 0;
      background: transparent;
      box-shadow: none !important;
    }

    :deep(.el-input__inner) {
      height: 38px;
      line-height: 38px;
      font-size: 14px;
      color: #303133;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: #ebf3f5;
    }
  }

  &__icon {
    font-size: 16px;
    color: #77838f;
  }

  &__status {
    width: 200px;
    flex: none;
    margin-left: 8px;

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
    margin-left: 8px;
    margin-right: 8px;

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
    margin-left: 8px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.92;
    }
  }
}

.login-log-content-card {
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

.login-log-table {
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
  .login-log-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .login-log-content-card {
    padding: 0 0 16px;
  }

  .pagination-row {
    padding: 16px 16px 0;
  }

  .search-bar {
    &__keyword,
    &__status,
    &__date-wrap {
      width: 100%;
      max-width: none;
      margin-left: 0;
      margin-right: 0;
    }

    &__date-wrap :deep(.el-date-editor) {
      width: 100% !important;
      max-width: none !important;
    }
  }
}
</style>
