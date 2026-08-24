<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.userName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              :placeholder="$t('page.system.logininfor.search.userNamePlaceholder', '请输入用户名称')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-model="queryParams.status"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.logininfor.search.statusPlaceholder', '登录状态')"
          >
            <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            style="max-width: 250px"
            :range-separator="$t('page.system.logininfor.search.rangeSeparator', '至')"
            :start-placeholder="$t('page.system.logininfor.search.startTimePlaceholder', '开始时间')"
            :end-placeholder="$t('page.system.logininfor.search.endTimePlaceholder', '结束时间')"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table
        ref="logininforRef"
        v-loading="loading"
        :data="logininforList"
        height="100%"
        :default-sort="defaultSort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          :label="$t('page.system.logininfor.table.infoId', '访问编号')"
          prop="infoId"
          :min-width="$dim('page.system.logininfor.table.infoId', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.logininfor.table.userName', '用户名称')"
          prop="userName"
          :min-width="$dim('page.system.logininfor.table.userName', 140)"
          align="left"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column
          :label="$t('page.system.logininfor.table.status', '登录状态')"
          prop="status"
          :min-width="$dim('page.system.logininfor.table.status', 100)"
          align="center"
        >
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.logininfor.table.message', '描述')"
          prop="msg"
          :min-width="$dim('page.system.logininfor.table.message', 200)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.logininfor.table.accessTime', '访问时间')"
          prop="accessTime"
          :min-width="$dim('page.system.logininfor.table.accessTime', 170)"
          align="left"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.accessTime) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template>
    </page-content>
  </section>
</template>

<script setup lang="ts" name="Logininfor">
import { list, delLogininfor, cleanLogininfor, unlockLogininfor } from '@/api/system/logininfor';
import type { SysLogininfor, LogininforQueryParams } from '@/types/api/system/logininfor';

const { proxy } = getCurrentInstance();
const { sys_common_status } = proxy.useDict('sys_common_status');

const logininforList = ref<SysLogininfor[]>([]);
const logininforRef = ref();
const loading = ref<boolean>(true);
const ids = ref<number[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const selectName = ref<string[]>([]);
const total = ref<number>(0);
const dateRange = ref<string[]>([]);
const defaultSort = ref({ prop: 'accessTime', order: 'descending' });

const queryParams = ref<LogininforQueryParams>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: undefined,
  userName: undefined,
  status: undefined,
  orderByColumn: undefined,
  isAsc: undefined
});

function getList() {
  loading.value = true;
  list(proxy.addDateRange(queryParams.value, dateRange.value)).then((response) => {
    logininforList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    nextTick(() => {
      logininforRef.value?.doLayout();
    });
  });
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  dateRange.value = [];
  queryParams.value.userName = undefined;
  queryParams.value.status = undefined;
  queryParams.value.pageNum = 1;
  logininforRef.value?.sort(defaultSort.value.prop, defaultSort.value.order);
  handleQuery();
}

function handleSelectionChange(selection: SysLogininfor[]) {
  ids.value = selection.map((item) => item.infoId!);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
  selectName.value = selection.map((item) => item.userName!);
}

function handleSortChange(column: any) {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
}

function handleDelete(row?: SysLogininfor) {
  const infoIds = row?.infoId || ids.value;
  proxy.$modal
    .confirm('是否确认删除访问编号为"' + infoIds + '"的数据项?')
    .then(function () {
      return delLogininfor(infoIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

function handleClean() {
  proxy.$modal
    .confirm('是否确认清空所有登录日志数据项?')
    .then(function () {
      return cleanLogininfor();
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('清空成功');
    })
    .catch(() => {});
}

function handleUnlock() {
  const username = selectName.value;
  proxy.$modal
    .confirm('是否确认解锁用户"' + username + '"数据项?')
    .then(function () {
      return unlockLogininfor(username);
    })
    .then(() => {
      proxy.$modal.msgSuccess('用户' + username + '解锁成功');
    })
    .catch(() => {});
}

function handleExport() {
  proxy.download(
    'system/logininfor/export',
    {
      ...queryParams.value
    },
    `logininfor_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
