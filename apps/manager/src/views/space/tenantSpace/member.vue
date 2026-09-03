<template>
  <section class="tenant-space-member-manage-page">
    <page-name class="page-name">
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['business:users:add']">{{
        $t('page.tenantMember.add', '添加成员')
      }}</el-button>
    </page-name>

    <page-content>
      <div class="search-bar">
        <div class="search-bar__keyword">
          <el-input
            v-model="queryParams.name"
            class="search-bar__input"
            clearable
            :prefix-icon="Search"
            :placeholder="$t('page.tenantMember.searchPlaceholder', '搜索成员名称')"
            @keyup.enter="handleQuery"
          />
        </div>

        <!-- <el-date-picker v-model="dateRange" class="search-bar__date" value-format="YYYY-MM-DD" type="daterange"
          :range-separator="$t('page.mcp.range_separator')"
          :start-placeholder="$t('page.mcp.start_date.placeholder')"
          :end-placeholder="$t('page.mcp.end_date.placeholder')" /> -->

        <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
        <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
      </div>

      <div class="action-toolbar" style="display: none">
        <div class="action-toolbar__left">
          <!-- <button type="button" class="toolbar-btn" :disabled="multiple" v-hasPermi="['system:dict:remove']"
            @click="handleRemove()">
            批量删除
          </button> -->
          <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:users:edit']" @click="handleEnable()">
            {{ $t('page.batchEnable', '批量启用') }}
          </button>
          <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:users:edit']" @click="handleDisable()">
            {{ $t('page.batchDisable', '批量停用') }}
          </button>
          <span class="selected-text"
            >{{ $t('page.selected', '共选中') }} <span>{{ ids.length }}</span> {{ $t('page.items', '条') }}</span
          >
        </div>

        <div class="action-toolbar__right">
          <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:export']" @click="handleExport">导出</button> -->
          <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:remove']"
            @click="handleRefreshCache">刷新缓存</button> -->
          <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" /> -->
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        height="100%"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          :label="$t('page.tenantMember.id', '成员ID')"
          align="left"
          key="id"
          prop="id"
          :width="$dim('page.tenantMember.id', 300)"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenantMember.username', '成员名称')"
          align="left"
          key="username"
          prop="username"
          :width="$dim('page.tenantMember.username', 120)"
          v-if="columns.username.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenantMember.tenants', '关联空间&空间角色')"
          align="left"
          key="tenants"
          prop="tenants"
          :min-width="$dim('page.tenantMember.tenants', 120)"
          v-if="columns.tenants.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{
              scope.row.tenants?.map((item: TenantMemberTenantIdAndRole) => `${item.tenantName}-${formatRole(item.role)}`).join(';') || '-'
            }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenantMember.email', '登录账号')"
          align="left"
          key="email"
          prop="email"
          :min-width="$dim('page.tenantMember.email', 100)"
          v-if="columns.email.visible"
          :show-overflow-tooltip="true"
        >
          <!-- <template #default="scope">
            <span>{{ scope.row.email }}</span>
          </template> -->
        </el-table-column>
        <el-table-column
          :label="$t('page.tenantMember.createdAt', '注册时间')"
          align="left"
          key="createdAt"
          prop="createdAt"
          :width="$dim('page.normal.datetime', 180)"
          v-if="columns.createdAt.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column :label="$t('page.tenantMember.status', '空间状态')" align="left" key="status" prop="status"
          min-width="120" v-if="columns.status.visible" :show-overflow-tooltip="true">
          <template #default="scope">
            <el-tag :type="getStatusTheme(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column> -->

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
        <!-- <el-table-column label="空间创建时间" align="left" prop="createTime" min-width="170"
          v-if="columns.createTime.visible">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column> -->
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          prop="operation"
          align="left"
          :width="$dim('page.tenantMember.operation', 220)"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['business:users:edit']">
              {{ $t('page.normal.edit') }}
            </el-button>
            <el-button link type="danger" @click="handleRemove(scope.row)" v-hasPermi="['business:users:remove']">
              {{ $t('page.normal.remove') }}
            </el-button>
            <el-button v-if="!scope.row.isActive" link type="info" @click="handleEnable(scope.row)" v-hasPermi="['business:users:edit']">
              {{ $t('page.normal.enable') }}
            </el-button>
            <el-button v-else link type="info" @click="handleDisable(scope.row)" v-hasPermi="['business:users:edit']">
              {{ $t('page.normal.disable') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <!-- 添加或修改对话框 -->
    <KJSCDialogV2
      :title="title"
      v-model="open"
      width="800px"
      append-to-body
      @open="handleSaveModelOpen"
      @close="handleSaveModelClose"
      custom-class="manage-dialog tenant-space-form-dialog"
      :showCloseBtn="false"
      :showSubitBtn="false"
    >
      <el-form
        :model="form"
        :rules="mode === 'add' ? addRules : editRules"
        ref="saveFormRef"
        label-position="left"
        class="tenant-space-form"
        :label-width="$dim('page.tenantMember.formLabel', 120)"
      >
        <el-row>
          <el-col :span="12">
            <el-form-item :label="$t('page.tenantMember.username', '成员名称')" prop="username">
              <el-input
                v-model="form.username"
                :placeholder="$t('page.tenantMember.usernamePlaceholder', '请输入成员名称')"
                maxlength="999"
                :show-word-limit="false"
                :disabled="mode === 'edit'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('page.tenantMember.password', '密码')" prop="password" label-position="right">
              <el-input
                v-model="form.password"
                type="password"
                show-password
                autocomplete="new-password"
                :placeholder="$t('page.tenantMember.passwordPlaceholder', '请输入账号密码')"
                maxlength="999"
                :show-word-limit="false"
                :disabled="mode === 'edit'"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('page.tenantMember.email', '登录账号')" prop="email">
          <el-input v-model="form.email" :placeholder="$t('page.tenantMember.emailPlaceholder', '请输入登录账号')" :disabled="mode === 'edit'" />
        </el-form-item>
        <el-form-item :label="$t('page.tenantMember.spaceAndRole', '空间&角色')" prop="bindTenants">
          <div class="space-and-role">
            <div class="add-area">
              <el-button type="primary" size="small" @click="addBindTenant">
                {{ $t('page.normal.addNew', '新增') }}
              </el-button>
            </div>
            <div class="list-area">
              <div v-for="(item, index) in form.bindTenants" :key="index" class="item-area">
                <el-select-v2
                  v-model="item.tenantId"
                  :options="tenantOptions"
                  filterable
                  :props="{ value: 'id', label: 'name' }"
                  :placeholder="$t('page.tenantMember.spacePlaceholder', '请选择空间')"
                />
                <el-select-v2
                  v-model="item.role"
                  :options="tenantRoleOptions"
                  filterable
                  :placeholder="$t('page.tenantMember.rolePlaceholder', '请选择角色')"
                />
                <el-button type="danger" text @click="removeBindTenant(index)">
                  <el-icon><Trash /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #prefixFooter>
        <div class="manage-dialog-footer">
          <el-button @click="closeDialog">
            {{ t('page.normal.cancel', '取消') }}
          </el-button>
          <el-button type="primary" :disabled="submitDisabled" @click="submitForm">
            {{ t('page.normal.save', '保存') }}
          </el-button>
        </div>
      </template>
    </KJSCDialogV2>
  </section>
</template>

<script setup lang="ts" name="TenantSpaceMember">
// import { Delete } from '@element-plus/icons-vue'
import { ref, reactive } from '@vue/runtime-core';
import {
  AjaxResult,
  McpEntity,
  PageDomain,
  TableShowColumns,
  TenantMemberEntity,
  TenantMemberListReq,
  TenantMemberTenantIdAndRole,
  TenantSpaceEntity,
  ValueLabelOption
} from '@/types';
import {
  addTenantMemberSingleApi,
  deleteTenantMemberSingleApi,
  disableTenantMemberApi,
  enableTenantMemberApi,
  getTenantMemberListApi,
  getTenantMemberSingleApi,
  updateTenantMemberSingleApi
} from '@/api/space/tenantMember.js';

import { Search, Trash } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
// import { useI18n } from '@/composables/i18nMock'

import { useRoleLabel, useRoleOptions } from '@/composables/useRoleLabel';
import { getTenantSpaceListApi } from '@/api/space/tenantSpace';

interface FormEntity extends TenantMemberEntity {
  bindTenants: TenantMemberTenantIdAndRole[];
}
const { proxy } = getCurrentInstance();

const { t } = useI18n();
const $t = t;

const { formatRole } = useRoleLabel();

const tableData = ref<McpEntity[]>([]);
const tableRef = ref();
const loading = ref<boolean>(true);
// const showSearch = ref<boolean>(true)
const ids = ref<string[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: $t('page.tenantMember.id', '成员ID'), visible: true },
  username: { label: $t('page.tenantMember.username', '成员名称'), visible: true },
  tenants: { label: $t('page.tenantMember.tenants', '关联空间&空间角色'), visible: true },
  email: { label: $t('page.tenantMember.email', '登录账号'), visible: true },
  createdAt: { label: $t('page.tenantMember.createdAt', '注册时间'), visible: true }
});

