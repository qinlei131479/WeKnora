<template>
  <section class="manage-page tenant-space-manage-page">
    <page-name class="page-name">
      <button type="button" class="add-btn" v-hasPermi="['business:tenants:add']" @click="handleAdd">+ {{
        $t('page.tenantSpace.add', '添加空间')
      }}</button>
    </page-name>

    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input v-model="queryParams.name" class="search-bar__input" clearable
          :placeholder="$t('page.tenantSpace.searchPlaceholder', '空间名称或空间id')" @keyup.enter="handleQuery" />
        <button type="button" class="search-bar__icon-btn" @click="handleQuery">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <!-- <div class="search-bar__date-wrap">
        <el-date-picker v-model="dateRange" class="search-bar__date" value-format="YYYY-MM-DD" type="daterange"
          :range-separator="$t('page.mcp.range_separator')"
          :start-placeholder="$t('page.mcp.start_date.placeholder')"
          :end-placeholder="$t('page.mcp.end_date.placeholder')" />
      </div> -->

      <button type="button" class="search-bar__reset" @click="resetQuery">{{ $t('page.tenantSpace.reset', '重置')
        }}</button>
      <button type="button" class="search-bar__submit" @click="handleQuery">{{ $t('page.tenantSpace.search', '搜索')
        }}</button>
    </div>

    <div class="action-toolbar" style="display: none;">
      <div class="action-toolbar__left">
        <!-- <button type="button" class="toolbar-btn" :disabled="multiple" v-hasPermi="['system:dict:remove']"
          @click="handleDelete()">
          批量删除
        </button> -->
        <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']"
          @click="handleEnable()">
          {{ $t('page.batchEnable', '批量启用') }}
        </button>
        <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']"
          @click="handleDisable()">
          {{ $t('page.batchDisable', '批量停用') }}
        </button>
        <span class="selected-text">{{ $t('page.selected', '共选中') }} <span>{{ ids.length }}</span> {{
          $t('page.items', '条') }}</span>
      </div>

      <div class="action-toolbar__right">
        <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:export']" @click="handleExport">导出</button> -->
        <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:remove']"
          @click="handleRefreshCache">刷新缓存</button> -->
        <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" /> -->
      </div>
    </div>

    <div class="table-pager-area">
      <div class="table-wrap">
        <el-table ref="tableRef" v-loading="loading" :data="tableData" height="100%"
          @row-click="handleRowClick"
          @selection-change="handleSelectionChange">
          <template #empty>
            <kjsc-empty />
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column :label="$t('page.tenantSpace.id', '空间id')" align="left" key="id" prop="id" width="100"
            :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.tenantSpace.name', '空间名称')" align="left" key="name" prop="name"
            min-width="120" v-if="columns.name.visible" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('page.tenantSpace.storageQuota', '存储配额')" align="left" key="storageQuota"
            prop="storageQuota" width="120" v-if="columns.storageQuota.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ formatSize(scope.row.storageQuota) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.tenantSpace.storageUsed', '已使用储存')" align="left" key="storageUsed"
            prop="storageUsed" width="120" v-if="columns.storageUsed.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ formatSize(scope.row.storageUsed) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.tenantSpace.storageRate', '储存使用率')" align="left" key="storageRate"
            prop="storageRate" width="120" v-if="columns.storageRate.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <span>{{ getRate(scope.row.storageQuota, scope.row.storageUsed) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.tenantSpace.status', '空间状态')" align="left" key="status" prop="status"
            width="120" v-if="columns.status.visible" :show-overflow-tooltip="true">
            <template #default="scope">
              <el-tag :type="getStatusTheme(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.tenantSpace.description', '空间描述')" align="left" key="description"
            prop="description" min-width="120" v-if="columns.description.visible" :show-overflow-tooltip="true" />

          <!-- <el-table-column v-if="columns.createBy.visible" label="创建人" key="createBy" prop="createBy" min-width="120"
            align="left" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns.roleName.visible" label="所属角色" key="roleName" prop="roleName" min-width="120"
            align="left" />
          <el-table-column v-if="columns.tenantName.visible" label="所属租户" key="tenantName" prop="tenantName"
            min-width="120" align="left" />
          <el-table-column label="启用状态" align="center" key="status" width="100" v-if="columns.status.visible">
            <template #default="scope">
              <el-switch v-model="scope.row.status" style="--el-switch-on-color: #31aba0" active-value="0"
                inactive-value="1" @change="handleStatusChange(scope.row)" />
            </template>
          </el-table-column>
          -->
          <el-table-column label="空间创建时间" align="left" prop="createdAt" width="180"
            v-if="columns.createdAt.visible">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('page.tenantSpace.operation', '操作')" prop="operation" align="left" width="200" fixed="right">
            <template #default="scope">
              <el-button link class="action-link action-link--primary" @click.stop="handleUpdate(scope.row)"
                v-hasPermi="['business:tenants:edit']">
                {{ $t('form.button.edit') }}
              </el-button>
              <el-button link class="action-link action-link--danger" @click.stop="handleDelete(scope.row)"
                v-hasPermi="['business:tenants:remove']">
                {{ $t('form.button.delete') }}
              </el-button>
              <!-- <el-button v-if="!scope.row.enabled" link class="action-link action-link--primary"
                @click.stop="handleEnable(scope.row)" v-hasPermi="['business:tenants:edit']">
                {{ $t('form.button.enable') }}
              </el-button>
              <el-button v-else link class="action-link action-link--primary" @click.stop="handleDisable(scope.row)"
                v-hasPermi="['business:tenants:edit']">
                {{ $t('form.button.disable') }}
              </el-button> -->
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-row">
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum"
          v-model:limit="pageParams.pageSize" @pagination="getList" />
      </div>
    </div>

    <!-- 添加或修改对话框 -->
    <KJSCDialogV2 :title="title" v-model="open" width="800px" append-to-body
      custom-class="manage-dialog tenant-space-form-dialog" :showCloseBtn="false" :showSubitBtn="false">
      <el-form :model="form" :rules="rules" ref="saveFormRef" label-position="top" class="tenant-space-form">
        <el-form-item :label="$t('page.tenantSpace.name', '空间名称')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('page.tenantSpace.namePlaceholder', '例如：我的新项目')" maxlength="999"
            :show-word-limit="false" />
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.description', '空间描述')" prop="description">
          <el-input v-model="form.description" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }"
            :placeholder="$t('page.tenantSpace.descriptionPlaceholder', '简单描述一下这个空间的用途')" />
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="manage-dialog-footer">
          <el-button class="close-btn" size="large" round @click="closeDialog">
            {{ t('form.button.close', '取消') }}
          </el-button>
          <button class="submit-btn" :disabled="submitDisabled" @click="submitForm">
            {{ t('form.button.submit', '保存') }}
          </button>
        </div>
      </template>
    </KJSCDialogV2>

    <KJSCDialogV2 :title="detailTitle" v-model="detailOpen" width="800px" append-to-body
      custom-class="manage-dialog tenant-space-form-dialog" :showCloseBtn="false" :showSubitBtn="false">
      <el-form label-position="left" label-width="120" class="tenant-space-form">
        <el-form-item :label="$t('page.tenantSpace.id', '空间id')">
          {{ detailForm.id }}
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.name', '空间名称')" prop="name">
          {{ detailForm.name }}
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.description', '空间描述')" prop="description">
          {{ detailForm.description }}
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.status', '空间状态')" prop="status">
          <el-tag :type="getStatusTheme(detailForm.status)">{{ getStatusText(detailForm.status) }}</el-tag>
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.createdAt', '空间创建时间')" prop="createdAt">
          {{ parseTime(detailForm.createdAt) }}
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.storageQuota', '存储配额')">
          {{ formatSize(detailForm.storageQuota) }}
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.storageUsed', '已使用储存')">
          {{ formatSize(detailForm.storageUsed) }}
        </el-form-item>
        <el-form-item :label="$t('page.tenantSpace.storageUsageRate', '储存使用率')">
          <span>{{ getRate(detailForm.storageQuota, detailForm.storageUsed) }}</span>
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="manage-dialog-footer">
          <el-button class="close-btn" size="large" round @click="closeDialogDetail">
            {{ t('form.button.close.detail', '关闭') }}
          </el-button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="Models">
