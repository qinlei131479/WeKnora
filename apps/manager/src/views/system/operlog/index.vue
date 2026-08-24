<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.operIp"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              style="max-width: 250px"
              :placeholder="$t('page.system.operlog.search.operIpPlaceholder', '请输入操作地址')"
              @keyup.enter="handleQuery"
            />
          </div>
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.title"
              class="search-bar__input"
              :suffix-icon="'Search'"
              style="max-width: 250px"
              clearable
              :placeholder="$t('page.system.operlog.search.titlePlaceholder', '请输入系统模块')"
              @keyup.enter="handleQuery"
            />
          </div>
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.operName"
              class="search-bar__input"
              :suffix-icon="'Search'"
              clearable
              style="max-width: 250px"
              :placeholder="$t('page.system.operlog.search.operNamePlaceholder', '请输入操作人员')"
              @keyup.enter="handleQuery"
            />
          </div>

          <el-select
            v-model="queryParams.businessType"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.operlog.search.businessTypePlaceholder', '操作类型')"
          >
            <el-option v-for="dict in sys_oper_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-select
            v-model="queryParams.status"
            style="width: 150px"
            clearable
            :placeholder="$t('page.system.operlog.search.statusPlaceholder', '操作状态')"
          >
            <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            style="max-width: 250px"
            :range-separator="$t('page.system.operlog.search.rangeSeparator', '至')"
            :start-placeholder="$t('page.system.operlog.search.startTimePlaceholder', '开始时间')"
            :end-placeholder="$t('page.system.operlog.search.endTimePlaceholder', '结束时间')"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table
        ref="operlogRef"
        v-loading="loading"
        :data="operlogList"
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
          :label="$t('page.system.operlog.table.operId', '日志编号')"
          prop="operId"
          :min-width="$dim('page.system.operlog.table.operId', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.operlog.table.title', '系统模块')"
          prop="title"
          :min-width="$dim('page.system.operlog.table.title', 140)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.operlog.table.businessType', '操作类型')"
          prop="businessType"
          :min-width="$dim('page.system.operlog.table.businessType', 100)"
          align="center"
        >
          <template #default="scope">
            <dict-tag :options="sys_oper_type" :value="scope.row.businessType" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.operlog.table.requestMethod', '请求方式')"
          prop="requestMethod"
          :min-width="$dim('page.system.operlog.table.requestMethod', 100)"
          align="left"
        />
        <el-table-column
          :label="$t('page.system.operlog.table.operName', '操作人员')"
          prop="operName"
          :min-width="$dim('page.system.operlog.table.operName', 110)"
          align="left"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column
          :label="$t('page.system.operlog.table.operIp', '操作地址')"
          prop="operIp"
          :min-width="$dim('page.system.operlog.table.operIp', 130)"
          align="left"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.system.operlog.table.status', '操作状态')"
          prop="status"
          :min-width="$dim('page.system.operlog.table.status', 100)"
          align="center"
        >
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.operlog.table.operTime', '操作日期')"
          prop="operTime"
          :min-width="$dim('page.system.operlog.table.operTime', 170)"
          align="left"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.system.operlog.table.costTime', '消耗时间')"
          prop="costTime"
          :min-width="$dim('page.system.operlog.table.costTime', 110)"
          align="left"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ scope.row.costTime }}{{ $t('page.system.operlog.millisecond', '毫秒') }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          header-align="left"
          :min-width="$dim('page.system.operlog.table.operation', 80)"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)" v-hasPermi="['system:operlog:query']">
              {{ $t('page.system.operlog.detail', '详细') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <operlog-detail v-model:visible="detailVisible" :row="detailRow" />
  </section>
</template>

<script setup lang="ts" name="Operlog">
import OperlogDetail from './detail.vue';
import { list, delOperlog, cleanOperlog } from '@/api/system/operlog';
import type { SysOperLog, OperlogQueryParams } from '@/types/api/system/operlog';

const { proxy } = getCurrentInstance();
const { sys_oper_type, sys_common_status } = proxy.useDict('sys_oper_type', 'sys_common_status');

const operlogList = ref<SysOperLog[]>([]);
const operlogRef = ref();
const detailVisible = ref<boolean>(false);
const detailRow = ref<SysOperLog>({});
const loading = ref<boolean>(true);
const ids = ref<number[]>([]);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
const dateRange = ref<string[]>([]);
const defaultSort = ref({ prop: 'operTime', order: 'descending' });

const data = reactive({
  form: {} as SysOperLog,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    operIp: undefined,
    title: undefined,
    operName: undefined,
    businessType: undefined,
    status: undefined
  } as OperlogQueryParams
});

const { queryParams, form } = toRefs(data);

function getList() {
  loading.value = true;
  list(proxy.addDateRange(queryParams.value, dateRange.value)).then((response) => {
    operlogList.value = response.rows;
    total.value = response.total;
    loading.value = false;
    nextTick(() => {
      operlogRef.value?.doLayout();
    });
  });
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  dateRange.value = [];
  queryParams.value.operIp = undefined;
  queryParams.value.title = undefined;
  queryParams.value.operName = undefined;
  queryParams.value.businessType = undefined;
  queryParams.value.status = undefined;
  queryParams.value.pageNum = 1;
  operlogRef.value?.sort(defaultSort.value.prop, defaultSort.value.order);
  handleQuery();
}

function handleSelectionChange(selection: SysOperLog[]) {
  ids.value = selection.map((item) => item.operId!);
  multiple.value = !selection.length;
}

function handleSortChange(column: any) {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
}

function handleDetail(row: SysOperLog) {
  detailRow.value = row;
  detailVisible.value = true;
}

function handleDelete(row?: SysOperLog) {
  const operIds = row?.operId || ids.value;
  proxy.$modal
    .confirm('是否确认删除日志编号为"' + operIds + '"的数据项?')
    .then(function () {
      return delOperlog(operIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

function handleClean() {
  proxy.$modal
    .confirm('是否确认清空所有操作日志数据项?')
    .then(function () {
      return cleanOperlog();
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('清空成功');
    })
    .catch(() => {});
}

function handleExport() {
  proxy.download(
    'system/operlog/export',
    {
      ...queryParams.value
    },
    `config_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