const open = ref<boolean>(false);
let mode = '';
const title = ref<string>(t('page.tenantMember.addTitle', '新增空间成员'));
// const saveFormRef = ref(null);
const validateBindTenants = (rule: any, value: TenantMemberTenantIdAndRole[], callback: Function) => {
  if (!value || value.length === 0) {
    callback(new Error($t('page.tenantMember.error.tenants.empty', '关联空间&空间角色不能为空')));
  } else {
    let errorMsg = null;
    value.some((item: TenantMemberTenantIdAndRole) => {
      if (!item.tenantId) {
        errorMsg = $t('page.tenantMember.error.tenants.space', '关联空间不能为空');
        return true;
      } else if (!item.role) {
        errorMsg = $t('page.tenantMember.error.tenants.role', '关联角色不能为空');
        return true;
      }
    });
    if (errorMsg) {
      callback(new Error(errorMsg));
    } else {
      callback();
    }
  }
};
interface DataType {
  form: FormEntity;
  queryParams: TenantMemberListReq;
  pageParams: PageDomain;
  addRules: Record<string, any>;
  editRules: Record<string, any>;
}
const data = reactive<DataType>({
  form: {
    bindTenants: []
  } as FormEntity,
  queryParams: {
    name: undefined
  },
  pageParams: {
    // orderByColumn: 'createTime',
    // isAsc: 'desc',
    pageNum: 1,
    pageSize: 10
  },
  addRules: {
    username: [{ required: true, message: $t('page.tenantMember.error.username', '租户成员名称不能为空'), trigger: 'blur' }],
    password: [{ required: true, message: $t('page.tenantMember.error.password', '密码不能为空'), trigger: 'blur' }],
    email: [{ required: true, message: $t('page.tenantMember.error.email', '登录账号不能为空'), trigger: 'blur' }],
    bindTenants: [{ validator: validateBindTenants, trigger: 'change' }]
  },
  editRules: {
    bindTenants: [{ validator: validateBindTenants, trigger: 'change' }]
  }
  // rules: {
  //   // nickName: [
  //   //   { required: true, validator: validateNickName, trigger: "blur" },
  //   // ],
  //   username: [
  //     { required: true, message: "租户成员名称不能为空", trigger: "blur" },
  //   ],
  // }
});

