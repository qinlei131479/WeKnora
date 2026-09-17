<template>
  <section class="tenant-space-manage-page">
    <page-name>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['business:tenants:add']">{{
        $t('page.tenantSpace.add', '添加空间')
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
              :placeholder="$t('page.tenantSpace.searchPlaceholder', '搜索空间名称')"
              @keyup.enter="handleQuery"
            />
          </div>

          <!-- <div class="search-bar__date-wrap">
            <el-date-picker
              v-model="dateRange"
              class="search-bar__date"
              value-format="YYYY-MM-DD"
              type="daterange"
              :range-separator="$t('page.mcp.range_separator')"
              :start-placeholder="$t('page.mcp.start_date.placeholder')"
              :end-placeholder="$t('page.mcp.end_date.placeholder')"
            />
          </div> -->

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
          :label="$t('page.tenantSpace.id', '空间id')"
          align="left"
          key="id"
          prop="id"
          :width="$dim('page.tenantSpace.id', 100)"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenantSpace.name', '空间名称')"
          align="left"
          key="name"
          prop="name"
          :min-width="$dim('page.tenantSpace.name', 120)"
          v-if="columns.name.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.tenantSpace.storageQuota', '存储配额')"
          align="left"
          key="storageQuota"
          prop="storageQuota"
          :width="$dim('page.tenantSpace.storageQuota', 120)"
          v-if="columns.storageQuota.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ formatSize(scope.row.storageQuota) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenantSpace.storageUsed', '已使用储存')"
          align="left"
          key="storageUsed"
          prop="storageUsed"
          :width="$dim('page.tenantSpace.storageUsed', 120)"
          v-if="columns.storageUsed.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ formatSize(scope.row.storageUsed) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenantSpace.storageRate', '储存使用率')"
          align="left"
          key="storageRate"
          prop="storageRate"
          :width="$dim('page.tenantSpace.storageRate', 120)"
          v-if="columns.storageRate.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ getRate(scope.row.storageQuota, scope.row.storageUsed) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenantSpace.status', '空间状态')"
          align="left"
          key="status"
          prop="status"
          :width="$dim('page.tenantSpace.status', 120)"
          v-if="columns.status.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <el-tag :type="getStatusTheme(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.tenantSpace.description', '空间描述')"
          align="left"
          key="description"
          prop="description"
          :min-width="$dim('page.tenantSpace.description', 120)"
          v-if="columns.description.visible"
          :show-overflow-tooltip="true"
        />

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
        <el-table-column
          :label="$t('page.tenantSpace.createdAt', '空间创建时间')"
          align="left"
          prop="createdAt"
          :width="$dim('page.tenantSpace.createdAt', 180)"
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
          :width="$dim('page.tenantSpace.operation', 180)"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="showDetail(scope.row.id)" v-hasPermi="['business:tenants:query']">
              {{ $t('page.normal.detail') }}
            </el-button>
            <el-button link type="primary" @click.stop="handleUpdate(scope.row)" v-hasPermi="['business:tenants:edit']">
              {{ $t('page.normal.edit') }}
            </el-button>
            <el-button link type="danger" @click.stop="handleDelete(scope.row)" v-hasPermi="['business:tenants:remove']">
              {{ $t('page.normal.remove') }}
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

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <!-- 添加或修改抽屉 -->
    <SpaceAddEditDrawer ref="spaceAddEditDrawerRef" @success="getList" />

    <!-- 详情抽屉 -->
    <SpaceDetailDrawer ref="spaceDetailDrawerRef" />
  </section>
</template>

<script setup lang="ts" name="TenantSpace">
import { ref, reactive } from '@vue/runtime-core';
import SpaceAddEditDrawer from './components/SpaceAddEditDrawer.vue';
import SpaceDetailDrawer from './components/SpaceDetailDrawer.vue';
// import { ElMessage } from 'element-plus'
// import { Close, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n';
import { formatSize } from '@/utils';
import modal from '@/plugins/modal';
import { AjaxResult, TableShowColumns, TenantSpaceEntity, TenantSpaceListReq } from '@/types';
import { getStatusTheme, getStatusText } from '@/composables/useTenantSpace';
import { Search } from 'lucide-vue-next';
import {
  deleteTenantSpaceSingleApi,
  disableTenantsBatchApi,
  enableTenantsBatchApi,
  getTenantSpaceListApi
} from '@/api/space/tenantSpace.js';

const { t } = useI18n();

const $t = t;

const tableData = ref<TenantSpaceEntity[]>([]);
const tableRef = ref();
const loading = ref<boolean>(true);
// const showSearch = ref<boolean>(true)
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
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
});
const getRate = (quota: number, used: number) => {
  return ((used / quota) * 100).toFixed(2) + '%';
};

