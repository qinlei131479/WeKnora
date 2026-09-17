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

    <!-- 添加或修改抽屉 -->
    <MemberAddEditDrawer ref="memberAddEditDrawerRef" @success="getList" />
  </section>
</template>

<script setup lang="ts" name="TenantSpaceMember">
// import { Delete } from '@element-plus/icons-vue'
import { ref, reactive } from '@vue/runtime-core';
import MemberAddEditDrawer from './components/MemberAddEditDrawer.vue';
import modal from '@/plugins/modal';
import type { AjaxResult, PageDomain, TableShowColumns, TenantMemberEntity, TenantMemberListReq, TenantMemberTenantIdAndRole } from '@/types';
import {
  deleteTenantMemberSingleApi,
  disableTenantMemberApi,
  enableTenantMemberApi,
  getTenantMemberListApi
} from '@/api/space/tenantMember.js';

import { Search } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
// import { useI18n } from '@/composables/i18nMock'

import { useRoleLabel } from '@/composables/useRoleLabel';

const { t } = useI18n();
const $t = t;

const { formatRole } = useRoleLabel();

const tableData = ref<TenantMemberEntity[]>([]);
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

const memberAddEditDrawerRef = ref<InstanceType<typeof MemberAddEditDrawer>>();
const data = reactive({
  queryParams: {
    name: undefined
  } as TenantMemberListReq,
  pageParams: {
    // orderByColumn: 'createTime',
    // isAsc: 'desc',
    pageNum: 1,
    pageSize: 10
  } as PageDomain
});

const { queryParams, pageParams } = toRefs(data);

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
  modal.confirm(message).then(
    function () {
      return doDelete(id);
    },
    () => {}
  );
}

function doDelete(id: number | string) {
  return deleteTenantMemberSingleApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
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
  modal.confirm(message).then(
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
      modal.msgSuccess(msg);
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
  modal.confirm(message).then(
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
      modal.msgSuccess(msg);
      getList();
    }
  });
}

/** 新增按钮操作 */
function handleAdd() {
  memberAddEditDrawerRef.value?.openAdd();
}

/** 修改按钮操作 */
function handleUpdate(row: TenantMemberEntity) {
  const id = row?.id || ids.value[0];
  if (id === undefined) return;
  memberAddEditDrawerRef.value?.openEdit(id);
}

getList();
</script>
