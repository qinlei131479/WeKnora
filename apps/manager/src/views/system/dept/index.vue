<template>
  <section class="dept-manage-page">
    <page-name class="page-name" title="部门组织架构">
      <button type="button" class="add-dept-btn" v-hasPermi="['system:dept:add']" @click="handleAdd()">+ 新增部门</button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input
          v-model="queryParams.deptName"
          class="search-bar__input"
          clearable
          placeholder="搜索部门名称..."
          @keyup.enter="handleQuery"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="部门状态">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>

      <button type="button" class="search-bar__toggle" @click="toggleExpandAll">展开/折叠</button>
    </div>

    <div class="dept-content-card">
      <div class="table-wrap">
        <el-table
          v-if="refreshTable"
          ref="deptTableRef"
          v-loading="loading"
          :data="deptList"
          row-key="deptId"
          class="dept-table"
          :default-expand-all="isExpandAll"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column prop="deptName" label="部门名称" min-width="260" align="left" />
          <el-table-column prop="orderNum" label="排序" width="120" align="left" />
          <el-table-column prop="description" label="职责范围" min-width="220" align="left" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                style="--el-switch-on-color: #31aba0"
                active-value="0"
                inactive-value="1"
                @change="handleStatusChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" min-width="170" align="left">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="left" width="200" fixed="right" class-name="action-column" label-class-name="action-column-header">
            <template #default="scope">
              <div class="table-action-cell">
                <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:dept:edit']">
                  编辑
                </el-button>
                <el-button link class="action-link action-link--primary" @click="handleAdd(scope.row)" v-hasPermi="['system:dept:add']">
                  新增
                </el-button>
                <el-button
                  v-if="scope.row.parentId != 0"
                  link
                  class="action-link action-link--danger"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['system:dept:remove']"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="800px"
      append-to-body
      custom-class="dept-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="deptRef" :model="form" :rules="rules" label-position="top" class="dept-form" hide-required-asterisk>
        <el-form-item v-if="form.parentId !== 0" label="上级部门" prop="parentId" class="dept-parent-item">
          <el-tree-select
            v-model="form.parentId"
            :data="deptOptions"
            :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
            value-key="deptId"
            placeholder="请选择上级部门"
            check-strictly
            :offset="0"
            :teleported="true"
            popper-class="dept-tree-select-popper"
            style="width: 100%; margin-bottom: 5px;"
          />
        </el-form-item>

        <div class="dept-form-grid">
          <el-form-item label="部门名称" prop="deptName">
            <el-input v-model="form.deptName" placeholder="请输入部门名称" />
          </el-form-item>
          <el-form-item label="显示排序" prop="orderNum">
            <el-input-number v-model="form.orderNum" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="负责人" prop="leader">
            <el-input v-model="form.leader" placeholder="请输入负责人" maxlength="20" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱地址" maxlength="50" />
          </el-form-item>
          <el-form-item label="部门状态">
            <el-switch v-model="form.status" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>

        <el-form-item label="职责范围" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入职责范围" />
        </el-form-item>
      </el-form>

      <template #prefixFooter>
        <div class="dept-dialog-footer">
          <button type="button" class="dept-dialog-submit" @click="submitForm">
            确认{{ form.deptId ? '修改' : '新增' }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Dept">
import { listDept, getDept, delDept, addDept, updateDept, updateDeptSort, listDeptExcludeChild } from '@/api/system/dept'
import type { SysDept, DeptQueryParams } from '@/types/api/system/dept'
import type { TreeSelect } from '@/types/api/common'
import { nextTick } from 'vue'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const deptList = ref<any[]>([])
const deptTableRef = ref()
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const title = ref<string>('')
const deptOptions = ref<TreeSelect[]>([])
const isExpandAll = ref<boolean>(true)
const refreshTable = ref<boolean>(true)
const originalOrders = ref<Record<number, number>>({})

const data = reactive({
  form: {} as SysDept,
  queryParams: {
    deptName: undefined,
    status: undefined
  } as DeptQueryParams,
  rules: {
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'blur' }],
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phone: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listDept(queryParams.value).then(response => {
    deptList.value = proxy.handleTree(response.data, 'deptId')
    recordOriginalOrders(deptList.value)
    loading.value = false
    nextTick(() => {
      deptTableRef.value?.doLayout()
    })
  })
}

function reset() {
  form.value = {
    deptId: undefined,
    parentId: undefined,
    deptName: undefined,
    orderNum: 0,
    leader: undefined,
    phone: undefined,
    email: undefined,
    status: '0',
    description: undefined
  }
  proxy.resetForm('deptRef')
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.value.deptName = undefined
  queryParams.value.status = undefined
  handleQuery()
}

function handleAdd(row?: SysDept) {
  reset()
  listDept().then(response => {
    deptOptions.value = proxy.handleTree(response.data, 'deptId')
  })
  if (row != undefined) {
    form.value.parentId = row.deptId
  }
  open.value = true
  title.value = '添加部门'
}

function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
    nextTick(() => {
      deptTableRef.value?.doLayout()
    })
  })
}

