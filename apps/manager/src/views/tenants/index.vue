<template>
  <section class="tenant-space-manage-page">
    <page-name>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['business:tenants:add']">{{
        $t('page.tenants.add', '添加租户')
      }}</el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.name"
              class="search-bar__input"
              :prefix-icon="Search"
              clearable
              :placeholder="$t('page.tenants.searchPlaceholder', '搜索租户名称')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>

        <div class="action-toolbar" style="display: none">
          <el-button :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']" @click="handleEnable()">
            {{ $t('page.normal.batchEnable', '批量启用') }}
          </el-button>
          <el-button :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']" @click="handleDisable()">
            {{ $t('page.normal.batchDisable', '批量停用') }}
          </el-button>
          <el-text class="selected-text"> {{ $t('page.normal.selected', '共选中') }} {{ ids.length }} {{ $t('page.normal.items', '条') }} </el-text>
        </div>
      </template>

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
          :label="$t('page.tenants.id', '租户ID')"
          align="left"
          key="id"
          prop="id"
          :width="$dim('page.tenants.id', 100)"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenants.name', '租户名称')"
          align="left"
          key="name"
          prop="name"
          :min-width="$dim('page.tenants.name', 120)"
          v-if="columns.name.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenants.storageQuota', '存储配额')"
          align="left"
          key="storageQuota"
          prop="storageQuota"
          :width="$dim('page.tenants.storageQuota', 120)"
          v-if="columns.storageQuota.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ formatSize(scope.row.storageQuota) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenants.storageUsed', '已使用储存')"
          align="left"
          key="storageUsed"
          prop="storageUsed"
          :width="$dim('page.tenants.storageUsed', 120)"
          v-if="columns.storageUsed.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ formatSize(scope.row.storageUsed) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenants.storageRate', '储存使用率')"
          align="left"
          key="storageRate"
          prop="storageRate"
          :width="$dim('page.tenants.storageRate', 120)"
          v-if="columns.storageRate.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ getRate(scope.row.storageQuota, scope.row.storageUsed) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenants.status', '状态')"
          align="left"
          key="status"
          prop="status"
          :width="$dim('page.tenants.status', 120)"
          v-if="columns.status.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <el-tag :type="getStatusTheme(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenants.description', '描述')"
          align="left"
          key="description"
          prop="description"
          :min-width="$dim('page.tenants.description', 120)"
          v-if="columns.description.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenants.createdAt', '创建时间')"
          align="left"
          prop="createdAt"
          :width="$dim('page.tenants.createdAt', 180)"
          v-if="columns.createdAt.visible"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          prop="operation"
          align="left"
          :width="$dim('page.tenants.operation', 180)"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="showDetail(scope.row.id)" v-hasPermi="['business:tenants:query']">
              {{ $t('page.normal.detail', '详情') }}
            </el-button>
            <el-button link type="primary" @click.stop="handleUpdate(scope.row)" v-hasPermi="['business:tenants:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="danger" @click.stop="handleDelete(scope.row)" v-hasPermi="['business:tenants:remove']">
              {{ $t('page.normal.remove', '删除') }}
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

    <!-- 详情抽屉 -->
    <DetailDrawer ref="detailDrawerRef" />
  </section>
</template>

<script setup lang="ts" name="TenantSpace">
import { ref, reactive } from '@vue/runtime-core';
import AddEditDrawer from './components/AddEditDrawer.vue';
import DetailDrawer from './components/DetailDrawer.vue';
// import { ElMessage } from 'element-plus'
// import { Close, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { t } from '@/i18n';
import { formatSize } from '@/utils';
import modal from '@/plugins/modal';
import { AjaxResult, TableShowColumns, TenantsVO, TenantsPageDTO } from '@/types';
import { Search } from 'lucide-vue-next';
import { API } from '@/api';

const tableData = ref<TenantsVO[]>([]);
const tableRef = ref();
const loading = ref<boolean>(true);
// const showSearch = ref<boolean>(true)
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: t('page.tenants.id', '租户id'), visible: true },
  name: { label: t('page.tenants.name', '租户名称'), visible: true },
  storageQuota: { label: t('page.tenants.storageQuota', '存储配额'), visible: true },
  storageUsed: { label: t('page.tenants.storageUsed', '已使用储存'), visible: true },
  storageRate: { label: t('page.tenants.storageRate', '储存使用率'), visible: true },
  status: { label: t('page.tenants.status', '租户状态'), visible: true },
  description: { label: t('page.tenants.description', '租户描述'), visible: true },
  createdAt: { label: t('page.tenants.createdAt', '租户创建时间'), visible: true }
});
const getRate = (quota?: number, used?: number) => {
  if (quota == null || used == null) return '';
  return ((used / quota) * 100).toFixed(2) + '%';
};

