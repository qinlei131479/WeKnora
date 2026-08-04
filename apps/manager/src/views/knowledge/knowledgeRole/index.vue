<template>
  <section class="usergroup-manage-page">
    <page-name class="page-name" title="用户组管理">
      <button type="button" class="add-usergroup-btn" v-hasPermi="['knowledgeLib:knowledgeRole:add']" @click="handleAdd">
        + 新增用户组
      </button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input
          v-model="queryParams.roleName"
          class="search-bar__input"
          clearable
          placeholder="请输入用户组名称"
          @keyup.enter="handleQuery"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="用户组状态">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <div class="search-bar__date-wrap">
        <el-date-picker
          v-model="dateRange"
          class="search-bar__date"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>
    </div>

    <div class="usergroup-content-card">
      <div class="table-wrap">
        <el-table
          ref="usergroupTableRef"
          v-loading="loading"
          :data="roleList"
          height="100%"
          class="usergroup-table"
          @selection-change="handleSelectionChange"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="编号" prop="id" width="80" align="left" />
          <el-table-column label="用户组名称" prop="roleName" min-width="160" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="用户组成员" prop="userNames" min-width="200" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="关联知识库" prop="knowledgeNames" min-width="200" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                style="--el-switch-on-color: #31aba0"
                :active-value="0"
                :inactive-value="1"
                :disabled="scope.row.builtin == 1"
                @change="handleStatusChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" min-width="170" align="left">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="left"
            header-align="left"
            width="140"
            fixed="right"
            class-name="action-column"
            label-class-name="action-column-header"
          >
            <template #default="scope">
              <div class="table-action-cell">
                <el-button
                  link
                  class="action-link action-link--primary"
                  v-hasPermi="['knowledgeLib:knowledgeRole:edit']"
                  @click="handleUpdate(scope.row)"
                >
                  编辑
                </el-button>
                <el-popconfirm
                  v-if="scope.row.builtin != 1"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  title="确认删除吗?"
                  :hide-after="100"
                  @confirm="confirmCallback(scope.row)"
                >
                  <template #reference>
                    <el-button link class="action-link action-link--danger" v-hasPermi="['knowledgeLib:knowledgeRole:remove']">
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
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

    <CreateRole v-model="open" :data-id="editRoleId" @done="getList" />
  </section>
</template>

<script setup name="KnowledgeRole">
import { changeRoleStatus, delRole, listRole } from '@/api/knowledge/knowledgeRole.js'
import { useRoute } from 'vue-router'
import { nextTick, onMounted } from 'vue'
import CreateRole from '@/components/knowledeg/CreateRole.vue'

const route = useRoute()
const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const roleList = ref([])
const usergroupTableRef = ref()
const open = ref(false)
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const dateRange = ref([])
const editRoleId = ref('')

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: undefined,
    roleKey: undefined,
    status: undefined,
    beginTime: '',
    endTime: ''
  }
})

const { queryParams } = toRefs(data)

function getList() {
  loading.value = true
  listRole(queryParams.value, {
    pageNum: queryParams.value.pageNum,
    pageSize: queryParams.value.pageSize,
    orderByColumn: 'roleSort',
    isAsc: 'desc'
  }).then(
    response => {
      roleList.value = response.rows
      total.value = response.total
      loading.value = false
      nextTick(() => {
        usergroupTableRef.value?.doLayout()
      })
    },
    () => {
      loading.value = false
    }
  )
}

function handleQuery() {
  queryParams.value.pageNum = 1
  if (dateRange.value?.length >= 2) {
    queryParams.value.beginTime = dateRange.value[0] + ' 00:00:00'
    queryParams.value.endTime = dateRange.value[1] + ' 23:59:59'
  } else {
    queryParams.value.beginTime = ''
    queryParams.value.endTime = ''
  }
  getList()
}

function resetQuery() {
  dateRange.value = []
  queryParams.value.roleName = undefined
  queryParams.value.status = undefined
  queryParams.value.beginTime = ''
  queryParams.value.endTime = ''
  handleQuery()
}

function confirmCallback(data) {
  delRole(data.id)
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

function handleDelete() {
  const roleIds = ids.value.join(',')
  proxy.$modal
    .confirm('是否确认删除用户组编号为"' + roleIds + '"的数据项?')
    .then(function () {
      return delRole(roleIds)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

function handleStatusChange(row) {
  const text = row.status === 0 ? '启用' : '停用'
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.roleName + '"用户组吗?')
    .then(function () {
      return changeRoleStatus(row.id, row.status)
    })
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功')
    })
    .catch(function () {
      row.status = row.status === 0 ? 1 : 0
    })
}

function handleAdd() {
  editRoleId.value = ''
  open.value = true
}

function handleUpdate(row) {
  editRoleId.value = row ? row.id : ids.value[0]
  open.value = true
}

onMounted(() => {
  getList()
  if (route.query.show === 'create') {
    handleAdd()
  }
})
</script>

<style scoped lang="scss">
.usergroup-manage-page {
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

  :deep(.page-name-right) {
    align-self: flex-start;
    padding-top: 4px;
  }
}

.add-usergroup-btn {
  min-width: 130px;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 20px;
  background: #29b276;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.92;
  }
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

.usergroup-content-card {
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

.usergroup-table {
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

  :deep(.el-table__header-wrapper th.action-column-header.el-table__cell .cell),
  :deep(.el-table__fixed-header-wrapper th.action-column-header.el-table__cell .cell) {
    padding: 20px 12px;
    text-align: left;
  }

  :deep(.el-table__body-wrapper td.action-column.el-table__cell .cell) {
    overflow: visible;
    white-space: nowrap;
    text-align: left;
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
  :deep(.el-table__fixed-right td.el-table__cell) {
    background-color: inherit;
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
      background: transparent !important;
      background-image: none !important;
    }
  }

  :deep(.action-link--danger.el-button.is-link) {
    color: #fe595d;
    background: transparent !important;
    background-image: none !important;
    border: none;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #ff7b7e;
      background: transparent !important;
      background-image: none !important;
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
  .usergroup-manage-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .usergroup-content-card {
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
    }

    &__date-wrap :deep(.el-date-editor) {
      width: 100% !important;
      max-width: none !important;
    }
  }
}
</style>
