<template>
  <section class="tenant-space-member-manage-page">
    <page-name class="page-name">
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['business:users:add']">{{ $t('page.users.add', '新增成员') }}</el-button>
    </page-name>

    <page-content>
      <div class="search-bar">
        <div class="search-bar__keyword">
          <el-input
            v-model="queryParams.name"
            class="search-bar__input"
            clearable
            :prefix-icon="Search"
            :placeholder="$t('page.users.searchPlaceholder', '搜索成员名称')"
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
        <el-table-column
          :label="$t('page.users.account', '账号')"
          align="left"
          key="account"
          prop="account"
          :min-width="$dim('page.users.account', 120)"
          v-if="columns.account.visible"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('page.users.username', '用户名')"
          align="left"
          key="username"
          prop="username"
          :min-width="$dim('page.users.username', 120)"
          v-if="columns.username.visible"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('page.users.email', '邮箱')"
          align="left"
          key="email"
          prop="email"
          :min-width="$dim('page.users.email', 130)"
          v-if="columns.email.visible"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('page.users.tenants', '租户&角色')"
          align="left"
          key="tenants"
          prop="tenants"
          :min-width="$dim('page.users.tenants', 200)"
          v-if="columns.tenants.visible"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.tenants" v-for="item in row.tenants" style="margin: 4px 0">
              <span>{{ item.tenantName || 'NULL' }}</span>
              <el-tag type="info" effect="dark" size="small" round style="margin-left: 5px">{{ formatRole(item.role) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.users.createdAt', '注册时间')"
          align="center"
          key="createdAt"
          prop="createdAt"
          :min-width="$dim('page.users.createdAt', 150)"
          v-if="columns.createdAt.visible"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.users.isActive', '状态')"
          align="center"
          key="isActive"
          prop="isActive"
          :min-width="$dim('page.users.isActive', 80)"
          v-if="columns.isActive.visible"
        >
          <template #default="{ row }">
            <el-tag v-if="row.isActive === true" type="success">{{ $t('page.normal.enable', '启用') }}</el-tag>
            <el-tag v-else-if="row.isActive === false" type="info">{{ $t('page.normal.disable', '停用') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          prop="operation"
          align="center"
          :width="$dim('page.users.operation', 220)"
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
    <AddEditDrawer ref="addEditDrawerRef" @success="getList" />
  </section>
</template>

<script setup lang="ts" name="TenantSpaceMember">
// import { Delete } from '@element-plus/icons-vue'
import { ref, reactive } from '@vue/runtime-core';
import AddEditDrawer from './components/AddEditDrawer.vue';
import modal from '@/plugins/modal';
import type { AjaxResult, PageDomain, TableShowColumns, UsersVO, UsersPageDTO } from '@/types';
import { API } from '@/api';

import { Search } from 'lucide-vue-next';
import { t } from '@/i18n';
// import { useI18n } from '@/composables/i18nMock'

import { useRoleLabel } from '@/composables/useRoleLabel';

const $t = t;

const { formatRole } = useRoleLabel();

const tableData = ref<UsersVO[]>([]);
const tableRef = ref();
const loading = ref<boolean>(true);
// const showSearch = ref<boolean>(true)
const ids = ref<string[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  account: { label: $t('page.users.account', '账号'), visible: true },
  username: { label: $t('page.users.username', '用户名'), visible: true },
  email: { label: $t('page.users.email', '邮箱'), visible: true },
  tenants: { label: $t('page.users.tenants', '租户&角色'), visible: true },
  createdAt: { label: $t('page.users.createdAt', '注册时间'), visible: true },
  isActive: { label: $t('page.users.isActive', '状态'), visible: true }
});

const addEditDrawerRef = ref<InstanceType<typeof AddEditDrawer>>();
const data = reactive({
  queryParams: {
    name: undefined
  } as UsersPageDTO,
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
  const params: UsersPageDTO = queryParams.value;
  API.Users.list(params, pageParams.value).then(
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
function handleRemove(row: UsersVO) {
  const id = row.id!;
  const message = t('page.users.confirmInfo.remove', { id: id }, `是否确认删除成员编号为${id}的数据项？`);
  modal.confirm(message).then(
    function () {
      return doDelete(id);
    },
    () => {}
  );
}

function doDelete(id: number | string) {
  return API.Users.delete(id).then((res: AjaxResult) => {
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
function handleSelectionChange(selection: UsersVO[]) {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
function handleRowClick(row: UsersVO, column: any) {
  // if (column.property === 'operation') {
  //   return
  // }
  // showDetail(row.id!)
}

/** 启用按钮操作 */
function handleEnable(row?: UsersVO) {
  if (!row) {
    return;
  }
  let message = '';
  let saveIds: (number | string)[] = [];
  let isBatch = false;
  if (row && row.id) {
    message = t('page.users.confirmInfo.enable', { username: row.username }, `是否确认启用成员名称为${row.username}的数据项？`);
    saveIds.push(row.id);
  } else {
    if (ids.value.length === 0) {
      // proxy.$modal.msgError(t('page.users.confirm.enableConfirm', '请选择要操作的空间'))
      return;
    }
    isBatch = true;
    message = t('page.users.confirmInfo.enableBatch', '是否确认启用选中的成员？');
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
  return API.Users.enable(saveIds[0]).then((res: AjaxResult) => {
    if (res.code === 200) {
      const msg = isBatch ? t('page.normal.confirmInfo.batchEnableSuccess', '批量启用成功') : t('page.normal.confirmInfo.enableSuccess', '启用成功');
      modal.msgSuccess(msg);
      getList();
    }
  });
}

/** 停用按钮操作 */
function handleDisable(row?: UsersVO) {
  if (!row) {
    return;
  }
  let message = '';
  let saveIds: (number | string)[] = [];
  let isBatch = false;
  if (row && row.id) {
    message = t('page.users.confirmInfo.disableConfirmSingle', { username: row.username }, `是否确认禁用成员名称为${row.username}的数据项？`);
    saveIds.push(row.id);
  } else {
    if (ids.value.length === 0) {
      // proxy.$modal.msgError(t('page.users.disableConfirm', '请选择要操作的空间'))
      return;
    }
    message = t('page.users.confirm.disableConfirmBatch', '是否确认禁用选中的成员？');
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
  return API.Users.disable(saveIds[0]).then((res: AjaxResult) => {
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
  addEditDrawerRef.value?.openAdd();
}

/** 修改按钮操作 */
function handleUpdate(row: UsersVO) {
  const id = row?.id || ids.value[0];
  if (id === undefined) return;
  addEditDrawerRef.value?.openEdit(id);
}

getList();
</script>