function getStatusTheme(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'suspended':
      return 'danger';
    default:
      return 'default';
  }
}

function getStatusText(status: string | undefined): string {
  switch (status) {
    case 'active':
      return t('tenant.statusActive', '活跃');
    case 'inactive':
      return t('tenant.statusInactive', '未激活');
    case 'suspended':
      return t('tenant.statusSuspended', '已暂停');
    default:
      return t('tenant.statusUnknown', '未知');
  }
}

// 详情
const detailDrawerRef = ref<InstanceType<typeof DetailDrawer>>();
const showDetail = (id: number) => {
  detailDrawerRef.value?.open(id);
};

const addEditDrawerRef = ref<InstanceType<typeof AddEditDrawer>>();
const data = reactive({
  queryParams: {
    name: undefined
  } as TenantsPageDTO,
  pageParams: {
    // orderByColumn: 'createdAt',
    // isAsc: 'desc',
    pageNum: 1,
    pageSize: 10
  }
});

const { queryParams, pageParams } = toRefs(data);

/** 查询用户列表 */
function getList() {
  loading.value = true;
  const params: TenantsPageDTO = queryParams.value;
  API.Tenants.list(params, pageParams.value).then(
    (res) => {
      loading.value = false;
      tableData.value = res.rows || ([] as TenantsVO[]);
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
function handleDelete(row: TenantsVO) {
  const id = row.id!;
  const message = t('page.tenants.deleteConfirm', '是否确认删除租户编号为"' + id + '"的数据项？');
  modal.confirm(message).then(
    function () {
      return doDelete(id);
    },
    () => {}
  );
}

function doDelete(id: number | string) {
  return API.Tenants.delete(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenants.deleteSuccess', '删除成功'));
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
function handleSelectionChange(selection: TenantsVO[]) {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
function handleRowClick(row: TenantsVO, column: any, event: PointerEvent) {
  // console.log('点击行', row, column, event)
  if (column.property === 'operation') {
    return;
  }
  // showDetail(row.id!);
}

/** 启用按钮操作 */
function handleEnable(row?: TenantsVO) {
  let message = '';
  let saveIds: number[] = [];
  if (row) {
    message = t('page.tenants.enableConfirmSingle', '是否确认启用租户编号为"' + row.id + '"的数据项？');
    saveIds.push(row.id!);
  } else {
    if (ids.value.length === 0) {
      // modal.msgError(t('page.tenants.enableConfirm', '请选择要操作的租户'))
      return;
    }
    message = t('page.tenants.enableConfirmBatch', '是否确认启用选中的租户？');
    saveIds = ids.value;
  }
  modal.confirm(message).then(
    function () {
      return doEnable(saveIds);
    },
    () => {}
  );
}
function doEnable(saveIds: number[]) {
  return API.Tenants.enableBatch(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenants.enableSuccess', '启用成功'));
      getList();
    }
  });
}

/** 停用按钮操作 */
function handleDisable(row?: TenantsVO) {
  let message = '';
  let saveIds: number[] = [];
  if (row) {
    message = t('page.tenants.disableConfirmSingle', '是否确认停用租户编号为"' + row.id + '"的数据项？');
    saveIds.push(row.id!);
  } else {
    if (ids.value.length === 0) {
      // modal.msgError(t('page.tenants.disableConfirm', '请选择要操作的租户'))
      return;
    }
    message = t('page.tenants.disableConfirmBatch', '是否确认停用选中的租户？');
    saveIds = ids.value;
  }
  modal.confirm(message).then(
    function () {
      return doDisable(saveIds);
    },
    () => {}
  );
}
function doDisable(saveIds: number[]) {
  return API.Tenants.disableBatch(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenants.disableSuccess', '停用成功'));
      getList();
    }
  });
}

/** 新增按钮操作 */
function handleAdd() {
  addEditDrawerRef.value?.openAdd();
}

/** 修改按钮操作 */
function handleUpdate(row: TenantsVO) {
  const id = row?.id || ids.value[0];
  if (id === undefined) return;
  addEditDrawerRef.value?.openEdit(id);
}

getList();
</script>
