<template>
  <div class="app-container">
    <div style="display: flex; justify-content: space-between">
      <el-form :model="state.queryParams" ref="queryRef" :inline="true">
        <el-form-item label="" prop="keyWord">
          <el-input
            v-model="state.queryParams.keyWord"
            placeholder="通过黑名单搜索"
            clearable
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="" prop="enabled">
          <el-select
            v-model="state.queryParams.enabled"
            placeholder="全部操作类型"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in state.statusData"
              :key="item.id + item.name"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="">
          <el-date-picker
            style="width: 280px"
            v-model="state.dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item style="margin-left: 8px">
          <kjsc-button type="primary" @click="handleQuery">查询</kjsc-button>
          <kjsc-button plain @click="resetQuery">重置</kjsc-button>
        </el-form-item>
      </el-form>
      <div>
        <kjsc-button
          @click="handleDownload"
          v-hasPermi="['system:blackList:export']"
          >模板下载</kjsc-button
        >
        <div style="display: inline-block; margin: 0 20px">
          <el-upload
            v-model:file-list="state.fileList"
            class="upload-demo"
            accept=".xls,.xlsx"
            action="#"
            :http-request="requestUpload"
            :before-upload="handleBeforeUpload"
            :on-error="handleUploadError"
            :on-success="handleUploadSuccess"
            :limit="1"
            :headers="headers"
            ref="fileUpload"
          >
            <kjsc-button
              v-hasPermi="['system:blackList:import']"
              @click="handleImport"
              >导入</kjsc-button
            >
          </el-upload>
        </div>
        <kjsc-button
          v-hasPermi="['system:blackList:add']"
          type="success"
          @click="handleAdd"
          ><el-icon><Plus /></el-icon>新增黑名单</kjsc-button
        >
      </div>
    </div>
    <el-row :gutter="10">
      <el-col :span="14">
        <kjsc-tool-bar :length="state.ids.length">
          <kjsc-button
            plain
            :disabled="state.multiple"
            @click="funOperation('enable')"
            v-hasPermi="['system:blackList:enable']"
            >批量启用</kjsc-button
          >
          <kjsc-button
            plain
            :disabled="state.multiple"
            @click="funOperation('stop')"
            v-hasPermi="['system:blackList:stop']"
            >批量停用</kjsc-button
          >
          <kjsc-button
            plain
            :disabled="state.multiple"
            @click="funOperation('del')"
            v-hasPermi="['system:blackList:batchDelete']"
            >批量删除</kjsc-button
          >
        </kjsc-tool-bar>
      </el-col>
    </el-row>
    <el-table
      ref="logininforRef"
      v-loading="state.loading"
      :data="state.tableData"
      :fit="true"
      stripe
      class="table"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="黑名单ID" show-overflow-tooltip />
      <el-table-column prop="tag" label="黑名单名称" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" sortable />
      <el-table-column prop="enabled" label="启用/停用">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            size="small"
            :active-value="0"
            :inactive-value="1"
            :active-text="scope.row.enabled == 0 ? '启用' : '停用'"
            :loading="!!scope.row.statusChanging"
            :before-change="statusBeforeChange(scope.row)"
            v-hasPermi="['system:blackList:operate']"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="100">
        <template #default="scope">
          <kjsc-text-button
            v-if="scope.row.enabled == 0"
            type="danger"
            v-hasPermi="['system:blackList:delete']"
            :disabled="scope.row.enabled == 0"
            >删除</kjsc-text-button
          >
          <el-popconfirm
            v-else
            confirm-button-text="确定"
            cancel-button-text="取消"
            title="确认删除吗?"
            :hide-after="100"
            @confirm="confirmCallback(scope.row)"
          >
            <template #reference>
              <kjsc-text-button
                type="danger"
                v-hasPermi="['system:blackList:delete']"
                >删除</kjsc-text-button
              >
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <kjsc-pagination
      v-show="state.total > 0"
      :total="state.total"
      :page="{
        pageNum: state.pageInfo.pageNum,
        pageSize: state.pageInfo.pageSize,
      }"
      @change="handlePageChange"
      style="padding-top: 16px"
    />
    <DialogAdd
      v-model="state.dialogVisible"
      :data-id="state.dataId"
      @done="doReset"
    />
  </div>
