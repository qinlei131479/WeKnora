<template>
  <section class="post-manage-page">
    <page-name class="page-name" title="岗位管理">
      <button type="button" class="add-post-btn" v-hasPermi="['system:post:add']" @click="handleAdd">+ 新增岗位</button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keywords">
        <div class="search-bar__keyword">
          <el-input
            v-model="queryParams.postCode"
            class="search-bar__input"
            clearable
            placeholder="请输入岗位编码"
            @keyup.enter="handleQuery"
          />
          <button type="button" class="search-bar__icon-btn" @click="handleQuery">
            <svg-icon icon-class="search" class="search-bar__icon" />
          </button>
        </div>

        <div class="search-bar__keyword">
          <el-input
            v-model="queryParams.postName"
            class="search-bar__input"
            clearable
            placeholder="请输入岗位名称"
            @keyup.enter="handleQuery"
          />
          <button type="button" class="search-bar__icon-btn" @click="handleQuery">
            <svg-icon icon-class="search" class="search-bar__icon" />
          </button>
        </div>
      </div>

      <div class="search-bar__status">
        <el-select v-model="queryParams.status" clearable placeholder="岗位状态">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </div>

      <button type="button" class="search-bar__reset" @click="resetQuery">重置</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">搜索</button>

      <button type="button" class="search-bar__export" v-hasPermi="['system:post:export']" @click="handleExport">导出</button>
    </div>

    <div class="post-content-card">
      <div class="table-wrap">
        <el-table
          ref="postTableRef"
          v-loading="loading"
          :data="postList"
          height="100%"
          class="post-table"
          @selection-change="handleSelectionChange"
        >
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="岗位编号" prop="postId" width="100" align="left" />
          <el-table-column label="岗位编码" prop="postCode" min-width="140" align="left" show-overflow-tooltip />
          <el-table-column label="岗位名称" prop="postName" min-width="160" align="left" show-overflow-tooltip />
          <el-table-column label="岗位排序" prop="postSort" width="100" align="left" />
          <el-table-column label="职责描述" prop="remark" min-width="200" align="left" show-overflow-tooltip />
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
                <el-button link class="action-link action-link--primary" @click="handleUpdate(scope.row)" v-hasPermi="['system:post:edit']">
                  编辑
                </el-button>
                <el-button link class="action-link action-link--danger" @click="handleDelete(scope.row)" v-hasPermi="['system:post:remove']">
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
      custom-class="post-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form ref="postRef" :model="form" :rules="rules" label-position="top" class="post-form" hide-required-asterisk>
        <div class="post-form-grid">
          <el-form-item label="岗位名称" prop="postName">
            <el-input v-model="form.postName" placeholder="请输入岗位名称" />
          </el-form-item>
          <el-form-item label="岗位编码" prop="postCode">
            <el-input v-model="form.postCode" placeholder="请输入岗位编码" />
          </el-form-item>
          <el-form-item label="岗位顺序" prop="postSort">
            <el-input-number v-model="form.postSort" controls-position="right" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="岗位状态">
            <el-switch v-model="form.status" style="--el-switch-on-color: #31aba0" active-value="0" inactive-value="1" />
          </el-form-item>
        </div>
        <el-form-item label="职责描述" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入职责描述" />
        </el-form-item>
      </el-form>

      <template #prefixFooter>
        <div class="post-dialog-footer">
          <button type="button" class="post-dialog-submit" @click="submitForm">
            确认{{ form.postId ? '修改' : '新增' }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Post">
import { listPost, addPost, delPost, getPost, updatePost } from '@/api/system/post'
import type { SysPost, PostQueryParams } from '@/types/api/system/post'
import { nextTick } from 'vue'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const postList = ref<SysPost[]>([])
const postTableRef = ref()
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>('')

const data = reactive({
  form: {} as SysPost,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    postCode: undefined,
    postName: undefined,
    status: undefined
  } as PostQueryParams,
  rules: {
    postName: [{ required: true, message: '岗位名称不能为空', trigger: 'blur' }],
    postCode: [{ required: true, message: '岗位编码不能为空', trigger: 'blur' }],
    postSort: [{ required: true, message: '岗位顺序不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listPost(queryParams.value).then(response => {
    postList.value = response.rows
    total.value = response.total
    loading.value = false
    nextTick(() => {
      postTableRef.value?.doLayout()
    })
  })
}

function reset() {
  form.value = {
    postId: undefined,
    postCode: undefined,
    postName: undefined,
    postSort: 0,
    status: '0',
    remark: undefined
  }
  proxy.resetForm('postRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.value.postCode = undefined
  queryParams.value.postName = undefined
  queryParams.value.status = undefined
  handleQuery()
}

function handleSelectionChange(selection: SysPost[]) {
  ids.value = selection.map(item => item.postId!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加岗位'
}

function handleUpdate(row?: SysPost) {
  reset()
  const postId = row?.postId || ids.value[0]
  getPost(postId).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改岗位'
  })
}

function handleStatusChange(row: SysPost) {
  const text = row.status === '0' ? '启用' : '停用'
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.postName + '"岗位吗?')
    .then(() => updatePost(row))
    .then(() => {
      proxy.$modal.msgSuccess(text + '成功')
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0'
    })
}

function submitForm() {
  proxy.$refs['postRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.postId != undefined) {
        updatePost(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addPost(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row?: SysPost) {
  const postIds = row?.postId || ids.value
  proxy.$modal
    .confirm('是否确认删除岗位编号为"' + postIds + '"的数据项？')
    .then(function () {
      return delPost(postIds)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

function handleExport() {
  proxy.download(
    'system/post/export',
    {
      ...queryParams.value
    },
    `post_${new Date().getTime()}.xlsx`
  )
}

getList()
</script>

<style scoped lang="scss">
.post-manage-page {
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

.add-post-btn {
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

  &__keywords {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 620px;
    flex: none;
  }

  &__keyword {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    height: 36px;
    padding: 0 8px 0 16px;
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: #ffffff;
    box-sizing: border-box;
    margin-right: 8px;
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

  &__reset,
  &__export {
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
  &__reset {
    margin-right: 8px;
  }

  &__export {
    margin-left: auto;
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

.post-content-card {
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

.post-table {
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
  .post-manage-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .post-content-card {
    padding: 0 0 16px;
  }

  .pagination-row {
    padding: 16px 16px 0;
  }

  .search-bar {
    &__keywords,
    &__status {
      width: 100%;
      max-width: none;
    }

    &__keyword {
      flex: 1;
      min-width: 0;
    }

    &__export {
      margin-left: 0;
      width: 100%;
    }
  }
}
</style>

<style lang="scss">
.post-form-dialog.kjsc-dialog-v2 {
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

  .post-form {
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

  .post-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
  }

  .post-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }

  .post-dialog-submit {
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
