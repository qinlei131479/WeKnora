<template>
  <div class="app-container">
    <div style="display: flex; justify-content: space-between">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
        <el-form-item label="" prop="keyWord">
          <el-input
            v-model="queryParams.keyWord"
            :placeholder="$t('page.platformManager.tenantManager.searchByTenantName', '通过租户名称进行模糊搜索')"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <!-- <el-form-item label="">
          <el-date-picker
            style="width: 260px"
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="生效开始时间"
            end-placeholder="生效结束时间"
          ></el-date-picker>
        </el-form-item> -->
        <el-form-item style="margin-left: 8px">
          <kjsc-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</kjsc-button>
          <kjsc-button plain @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</kjsc-button>
        </el-form-item>
      </el-form>

      <kjsc-button
        type="success"
        @click="handleAdd"
        v-hasPermi="['system:tenant:add']"
        >{{ $t('page.normal.add', '新增') }}</kjsc-button
      >
    </div>

    <el-table v-loading="loading" :data="userList" @row-click="handleRowClick">
      <template #empty>
        <kjsc-empty></kjsc-empty>
      </template>

      <el-table-column
        label="ID"
        key="id"
        prop="id"
        min-width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        :label="$t('page.tenants.name', '租户名称')"
        key="name"
        prop="name"
        min-width="120"
        :show-overflow-tooltip="true"
      >
        <template #default="scope">
          <span>{{ scope.row.name }}</span
          ><span
            v-if="scope.row.platformTenant === 0"
            style="margin-left: 10px; font-size: 14px"
            ><el-tag
              :key="scope.row.roleKey"
              size="small"
              type="info"
              effect="light"
              >{{ $t('page.platformManager.tenantManager.platformManagement', '平台管理') }}</el-tag
            ></span
          >
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('page.system.user.table.createBy', '创建人')"
        key="createBy"
        prop="createBy"
        min-width="120"
        :show-overflow-tooltip="true"
      >
      </el-table-column>
      <el-table-column :label="$t('page.platformManager.tenantManager.effectivePeriod', '生效时间')" prop="updateTime" min-width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.auditServiceValidityStart, '{y}-{m}-{d}') }} ~ {{ parseTime(scope.row.auditServiceValidityEnd, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('page.normal.operation', '操作')"
        width="220"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <!-- <kjsc-text-button
            type="primary"
            @click="handleInvoke(scope.row)"
            v-hasPermi="['system:tenant:invoke']"
            >添加调用次数</kjsc-text-button
          > -->
          <kjsc-text-button
            type="primary"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:tenant:edit']"
            >{{ $t('page.system.dict.form.update', '修改') }}</kjsc-text-button
          >

          <el-popconfirm
            :confirm-button-text="$t('component.kJSCCmpt.confirm', '确定')"
            :cancel-button-text="$t('page.normal.cancel', '取消')"
            :title="$t('page.system.role.deleteConfirm', '确认删除吗?')"
            :hide-after="100"
            @confirm="confirmCallback(scope.row)"
          >
            <template #reference>
              <kjsc-text-button
                type="danger"
                v-hasPermi="['system:tenant:remove']"
                >{{ $t('page.normal.delete', '删除') }}
              </kjsc-text-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <kjsc-pagination
      v-show="total > 0"
      :total="total"
      :page="{
        pageNum: queryParams.pageNum,
        pageSize: queryParams.pageSize,
      }"
      @change="handlePageChange"
      style="padding-top: 16px"
    />

    <!-- 新增编辑 -->
    <AddAndEditDialog
      v-model="dialogParams.addAndEditDialogVisiable"
      :data-id="dialogParams.dataId"
      :title="dialogParams.title"
      @submitClick="DialogSubmit"
      @cancleClick="cancel"
    />
    <!-- 调用次数 -->
    <!-- <InvokeDialog
      v-model="dialogParams.addInvokeDialogVisiable"
      :data-id="dialogParams.dataId"
      :data-name="dialogParams.dataName"
      :teantInfo="teantInfo"
      @submitClick="DialogSubmit"
      @cancleClick="cancel"
    /> -->
    <!-- 详情 -->
    <!-- <DetailsDrawer
      v-model="dialogParams.detailDrawerVisiable"
      :data-id="dialogParams.dataId"
      @submitClick="DialogSubmit"
      @cancleClick="cancel"
    /> -->
  </div>
</template>

<script setup name="TentantManager">
import { t } from '@/i18n';
import AddAndEditDialog from "./module/addAndEditDialog.vue";
// import InvokeDialog from "./module/invokeDialog.vue";
// import DetailsDrawer from "./module/detailDrawer.vue";
import api from "@/utils/api";

const { proxy } = getCurrentInstance();

const userList = ref([]);
const loading = ref(true);
const total = ref(0);
const dateRange = ref([]);

const data = reactive({
  queryParams: {
    keyWord: "",
    tenantId: "",
    pageNum: 1,
    pageSize: 10,
    orderByColumn: "updateTime",
    isAsc: "desc",
  },
  dialogParams: {
    dataId: "",
    dataName: "",
    title: "",
    addAndEditDialogVisiable: false,
    addInvokeDialogVisiable: false,
    detailDrawerVisiable: false,
  },
  teantInfo: {}
});

const { queryParams, dialogParams, teantInfo } = toRefs(data);

// 分页器触发
const handlePageChange = ({page,type}) => {
  queryParams.value.pageNum = page.pageNum;
  queryParams.value.pageSize = page.pageSize;
  getList();
};

/** 查询系统列表 */
const getList = async () => {
  loading.value = true;
  // const params = proxy.addDateRange(queryParams.value,dateRange.value, 'AuditServiceValidity', true);
  // if (params.beginAuditServiceValidity) {
  //   params.auditServiceValidityStart = params.beginAuditServiceValidity;
  //   delete params.beginAuditServiceValidity;
  // }
  // if (params.endAuditServiceValidity) {
  //   params.auditServiceValidityEnd = params.endAuditServiceValidity;
  //   delete params.endAuditServiceValidity;
  // }
  const params = queryParams.value
  let res = await api.tenantManager.list(params);
  if (res.code === 200) {
    loading.value = false;
    userList.value = res.rows;
    total.value = res.total;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  // getList();
  handleQuery();
};

/** 删除按钮操作 */
const confirmCallback = async (data) => {
  let res = await api.tenantManager.deleteById(data.id);
  if (res.code === 200) {
    proxy.$modal.msgSuccess(t('common.dict.operationSuccessful', '操作成功'));
    getList();
  } else {
    proxy.$modal.msgSuccess(res.msg || t('page.platformManager.tenantManager.operationFailedPleaseTryAgain', '操作失败，请重新提交'));
  }
};

const handleRowClick = (row, column) => {
  if (column.label === t('page.normal.operation', '操作')) {
    return;
  }
  handleDetail(row);
};

// 详情
const handleDetail = (row) => {
  // dialogParams.value.dataId = row.id;
  // dialogParams.value.detailDrawerVisiable = true;
};

// 添加调用次数
const handleInvoke = (row) => {
  teantInfo.value = row;
  dialogParams.value.dataId = row.id;
  dialogParams.value.dataName = row.name;
  dialogParams.value.addInvokeDialogVisiable = true;
};

/** 取消回调 */
const cancel = () => {
  dialogParams.value.dataId = "";
  dialogParams.value.addAndEditDialogVisiable = false;
  dialogParams.value.addInvokeDialogVisiable = false;
  dialogParams.value.detailDrawerVisiable = false;
};

/** 新增按钮操作 */
const handleAdd = async () => {
  dialogParams.value.title = t('page.tenants.add', '新增租户');
  dialogParams.value.addAndEditDialogVisiable = true;
  dialogParams.value.dataId = "";
};

// 提交回调
const DialogSubmit = () => {
  cancel();
  getList();
};

/** 修改按钮操作 */
const handleUpdate = async (row) => {
  dialogParams.value.title = t('page.platformManager.tenantManager.editTenant', '修改租户');
  dialogParams.value.dataId = row.id;
  dialogParams.value.addAndEditDialogVisiable = true;
};

getList();
</script>

<style lang="less" scoped></style>