</template>
<script setup name="blackList">
import {
  queryTable,
  batchChangeStatus,
  deletewhite,
  batchDeletewhite,
  batchStartwhite,
  batchStopwhite,
  importBlackWhiteList,
} from "@/api/system/white";
import cache from "@/plugins/cache";
import DialogAdd from "./component/edit.vue";
import KJSCToolBar from '@/components/KJSCCmpt/KJSCToolBar.vue';
import { showConfirm } from "@/utils/element-plus-message.js";
const { proxy } = getCurrentInstance();
const defaultSort = ref({ orderByColumn: "createTime", isAsc: "descending" });
import { getToken } from "@/utils/auth";
const headers = ref({ Authorization: "Bearer " + getToken() });
const state = reactive({
  queryParams: {
    enabled: "",
  },
  operationTypeOptions: [],
  total: 0,
  loading: false,
  dateRange: [],
  selectedData: [],
  multiple: true,
  ids: [],
  dialogVisible: false,
  fileList: [],
  pageInfo: {
    pageNum: 1,
    pageSize: 10,
  },
  statusData: [
    { id: "", name: "全部" },
    { id: "0", name: "启用" },
    { id: "1", name: "停用" },
  ],
});

const statusBeforeChange = (item) => {
  return function () {
    item.statusChanging = true;
    return new Promise((resolve, reject) => {
      batchChangeStatus({
        dataList: [item.id],
        enabled: item.enabled === 0 ? 1 : 0,
      }).then(
        () => {
          proxy.$modal.msgSuccess("操作成功");
          item.statusChanging = false;
          getTableData();
          resolve(true);
        },
        () => {
          proxy.$modal.msgError("操作失败");
          item.statusChanging = false;
          getTableData();
          // reject('');
        }
      );
    });
  };
};
const handleAdd = () => {
  state.dataId = "";
  state.dialogVisible = true;
};
const doReset = async () => {
  resetQuery();
  state.dataId = "";
  state.dialogVisible = false;
};
// 批量操作
const funOperation = (type) => {
  switch (type) {
    case "enable":
      proxy.$modal
        .confirm("启用黑名单", "是否确认启用选中黑名单？")
        .then(function () {
          return batchStartwhite({ dataList: state.ids, enabled: 0 });
        })
        .then(() => {
          proxy.$modal.msgSuccess("操作成功");
          getTableData();
        })
        .catch(function () {
          proxy.$modal.msgError("操作失败");
          getTableData();
        });
      break;
    case "stop":
      proxy.$modal
        .confirm("停用黑名单", "是否确认停用选中黑名单？")
        .then(function () {
          return batchStopwhite({ dataList: state.ids, enabled: 1 });
        })
        .then(() => {
          proxy.$modal.msgSuccess("操作成功");
          getTableData();
        })
        .catch(function () {
          proxy.$modal.msgError("操作失败");
          getTableData();
        });
      break;
    case "del":
      proxy.$modal
        .confirm("删除黑名单", "是否确认批量删除选中黑名单？")
        .then(function () {
          return batchDeletewhite({ dataList: state.ids });
        })
        .then(() => {
          proxy.$modal.msgSuccess("操作成功");
          getTableData();
        })
        .catch(function () {
          proxy.$modal.msgError("操作失败");
          getTableData();
        });
      break;
    default:
      break;
  }
};
/** 覆盖默认上传行为 */
function requestUpload() {}
// 上传前校检格式和大小
function handleBeforeUpload(file) {
  debugger;
  // 校检文件类型
  const fileType = ["xls", "xlsx"];
  const fileName = file.name.split(".");
  const fileExt = fileName[fileName.length - 1];
  const isTypeOk = fileType.indexOf(fileExt) >= 0;
  if (!isTypeOk) {
    proxy.$modal.msgError(
      `文件格式不正确, 请上传${fileType.join("/")}格式文件!`
    );
    return false;
  }
  // 校检文件大小
  const isLt = file.size / 1024 / 1024 < 5;
  // if (!isLt) {
  //   proxy.$modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`);
  //   return false;
  // }
  proxy.$modal.loading("正在上传文件，请稍候...");
  upload(file);
}
function upload(file) {
  let formData = new FormData();
  formData.append("file", file);
  importBlackWhiteList(formData, {
    tenantId: cache.session.getJSON("tenantId"),
    type: 1,
  })
    .then((response) => {
      if (response.code == 200) {
        proxy.$modal.msgSuccess("上传成功");
        getTableData();
      } else {
        proxy.$modal.msgError(response.msg);
      }
      proxy.$modal.closeLoading();
      state.fileList = [];
    })
    .catch(() => {
      proxy.$modal.closeLoading();
      state.fileList = [];
    });
}
// 上传失败
function handleUploadError(err) {
  proxy.$modal.closeLoading();
  proxy.$modal.msgError("上传文件失败");
}
// 上传成功回调
function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    proxy.$modal.closeLoading();
    proxy.$modal.msgSuccess("上传成功");
    getTableData();
  } else {
    proxy.$modal.closeLoading();
    proxy.$modal.msgError(res.msg);
    proxy.$refs.fileUpload.handleRemove(file);
  }
}
//批量启用
const batchStart = async () => {
  let res = await batchStartwhite({ dataList: state.ids, enabled: 0 });
  if (res.code == 200) {
    proxy.$modal.msgSuccess("操作成功");
  } else {
    proxy.$modal.msgError("操作失败");
  }
  getTableData();
};
//批量停用
const batchStop = async () => {
  let res = await batchStopwhite({ dataList: state.ids, enabled: 1 });
  if (res.code == 200) {
    proxy.$modal.msgSuccess("操作成功");
  } else {
    proxy.$modal.msgError("操作失败");
  }
  getTableData();
};
//批量删除
const batchDelete = async () => {
  let res = await batchDeletewhite({ dataList: state.ids });
  if (res.code == 200) {
    proxy.$modal.msgSuccess("操作成功");
  } else {
    proxy.$modal.msgError("操作失败");
  }
  getTableData();
};
/** 删除按钮操作 */
const confirmCallback = async (row) => {
  const id = row.id;
  let res = await deletewhite({ dataList: [id] });
  if (res.code == 200) {
    proxy.$modal.msgSuccess("操作成功");
  } else {
    proxy.$modal.msgError("操作失败");
  }
  getTableData();
};
// 模板下载
const handleDownload = () => {
  proxy.download2(
    "/audit/blackWhiteList/downloadImportTemplate",
    {
      ...state.queryParams,
    },
    `黑名单_${new Date().getTime()}.xlsx`
  );
};
// 导入
const handleImport = () => {};
// 多选
const handleSelectionChange = (selection) => {
  state.selectedData = selection;
  state.ids = selection.map((item) => item.id);
  state.multiple = !selection.length;
};
// 分页器触发
const handlePageChange = ({ page, type }) => {
  state.pageInfo.pageNum = page.pageNum;
  state.pageInfo.pageSize = page.pageSize;
  getTableData();
};

/** 查询表格 */
const getTableData = async () => {
  state.loading = true;
  var params = { ...state.queryParams };
  if (state.dateRange.length > 0) {
    params.beginTime = state.dateRange[0] + " 00:00:00";
    params.endTime = state.dateRange[1] + " 23:59:59";
  } else {
    params.beginTime = "";
    params.endTime = "";
  }
  params.tenantId = cache.session.getJSON("tenantId");
  params.type = 1;
  let res = await queryTable(params, state.pageInfo, defaultSort.value);
  if (res.code == 200) {
    state.tableData = res.rows;
    state.total = res.total;
    state.loading = false;
  }
};

/** 搜索按钮操作 */
function handleQuery() {
  state.pageInfo.pageNum = 1;
  getTableData();
}

/** 重置按钮操作 */
function resetQuery() {
  state.dateRange = [];
  state.queryParams = {};
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 排序触发事件 */
function handleSortChange(column, prop, order) {
  defaultSort.value.orderByColumn = column.prop;
  defaultSort.value.isAsc = column.order;
  getTableData();
}
onMounted(() => {
  getTableData();
});
</script>
<style lang="less">
.el-upload-list {
  display: none;
}
</style>
