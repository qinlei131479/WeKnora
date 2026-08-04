<template>
  <section class="dict-data-page">
    <page-name class="page-name" title="字典数据" :icon-class="pageIcon">
      <button type="button" class="add-dict-data-btn" v-hasPermi="['system:dict:add']" @click="handleAdd">+ 新增字典数据</button>
    </page-name>

    <div v-show="showSearch" class="search-bar">
      <div class="search-bar__status">
        <el-select v-model="queryParams.dictType" placeholder="请选择字典名称">
          <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictType" />
        </el-select>
      </div>

      <div class="search-bar__keyword">
        <el-input
          v-model="queryParams.dictLabel"
          class="search-bar__input"
          clearable
          placeholder="请输入字典标签"
          @keyup.enter="handleQuery"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="数据状态">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>
    </div>

    <div class="action-toolbar">
      <div class="action-toolbar__left">
        <button type="button" class="toolbar-btn" :disabled="single" v-hasPermi="['system:dict:edit']" @click="handleUpdate()">修改</button>
        <button type="button" class="toolbar-btn" :disabled="multiple" v-hasPermi="['system:dict:remove']" @click="handleDelete()">删除</button>
        <span class="selected-text">共选中 <span>{{ ids.length }}</span> 条</span>
      </div>

      <div class="action-toolbar__right">
        <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:export']" @click="handleExport">导出</button>
        <button type="button" class="toolbar-btn" @click="handleClose">关闭</button>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </div>
    </div>

    <div class="dict-data-content-card">
      <div class="table-wrap">
        <el-table
          ref="dictDataTableRef"
          v-loading="loading"
          :data="dataList"
          height="100%"
          class="dict-data-table"
          @selection-change="handleSelectionChange"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="字典编码" prop="dictCode" width="100" align="left" />
          <el-table-column label="字典标签" prop="dictLabel" min-width="140" align="left">
            <template #default="scope">
              <span v-if="(scope.row.listClass == '' || scope.row.listClass == 'default') && (scope.row.cssClass == '' || scope.row.cssClass == null)">
                {{ scope.row.dictLabel }}
              </span>
              <el-tag v-else :type="scope.row.listClass == 'primary' ? '' : scope.row.listClass" :class="scope.row.cssClass">
                {{ scope.row.dictLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="字典键值" prop="dictValue" min-width="120" align="left" />
          <el-table-column label="字典排序" prop="dictSort" width="100" align="left" />
          <el-table-column label="状态" width="100" align="center">
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
          <el-table-column label="备注" prop="remark" min-width="160" align="left" :show-overflow-tooltip="true" />
          <el-table-column label="创建时间" prop="createTime" min-width="170" align="left">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="left"
            width="140"
            fixed="right"
            class-name="action-column"
            label-class-name="action-column-header"
          >
            <template #default="scope">
              <div class="table-action-cell">
                <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:dict:edit']">
                  编辑
                </el-button>
                <el-button link class="action-link action-link--danger" @click="handleDelete(scope.row)" v-hasPermi="['system:dict:remove']">
                  删除
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

    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="800px"
      append-to-body
      custom-class="dict-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="dataRef" :model="form" :rules="rules" label-position="top" class="dict-form" hide-required-asterisk>
        <el-form-item label="字典类型">
          <el-input v-model="form.dictType" disabled placeholder="字典类型" />
        </el-form-item>

        <div class="dict-form-grid">
          <el-form-item label="数据标签" prop="dictLabel">
            <el-input v-model="form.dictLabel" placeholder="请输入数据标签" />
          </el-form-item>
          <el-form-item label="数据键值" prop="dictValue">
            <el-input v-model="form.dictValue" placeholder="请输入数据键值" />
          </el-form-item>
          <el-form-item label="样式属性" prop="cssClass">
            <el-input v-model="form.cssClass" placeholder="请输入样式属性" />
          </el-form-item>
          <el-form-item label="显示排序" prop="dictSort">
            <el-input-number v-model="form.dictSort" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="回显样式" prop="listClass">
            <el-select v-model="form.listClass" placeholder="请选择回显样式" style="width: 100%">
              <el-option v-for="item in listClassOptions" :key="item.value" :label="item.label + '(' + item.value + ')'" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #prefixFooter>
        <div class="dict-dialog-footer">
          <button type="button" class="dict-dialog-submit" @click="submitForm">
            确认{{ form.dictCode ? '修改' : '新增' }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Data">
import useDictStore from '@/store/modules/dict'
import { optionselect as getDictOptionselect, getType } from '@/api/system/dict/type'
import { listData, getData, delData, addData, updateData } from '@/api/system/dict/data'
import type { SysDictData, SysDictType, DictDataQueryParams } from '@/types/api/system/dict'
import { nextTick } from 'vue'

interface ListClassOption {
  value: string
  label: string
}

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')
const route = useRoute()
const router = useRouter()

const pageIcon = computed(() => {
  const matchedRoute = router.getRoutes().find(item => item.path === '/system/dict')
  return matchedRoute?.meta?.icon || ''
})

const dataList = ref<SysDictData[]>([])
const dictDataTableRef = ref()
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>('')
const defaultDictType = ref<string>('')
const typeOptions = ref<SysDictType[]>([])

const listClassOptions = ref<ListClassOption[]>([
  { value: 'default', label: '默认' },
  { value: 'primary', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' }
])

const data = reactive({
  form: {} as SysDictData,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictType: undefined,
    dictLabel: undefined,
    status: undefined
  } as DictDataQueryParams,
  rules: {
    dictLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
    dictValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
    dictSort: [{ required: true, message: '数据顺序不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getTypes(dictId: number) {
  getType(dictId).then(response => {
    queryParams.value.dictType = response.data!.dictType
    defaultDictType.value = response.data!.dictType!
    getList()
  })
}

function getTypeList() {
  getDictOptionselect().then(response => {
    typeOptions.value = response.data
  })
}

function getList() {
  loading.value = true
  listData(queryParams.value).then(response => {
    dataList.value = response.rows
    total.value = response.total
    loading.value = false
    nextTick(() => {
      dictDataTableRef.value?.doLayout()
    })
  })
}

function reset() {
  form.value = {
    dictCode: undefined,
    dictLabel: undefined,
    dictValue: undefined,
    cssClass: undefined,
    listClass: 'default',
    dictSort: 0,
    status: '0',
    remark: undefined
  }
  proxy.resetForm('dataRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function handleClose() {
  const obj = { path: '/system/dict' }
  proxy.$tab.closeOpenPage(obj)
}

function resetQuery() {
  queryParams.value.dictLabel = undefined
  queryParams.value.status = undefined
  queryParams.value.dictType = defaultDictType.value
  handleQuery()
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加字典数据'
  form.value.dictType = queryParams.value.dictType
}

function handleSelectionChange(selection: SysDictData[]) {
  ids.value = selection.map(item => item.dictCode!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

function handleUpdate(row?: SysDictData) {
  reset()
  const dictCode = row?.dictCode || ids.value[0]
  getData(dictCode).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改字典数据'
  })
}

function handleStatusChange(row: SysDictData) {
  const text = row.status === '0' ? '启用' : '停用'
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.dictLabel + '"字典数据吗?')
    .then(() => updateData(row))
    .then(() => {
      useDictStore().removeDict(queryParams.value.dictType!)
      proxy.$modal.msgSuccess(text + '成功')
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0'
    })
}

function submitForm() {
  proxy.$refs['dataRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.dictCode != undefined) {
        updateData(form.value).then(() => {
          useDictStore().removeDict(queryParams.value.dictType!)
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addData(form.value).then(() => {
          useDictStore().removeDict(queryParams.value.dictType!)
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row?: SysDictData) {
  const dictCodes = row?.dictCode || ids.value
  proxy.$modal
    .confirm('是否确认删除字典编码为"' + dictCodes + '"的数据项？')
    .then(function () {
      return delData(dictCodes)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
      useDictStore().removeDict(queryParams.value.dictType!)
    })
    .catch(() => {})
}

function handleExport() {
  proxy.download(
    'system/dict/data/export',
    {
      ...queryParams.value
    },
    `dict_data_${new Date().getTime()}.xlsx`
  )
}

getTypes(route.params && Number(route.params.dictId))
getTypeList()
</script>

<style scoped lang="scss">
.dict-data-page {
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

.add-dict-data-btn {
  min-width: 140px;
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
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.92;
    }
  }
}

.action-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  min-height: 50px;
  gap: 12px;

  &__left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
}

.toolbar-btn {
  min-width: 76px;
  height: 36px;
  padding: 0 20px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: #ffffff;
  color: #77838f;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, opacity 0.2s;

  &:hover:not(:disabled) {
    border-color: #3297a0;
    color: #3297a0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.selected-text {
  font-size: 14px;
  color: #999999;
  line-height: 36px;

  span {
    padding: 0 5px;
    color: #6397ff;
  }
}

.dict-data-content-card {
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

.dict-data-table {
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
  .dict-data-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .dict-data-content-card {
    padding: 0 0 16px;
  }

  .pagination-row {
    padding: 16px 16px 0;
  }

  .search-bar {
    &__keyword,
    &__status {
      width: 100%;
      max-width: none;
    }
  }

  .action-toolbar {
    flex-direction: column;
    align-items: stretch;

    &__right {
      margin-left: 0;
      justify-content: flex-end;
    }
  }
}
</style>

<style lang="scss">
.dict-form-dialog.kjsc-dialog-v2 {
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

  .dict-form {
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

  .dict-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
  }

  .dict-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }

  .dict-dialog-submit {
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