// import { ElMessage } from 'element-plus'
// import { Close, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { isEmpty } from "@/utils/common.js";
import { formatSize } from "@/utils";
import { AjaxResult, McpEntity, TableShowColumns, TenantSpaceEntity, TenantSpaceListReq } from "@/types";
import { getStatusTheme, getStatusText } from "@/composables/useTenantSpace";
import { addTenantSpaceSingleApi, deleteTenantSpaceSingleApi, disableTenantsBatchApi, enableTenantsBatchApi, getTenantSpaceListApi, getTenantSpaceSingleApi, updateTenantSpaceSingleApi } from '@/api/space/tenantSpace.js';

interface FormEntity extends TenantSpaceEntity {
  
}
const { proxy } = getCurrentInstance()

const pageLangConfig: Record<string, string> = {
  'page.mcp.add': '新增MCP',
  'page.mcp.searchPlaceholder': '通过模型ID、模型名称、创建人进行模糊搜索',
  'page.mcp.range_separator': '至',
  'page.mcp.start_date.placeholder': '开始时间',
  'page.mcp.end_date.placeholder': '结束时间',
  'page.mcp.reset': '重置',
  'page.mcp.search': '搜索',
  'form.button.reset': '重置',
  'form.button.edit': '编辑',
  'form.button.delete': '删除',
  'form.button.enable': '启用',
  'form.button.disable': '禁用',

  'mcpServiceDialog.codeImport.toggle': '从代码导入',
  'mcpServiceDialog.codeImport.hint': '粘贴标准 mcpServers JSON 配置，自动填充表单',
  'mcpServiceDialog.codeImport.editOverwriteHint': '导入会覆盖当前表单内容（不影响已保存的凭证，需点保存生效）',
  'mcpServiceDialog.codeImport.parse': '解析并填充',
  'mcpServiceDialog.codeImport.errors.empty': '请先粘贴配置内容',
  'mcpServiceDialog.codeImport.errors.invalidJson': '无法解析，请检查 JSON 格式'
}
const t = function (key: string, params?: Record<string, string> | string) {
  let msg = pageLangConfig[key] || key
  if (params) {
    if (typeof params == 'string') {
      msg = pageLangConfig[key] || params
    } else {
      Object.keys(params).forEach((key) => {
        msg = msg.replace(`{${key}}`, params[key])
      })
    }
  }
  return msg
}
const $t = t;