const { queryParams, pageParams, form, addRules, editRules } = toRefs(data);

const tenantOptions = ref<TenantSpaceEntity[]>([]);
const tenantRoleOptions = ref<ValueLabelOption[]>(useRoleOptions());
// const bindTenants = ref<TenantMemberEntity[]>([{
//   tenantId: undefined,
//   roleId: undefined,
// }])

const addBindTenant = () => {
  form.value.bindTenants.push({
    tenantId: undefined,
    roleId: undefined
  });
};
const removeBindTenant = (index: number) => {
  if (form.value.bindTenants.length <= 1) {
    return;
  }
  form.value.bindTenants.splice(index, 1);
};

// 是否必填为空
const submitDisabled = computed(() => {
  const formValue: TenantMemberEntity = form.value;
  return (
    // isEmpty(formValue.username)
    false
  );
});

const getTenantOptions = () => {
  getTenantSpaceListApi({}, { pageNum: 1, pageSize: 9999 }).then((res) => {
    tenantOptions.value = res.rows || [];
  });
};
const handleSaveModelOpen = () => {
  getTenantOptions();
};
const handleSaveModelClose = () => {
  // reset()
};

/** 查询用户列表 */
function getList() {
  loading.value = true;
  const params: TenantMemberListReq = queryParams.value;
  getTenantMemberListApi(params, pageParams.value).then(
    (res) => {
      loading.value = false;
      tableData.value = res.rows || [];
      total.value = +res.total || 0;
      // nextTick(() => {
      //   tableRef.value?.doLayout()
      // })
    },
    () => {
      loading.value = false;
    }
  );
  handleSelectionChange([]);
}

/** 搜索按钮操作 */
function handleQuery() {
  pageParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.name = undefined;
  handleQuery();
}

/** 删除按钮操作 */
function handleRemove(row: TenantMemberEntity) {
  const id = row.id!;
  const message = t('page.tenantMember.confirmInfo.remove', { id: id }, `是否确认删除成员编号为${id}的数据项？`);
  proxy.$modal.confirm(message).then(
    function () {
      return doDelete(id);
    },
    () => {}
  );
}

function doDelete(id: number | string) {
  return deleteTenantMemberSingleApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
      getList();
    }
  });
}

// /** 导出按钮操作 */
// function handleExport() {
//   proxy.download("system/user/export", {
//     ...queryParams.value,
//   }, `user_${new Date().getTime()}.xlsx`)
// }

