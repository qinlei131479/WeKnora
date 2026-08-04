<template>
  <div class="recycle-list">
    <!-- 回收站 -->
    <div class="recycle-list-header">
      <span>
        回收站
      </span>
      <btn @click="handleEmpty">清空回收站</btn>
    </div>
    <el-form v-if="state.tableData.length" :model="state.queryParams" ref="queryRef" :inline="true"
      @submit.native.prevent>
      <el-form-item label="" prop="keyword">
        <el-input v-model="state.queryParams.keyword" placeholder="请输入关键词搜索" clearable style="width: 400px"
          @keyup.enter="handleQuery">
          <template #prefix>
            <svg-icon icon-class="search" style="width: 16px; height: 16px" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item style="margin-left: 8px">
        <btn type="primary" @click="handleQuery">搜索</btn>
        <btn plain @click="resetQuery">重置</btn>
      </el-form-item>
    </el-form>

    <el-row v-if="state.tableData.length" :gutter="10" class="mb8">
      <el-col :span="14">
        <kjsc-tool-bar :length="state.ids.length">
          <kjsc-button plain :disabled="state.multiple" @click="handleDelete">批量删除</kjsc-button>
          <kjsc-button plain :disabled="state.multiple" @click="handleRestore">批量还原</kjsc-button>
        </kjsc-tool-bar>
      </el-col>
      <el-col :span="10">
        <!-- <div style="display: flex; justify-content: flex-end">
          <kjsc-button plain @click="handleEmpty">清空</kjsc-button>
        </div> -->
      </el-col>
    </el-row>

    <el-table v-if="state.tableData.length" v-loading="state.loading" :data="state.tableData" class="recyletable"
      @selection-change="handleSelectionChange">
      <template #empty>
        <kjsc-empty :image-size="320"></kjsc-empty>
      </template>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="文件名称" align="center" prop="fileName" min-width="150" />
      <el-table-column label="文件类型" align="center" prop="fileType" width="80" :show-overflow-tooltip="true">
        <template #default="scope">
          {{ scope.row.fileType == 1 ? '文件' : (scope.row.fileType == 2 ? "文件夹" : "") }}
        </template>
      </el-table-column>
      <el-table-column label="文件大小" align="center" prop="fileSize" min-width="100" :show-overflow-tooltip="true" />
      <el-table-column label="删除日期" align="center" prop="deleteTime" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="修改日期" align="center" prop="createTime" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="操作" class-name="small-padding fixed-width">
        <template #default="scope">
          <kjsc-text-button type="primary" confirm-btn :data="scope.row" :confirm-info="{
            title: '确定要还原该数据吗？',
            confirmCallback: confirmCallbackRestore,
          }">还原</kjsc-text-button>
          <kjsc-text-button type="danger" confirm-btn :data="scope.row" :confirm-info="{
            title: '确定要删除该数据吗？',
            confirmCallback: confirmCallback,
          }">删除</kjsc-text-button>
        </template>
      </el-table-column>
    </el-table>
    <kjsc-empty v-else :image-size="320"></kjsc-empty>

    <!-- <kjsc-pagination v-show="state.total > 0" :total="state.total" :page="{
      pageNum: state.queryParams.pageNum,
      pageSize: state.queryParams.pageSize,
    }" @change="handlePageChange" style="padding-top: 16px" /> -->
    <pagination v-show="state.total > 0" :total="state.total" v-model:page="state.queryParams.pageNum"
      layout="total, sizes, prev, pager, next, jumper" v-model:limit="state.queryParams.pageSize" @pagination="getList"
      style="padding-top: 16px" />
  </div>
</template>

<script setup name="RecycleList">
import {
  listRecycle,
  batchDelete,
  clearRecycle,
  batchRestore,
} from "@/api/knowledge/recycle";
const { proxy } = getCurrentInstance();
const props = defineProps({
  libItem: {
    type: Object,
  },
});
const state = reactive({
  // 遮罩层
  loading: true,
  // 选中数组
  ids: [],
  // 非单个禁用
  single: true,
  // 非多个禁用
  multiple: true,
  // 总条数
  total: 0,
  // 表格数据
  tableData: [],
  // 查询参数
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: "",
  },
});
const emit = defineEmits(["callBack"]);
// 分页器触发
const handlePageChange = ({ page, type }) => {
  state.queryParams.pageNum = page.pageNum;
  state.queryParams.pageSize = page.pageSize;
  getList();
};

/** 查询列表 */
const getList = async () => {
  state.loading = true;
  let res = await listRecycle(props.libItem?.id, proxy.addDateRange(state.queryParams));
  if (res.code === 200) {
    state.tableData = res.rows;
    state.total = res.total;
  }
  state.loading = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  proxy.resetForm("queryRef");
  handleQuery();
};

// 多选框选中数据
function handleSelectionChange(selection) {
  state.ids = selection.map((item) => item.id);
  state.single = selection.length != 1;
  state.multiple = !selection.length;
}

/** 删除按钮操作 */
const confirmCallback = async (data) => {
  let res = await batchDelete(props.libItem?.id, [data.id]);
  if (res.code === 200) {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  } else {
    proxy.$modal.msgError("删除失败");
  }
};

// 批量删除
const handleDelete = () => {
  const recycleIds = state.ids;
  proxy.$modal
    .confirm('是否确认删除编号为"' + recycleIds + '"的数据项?')
    .then(function () {
      return batchDelete(props.libItem?.id, recycleIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => { });
};

// 清空
const handleEmpty = () => {
  proxy.$modal
    .confirm("是否确认清空回收站?")
    .then(function () {
      return clearRecycle(props.libItem?.id);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("清空成功");
    })
    .catch(() => { });
};

// 批量还原
const handleRestore = () => {
  const recycleIds = state.ids;
  proxy.$modal
    .confirm('是否确认还原编号为"' + recycleIds + '"的数据项?')
    .then(function () {
      return batchRestore(props.libItem?.id, recycleIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("还原成功");
      emit("callBack");
    })
    .catch(() => { });
};

// 还原
const confirmCallbackRestore = async (row) => {
  let res = await batchRestore(props.libItem?.id, [row.id]);
  if (res.code === 200) {
    getList();
    proxy.$modal.msgSuccess("还原成功");
  } else {
    proxy.$modal.msgError("还原失败");
  }
  emit("callBack");
};
defineExpose({
  getList,
})
getList();
</script>

<style lang="scss" scoped>
.recycle-list {
  // margin-left: 32px;
  // padding-top: 32px;
  padding: 20px 60px;
  border-radius: 24px;
  background-color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .recycle-list-header {
    font-weight: bold;
    font-size: 16px;
    color: #2B2F33;
    line-height: 24px;
    margin: 0 -20px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.recyletable {
  width: 100%;
  height: calc(100vh - 66px - 38px - 186px);

  // :deep(.el-table__body){
  //   overflow: hidden;
  //   tr{
  //     overflow: hidden;
  //   }
  // }
  // :deep(.el-scrollbar){
  //   max-height: 34rem;
  //   overflow-y: auto;
  //   overflow-x:hidden;
  // }
  // :deep(.el-table__body-wrapper){
  //   overflow-y: auto;
  //   overflow-x:hidden;
  // }
}

.el-table {
  flex: 1;
}
</style>