const tableData = ref<McpEntity[]>([])
const tableRef = ref()
const loading = ref<boolean>(true)
// const showSearch = ref<boolean>(true)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: $t('page.tenantSpace.id', '空间id'), visible: true },
  name: { label: $t('page.tenantSpace.name', '空间名称'), visible: true },
  storageQuota: { label: $t('page.tenantSpace.storageQuota', '存储配额'), visible: true },
  storageUsed: { label: $t('page.tenantSpace.storageUsed', '已使用储存'), visible: true },
  storageRate: { label: $t('page.tenantSpace.storageRate', '储存使用率'), visible: true },
  status: { label: $t('page.tenantSpace.status', '空间状态'), visible: true },
  description: { label: $t('page.tenantSpace.description', '空间描述'), visible: true },
  createdAt: { label: $t('page.tenantSpace.createdAt', '空间创建时间'), visible: true }
})
const getRate = (quota: number, used: number) => {
  return (used / quota * 100).toFixed(2) + '%'
}

// 详情
const detailTitle = ref<string>(t('page.tenantSpace.title.detail', '空间详情'))
const detailOpen = ref<boolean>(false)
const detailForm = ref<TenantSpaceEntity>({} as TenantSpaceEntity)
const showDetail = (id: number) => {
  getTenantSpaceSingleApi(id).then((res: AjaxResult<TenantSpaceEntity>) => {
    detailForm.value = res.data || {}
    detailOpen.value = true
  })
}
const closeDialogDetail = () => {
  detailOpen.value = false
}

// // 校验登录账号
// const validateUserName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("登录账号不能为空"));
//   } else {
//     if (form.value.userId) {
//       callback();
//     } else {
//       const reg = /^[0-9a-zA-Z]*$/;
//       if (reg.test(value)) {
//         // 接口调用
//         checkUserNameValue({ name: value })
//           .then((res: any) => {
//             if (!res.data) {
//               callback();
//             } else {
//               callback(new Error("该登陆账号已被占用、请重新输入"));
//             }
//           })
//           .catch((err: any) => {
//             console.log(err);
//           });
//       } else {
//         callback(new Error("只能输入数字和字母"));
//       }
//     }
//   }
// };
// // 校验用户昵称
// const validateNickName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("用户昵称不能为空"));
//   } else {
//     const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
//     if (regex.test(value)) {
//       callback();
//     } else {
//       callback(new Error("只能输入中文、数字、字母"));
//     }
//   }
// };

const open = ref<boolean>(false)
let mode = '';
const title = ref<string>(t('page.tenantSpace.title.add', '新增空间'))
// const saveFormRef = ref(null);
const data = reactive({
  form: {
  } as FormEntity,
  queryParams: {
    name: undefined,
  } as TenantSpaceListReq,
  pageParams: {
    // orderByColumn: 'createdAt',
    // isAsc: 'desc',
    pageNum: 1,
    pageSize: 10,
  },
  rules: {
    // nickName: [
    //   { required: true, validator: validateNickName, trigger: "blur" },
    // ],
    name: [
      { required: true, message: "空间名称不能为空", trigger: "blur" },
    ],
  }
})

const { queryParams, pageParams, form, rules } = toRefs(data)

// 是否必填为空
const submitDisabled = computed(() => {
  const formValue: TenantSpaceEntity = form.value
  return (
    isEmpty(formValue.name)
  );
});

/** 查询用户列表 */
function getList() {
  loading.value = true
  const params: TenantSpaceListReq = queryParams.value;
  getTenantSpaceListApi(params, pageParams.value).then(res => {
    loading.value = false
    tableData.value = res.rows || []
    total.value = +res.total || 0
    // nextTick(() => {
    //   tableRef.value?.doLayout()
    // })
  }, () => {
    loading.value = false
  });
  handleSelectionChange([])
}