function handleUpdate(row: SysDept) {
  reset()
  listDeptExcludeChild(row.deptId!).then(response => {
    deptOptions.value = proxy.handleTree(response.data, 'deptId')
  })
  getDept(row.deptId!).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改部门'
  })
}

function handleStatusChange(row: SysDept) {
  const text = row.status === '0' ? '启用' : '停用'
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.deptName + '"部门吗?')
    .then(() => updateDept(row))
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功')
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0'
    })
}

function submitForm() {
  proxy.$refs['deptRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.deptId != undefined) {
        updateDept(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addDept(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function recordOriginalOrders(list: SysDept[]) {
  list.forEach(item => {
    originalOrders.value[item.deptId] = item.orderNum
    if (item.children && item.children.length) {
      recordOriginalOrders(item.children)
    }
  })
}

function handleDelete(row: SysDept) {
  proxy.$modal
    .confirm('是否确认删除名称为"' + row.deptName + '"的数据项?')
    .then(function () {
      return delDept(row.deptId!)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
.dept-manage-page {
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

.add-dept-btn {
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
    width: 326px;
    flex: none;
    margin-left: 8px;
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

  &__toggle {
    margin-left: auto;
    min-width: 96px;
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
}

.dept-content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0 0 32px;
  border-radius: 24px;
  background: #ffffff;
  overflow: auto;
}

.table-wrap {
  min-height: 0;
  flex: 1;
}

.dept-table {
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

  :deep(.action-link--danger.el-button.is-link) {
    color: #fe595d;
    background: transparent !important;
    background-image: none !important;
    border: none;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: #ff7b7e;
    }
  }
}

@media (max-width: 768px) {
  .dept-manage-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .dept-content-card {
    padding: 0 0 16px;
  }

  .search-bar {
    &__keyword,
    &__status {
      width: 100%;
      max-width: none;
    }

    &__toggle {
      margin-left: 0;
      width: 100%;
    }
  }
}
</style>

<style lang="scss">
.dept-tree-select-popper.el-popper {
  margin-top: 0 !important;

  .el-popper__arrow {
    display: none;
  }
}
</style>

<style lang="scss">
.dept-form-dialog.kjsc-dialog-v2 {
  border-radius: 24px;
  overflow: hidden;
  padding: 0;

  .el-dialog__header {
    padding: 24px 32px 20px;
    margin-right: 0;
    border-bottom: 1px solid #ebeef5;

    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: #2b2f33;
      line-height: 26px;
    }

    .el-dialog__headerbtn {
      top: 24px;
      right: 24px;
      width: 24px;
      height: 24px;

      .el-dialog__close {
        color: #77838f;
        font-size: 18px;
      }
    }
  }

  .el-dialog__body {
    padding: 20px 40px 0;
  }

  .el-dialog__footer {
    padding: 32px 32px 32px;
  }

  .dept-form {
    .el-form-item {
      margin-bottom: 20px;
    }

    .el-form-item__label {
      display: inline-flex;
      align-items: center;
      line-height: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #2b2f33;
    }

    .el-form-item.is-required > .el-form-item__label::before {
      display: none !important;
      margin: 0 !important;
      content: '' !important;
    }

    .el-form-item.is-required > .el-form-item__label::after {
      content: '*';
      margin-left: 4px;
      color: #fe595d;
    }

    .el-input__wrapper,
    .el-select__wrapper,
    .el-textarea__inner {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }

    .el-input__wrapper,
    .el-select__wrapper {
      min-height: 40px;
    }

    .el-input-number {
      width: 100%;

      .el-input__wrapper {
        width: 100%;
      }
    }

    .el-textarea__inner {
      min-height: 96px;
      padding: 10px 12px;
    }

    .el-input__inner {
      font-size: 14px;
      color: #2b2f33;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  .dept-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
  }

  .dept-parent-item {
    margin-bottom: 20px;
  }

  .dept-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }

  .dept-dialog-submit {
    min-width: 120px;
    height: 40px;
    padding: 0 28px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.92;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}
</style>