/** 选择条数  */
function handleSelectionChange(selection: TenantMemberEntity[]) {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
function handleRowClick(row: TenantMemberEntity, column: any) {
  // if (column.property === 'operation') {
  //   return
  // }
  // showDetail(row.id!)
}

/** 启用按钮操作 */
function handleEnable(row?: TenantMemberEntity) {
  if (!row) {
    return;
  }
  let message = '';
  let saveIds: (number | string)[] = [];
  let isBatch = false;
  if (row && row.id) {
    message = t('page.tenantMember.confirmInfo.enable', { username: row.username }, `是否确认启用成员名称为${row.username}的数据项？`);
    saveIds.push(row.id);
  } else {
    if (ids.value.length === 0) {
      // proxy.$modal.msgError(t('page.tenantMember.confirm.enableConfirm', '请选择要操作的空间'))
      return;
    }
    isBatch = true;
    message = t('page.tenantMember.confirmInfo.enableBatch', '是否确认启用选中的成员？');
    saveIds = ids.value;
    return;
  }
  proxy.$modal.confirm(message).then(
    function () {
      return doEnable(saveIds, isBatch);
    },
    () => {}
  );
}
function doEnable(saveIds: (number | string)[], isBatch: boolean) {
  return enableTenantMemberApi(saveIds[0]).then((res: AjaxResult) => {
    if (res.code === 200) {
      const msg = isBatch ? t('page.normal.confirmInfo.batchEnableSuccess', '批量启用成功') : t('page.normal.confirmInfo.enableSuccess', '启用成功');
      proxy.$modal.msgSuccess(msg);
      getList();
    }
  });
}

/** 停用按钮操作 */
function handleDisable(row?: TenantMemberEntity) {
  if (!row) {
    return;
  }
  let message = '';
  let saveIds: (number | string)[] = [];
  let isBatch = false;
  if (row && row.id) {
    message = t('page.tenantMember.confirmInfo.disableConfirmSingle', { username: row.username }, `是否确认禁用成员名称为${row.username}的数据项？`);
    saveIds.push(row.id);
  } else {
    if (ids.value.length === 0) {
      // proxy.$modal.msgError(t('page.tenantMember.disableConfirm', '请选择要操作的空间'))
      return;
    }
    message = t('page.tenantMember.confirm.disableConfirmBatch', '是否确认禁用选中的成员？');
    saveIds = ids.value;
    isBatch = true;
    return;
  }
  proxy.$modal.confirm(message).then(
    function () {
      return doDisable(saveIds, isBatch);
    },
    () => {}
  );
}
function doDisable(saveIds: (number | string)[], isBatch: boolean) {
  return disableTenantMemberApi(saveIds[0]).then((res: AjaxResult) => {
    if (res.code === 200) {
      const msg = isBatch
        ? t('page.normal.confirmInfo.batchDisableSuccess', '批量停用成功')
        : t('page.normal.confirmInfo.disableSuccess', '停用成功');
      proxy.$modal.msgSuccess(msg);
      getList();
    }
  });
}

/** 重置操作表单 */
function reset() {
  form.value = {
    bindTenants: [
      {
        tenantId: undefined,
        role: undefined
      }
    ] as TenantMemberTenantIdAndRole[]
  };
  proxy.resetForm('saveFormRef');
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  title.value = t('page.tenantMember.addTitle', '新增成员');
  open.value = true;
  mode = 'add';
}

/** 修改按钮操作 */
function handleUpdate(row: TenantMemberEntity) {
  reset();
  title.value = t('page.tenantMember.updateTitle', '修改成员信息');
  const id = row?.id || ids.value[0];
  mode = 'edit';
  getTenantMemberSingleApi(id).then((res) => {
    if (res?.code === 200) {
      const response: any = res.data;
      form.value = serverDataToFormData(response || {});
      open.value = true;
    }
  });
}

function serverDataToFormData(data: TenantMemberEntity) {
  const formData = { ...data } as FormEntity;
  formData.bindTenants = data.tenants || [];
  return formData;
}
function formDataToServerData(formData: FormEntity) {
  const { bindTenants, ...serverData } = formData;
  serverData.tenants = bindTenants || [];
  return serverData;
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return updateTenantMemberSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'));
      getList();
      open.value = false;
    }
  });
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return addTenantMemberSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'));
      getList();
      open.value = false;
    }
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs['saveFormRef'].validate((valid: boolean) => {
    if (valid) {
      if (form.value.id) {
        doUpdate();
      } else {
        doAdd();
      }
    }
  });
}
function closeDialog() {
  open.value = false;
}

getList();
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

.space-and-role {
  width: 100%;
  .add-area {
    margin-bottom: 12px;
  }
  .list-area {
    overflow: auto;
    max-height: 400px;
    .item-area {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .el-select {
        // width: 48%;
        + .el-select {
          margin-left: 12px;
        }
      }
    }
  }
}
</style>