/** 搜索按钮操作 */
function handleQuery() {
  pageParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.name = undefined
  handleQuery()
}

/** 删除按钮操作 */
function handleDelete(row: TenantSpaceEntity) {
  const id = row.id!
  const message = t('page.tenantSpace.deleteConfirm', '是否确认删除空间编号为"' + id + '"的数据项？')
  proxy.$modal.confirm(message).then(function () {
    return doDelete(id)
  }, () => { });
}

function doDelete(id: number|string) {
  return deleteTenantSpaceSingleApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.tenantSpace.deleteSuccess', '删除成功'))
      getList()
    }
  })
}

// /** 导出按钮操作 */
// function handleExport() {
//   proxy.download("system/user/export", {
//     ...queryParams.value,
//   }, `user_${new Date().getTime()}.xlsx`)
// }

/** 选择条数  */
function handleSelectionChange(selection: TenantSpaceEntity[]) {
  ids.value = selection.map(item => item.id!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}
function handleRowClick(row: TenantSpaceEntity, column: any, event: PointerEvent) {
  // console.log('点击行', row, column, event)
  if (column.property === 'operation') {
    return
  }
  showDetail(row.id!)
}

/** 启用按钮操作 */
function handleEnable(row?: TenantSpaceEntity) {
  let message = '';
  let saveIds: number[] = [];
  if (row) {
    message = t('page.tenantSpace.enableConfirmSingle', '是否确认启用空间编号为"' + row.id + '"的数据项？')
    saveIds.push(row.id!)
  } else {
    if (ids.value.length === 0) {
      // proxy.$modal.msgError(t('page.tenantSpace.enableConfirm', '请选择要操作的空间'))
      return
    }
    message = t('page.tenantSpace.enableConfirmBatch', '是否确认启用选中的空间？')
    saveIds = ids.value
  }
  proxy.$modal.confirm(message).then(function () {
    return doEnable(saveIds)
  }, () => { });
}
function doEnable(saveIds: number[]) {
  return enableTenantsBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.tenantSpace.enableSuccess', '启用成功'))
      getList()
    }
  })
}

/** 停用按钮操作 */
function handleDisable(row?: TenantSpaceEntity) {
  let message = '';
  let saveIds: number[] = [];
  if (row) {
    message = t('page.tenantSpace.disableConfirmSingle', '是否确认停用空间编号为"' + row.id + '"的数据项？')
    saveIds.push(row.id!)
  } else {
    if (ids.value.length === 0) {
      // proxy.$modal.msgError(t('page.tenantSpace.disableConfirm', '请选择要操作的空间'))
      return
    }
    message = t('page.tenantSpace.disableConfirmBatch', '是否确认停用选中的空间？')
    saveIds = ids.value
  }
  proxy.$modal.confirm(message).then(function () {
    return doDisable(saveIds)
  }, () => { });
}
function doDisable(saveIds: number[]) {
  return disableTenantsBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.tenantSpace.disableSuccess', '停用成功'))
      getList()
    }
  })
}

/** 重置操作表单 */
function reset() {
  form.value = {
    name: undefined
  }
  proxy.resetForm("saveFormRef")
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  title.value = t('page.tenantSpace.title.add', '新增空间')
  open.value = true
  mode = 'add';
}

/** 修改按钮操作 */
function handleUpdate(row: TenantSpaceEntity) {
  reset()
  title.value = t('page.tenantSpace.title.update', '修改空间信息')
  const id = row?.id || ids.value[0]
  mode = 'update';
  getTenantSpaceSingleApi(id).then(res => {
    if (res?.code === 200) {
      const response: any = res.data;
      form.value = serverDataToFormData(response || {});
      open.value = true;
    }
  })
}

function serverDataToFormData(data: TenantSpaceEntity) {
  const formData = { ...data } as FormEntity;
  return formData
}
function formDataToServerData(formData: FormEntity) {
  const {
    ...serverData
  } = formData;
  return serverData
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return updateTenantSpaceSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.tenantSpace.updateSuccess', '修改成功'))
      getList()
      open.value = false
    }
  })
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return addTenantSpaceSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.tenantSpace.addSuccess', '新增成功'))
      getList()
      open.value = false
    }
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["saveFormRef"].validate((valid: boolean) => {
    if (valid) {
      if (form.value.id) {
        doUpdate()
      } else {
        doAdd()
      }
    }
  })
}
function closeDialog() {
  open.value = false
}

getList()
</script>

<style scoped lang="scss">
.el-input-number {
  width: 100%;
}

.manage-dialog-footer {
  .close-btn {
    margin-right: 12px;
  }
}

</style>