// 详情
const spaceDetailDrawerRef = ref<InstanceType<typeof SpaceDetailDrawer>>();
const showDetail = (id: number) => {
  spaceDetailDrawerRef.value?.open(id);
};

const spaceAddEditDrawerRef = ref<InstanceType<typeof SpaceAddEditDrawer>>();
const data = reactive({
  queryParams: {
    name: undefined
  } as TenantSpaceListReq,
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
  const params: TenantSpaceListReq = queryParams.value;
  getTenantSpaceListApi(params, pageParams.value).then(
    (res) => {
      loading.value = false;
      tableData.value = res.rows || ([] as TenantSpaceEntity[]);
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
function handleDelete(row: TenantSpaceEntity) {
  const id = row.id!;
  const message = t('page.tenantSpace.deleteConfirm', '是否确认删除空间编号为"' + id + '"的数据项？');
  modal.confirm(message).then(
    function () {
      return doDelete(id);
    },
    () => {}
  );
}

function doDelete(id: number | string) {
  return deleteTenantSpaceSingleApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenantSpace.deleteSuccess', '删除成功'));
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
function handleSelectionChange(selection: TenantSpaceEntity[]) {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
function handleRowClick(row: TenantSpaceEntity, column: any, event: PointerEvent) {
  // console.log('点击行', row, column, event)
  if (column.property === 'operation') {
    return;
  }
  // showDetail(row.id!);
}

/** 启用按钮操作 */
function handleEnable(row?: TenantSpaceEntity) {
  let message = '';
  let saveIds: number[] = [];
  if (row) {
    message = t('page.tenantSpace.enableConfirmSingle', '是否确认启用空间编号为"' + row.id + '"的数据项？');
    saveIds.push(row.id!);
  } else {
    if (ids.value.length === 0) {
      // modal.msgError(t('page.tenantSpace.enableConfirm', '请选择要操作的空间'))
      return;
    }
    message = t('page.tenantSpace.enableConfirmBatch', '是否确认启用选中的空间？');
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
  return enableTenantsBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenantSpace.enableSuccess', '启用成功'));
      getList();
    }
  });
}

/** 停用按钮操作 */
function handleDisable(row?: TenantSpaceEntity) {
  let message = '';
  let saveIds: number[] = [];
  if (row) {
    message = t('page.tenantSpace.disableConfirmSingle', '是否确认停用空间编号为"' + row.id + '"的数据项？');
    saveIds.push(row.id!);
  } else {
    if (ids.value.length === 0) {
      // modal.msgError(t('page.tenantSpace.disableConfirm', '请选择要操作的空间'))
      return;
    }
    message = t('page.tenantSpace.disableConfirmBatch', '是否确认停用选中的空间？');
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
  return disableTenantsBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenantSpace.disableSuccess', '停用成功'));
      getList();
    }
  });
}

/** 新增按钮操作 */
function handleAdd() {
  spaceAddEditDrawerRef.value?.openAdd();
}

/** 修改按钮操作 */
function handleUpdate(row: TenantSpaceEntity) {
  const id = row?.id || ids.value[0];
  if (id === undefined) return;
  spaceAddEditDrawerRef.value?.openEdit(id);
}

getList();
</script>
