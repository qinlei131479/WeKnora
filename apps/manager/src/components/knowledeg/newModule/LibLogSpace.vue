<template>
  <!-- 日志空间 -->
  <div class="app-container log-space">
    <div class="log-space__header">
      <div class="log-space__header__title" @click="goBack">
        <el-icon><Back /></el-icon>
        <div>日志空间</div>
      </div>
      <div class="log-space__header__btn">
        <el-form :model="state.searchParams" ref="searchRef" :inline="true">
          <el-form-item label="" prop="name">
            <el-input
              v-model="state.searchParams.name"
              placeholder="请输入关键词搜索"
              clearable
              style="width: 252px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="话题类别" prop="themeType">
            <el-select
              v-model="state.searchParams.themeType"
              placeholder="全部"
              clearable
              style="width: 252px"
            >
              <el-option
                v-for="dict in state.list.themeTypeList"
                :key="dict.type"
                :label="dict.name"
                :value="dict.type"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="反馈类型" prop="feedbackType">
            <el-select
              v-model="state.searchParams.feedbackType"
              placeholder="全部"
              clearable
              style="width: 252px"
            >
              <el-option
                v-for="dict in state.list.feedbackTypeList"
                :key="dict.type"
                :label="dict.name"
                :value="dict.type"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              style="width: 252px"
              v-model="dateRange"
              value-format="YYYY-MM-DD"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            ></el-date-picker>
          </el-form-item>
          <el-form-item style="margin-left: 8px">
            <kjsc-button type="primary" @click="handleQuery">搜索</kjsc-button>
            <kjsc-button plain @click="resetQuery">重置</kjsc-button>
            <kjsc-button plain @click="handleExport">导出</kjsc-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="14">
        <kjsc-tool-bar :length="state.ids.length">
          <kjsc-button plain :disabled="state.multiple" @click="handleDelete"
            >批量删除</kjsc-button
          >
        </kjsc-tool-bar>
      </el-col>
      <el-col :span="10"> </el-col>
    </el-row>

    <el-table
      v-loading="state.loading"
      :data="state.tableData"
      @selection-change="handleSelectionChange"
    >
      <template #empty>
        <kjsc-empty></kjsc-empty>
      </template>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" prop="id" />
      <el-table-column label="工号" prop="code" :show-overflow-tooltip="true" />
      <el-table-column
        label="姓名"
        prop="title"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="部门" prop="content" />
      <el-table-column
        label="咨询内容"
        prop="status"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="办公地点"
        prop="type"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="开始对话时间" prop="createTime">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束对话时间" prop="updateTime">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="调用知识库"
        prop="departmentName"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="调用工作流"
        prop="userName"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="操作" width="100">
          <template #default="scope">
            <kjsc-text-button 
              type="primary"
              @click="handleDetail(scope.row)"
              >详情</kjsc-text-button>
            <kjsc-text-button
              type="danger"
              confirm-btn
              :data="scope.row"
              :confirm-info="{
                title: '确定要删除该数据吗？',
                confirmCallback: confirmCallback,
              }"
              v-hasPermi="['officeReminder:remove']"
              >删除</kjsc-text-button
            >
          </template>
        </el-table-column>
    </el-table>
    <kjsc-pagination
      v-show="state.total > 0"
      :total="state.total"
      :page="{
        pageNum: state.queryParams.pageNum,
        pageSize: state.queryParams.pageSize,
      }"
      @change="handlePageChange"
      style="padding-top: 16px"
    />
  </div>
  <!-- 对话日志详细 -->
  <KJSCDialogV2
    title="对话日志详细"
    v-model="state.open"
    width="700px"
    append-to-body
    :showSubitBtn="false"
    closeBtnText="关 闭"
  >
    <el-form :model="state.form" label-width="100px">
      <el-row>
        <el-col :span="24">
          <el-form-item label="原始问题：">{{ state.form.content }}</el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="请求参数：">{{ state.form.frequencyName }}</el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="返回参数：">{{
            state.form.targetUserName
          }}</el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="用户反馈：">{{
            state.form.targetGroupName
          }}</el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="state.open = false">关 闭</el-button>
      </div>
    </template>
  </KJSCDialogV2>
</template>
<script setup name="LibLogSpace">
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import {
  queryTable,
  batchDelete,
  getThemeTypeList,
  getFeedbackTypeList,
} from "@/api/knowledge/knowedgeLog";

const emit = defineEmits(["back"]);
const { proxy } = getCurrentInstance();

const state = reactive({
  loading: false,
  searchParams: {
    name: "",
  },
  list: {
    // 话题类别下拉框
    themeTypeList: [],
    // 反馈类型下拉框
    feedbackTypeList: [],
  },
  tableData: [],

  dateRange: [],
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderByColumn: "updateTime",
    isAsc: "desc",
  },
  total: 0,

  multiple: false,
  ids: [],

  open: false,
  form: {}
});

const handleQuery = () => {
  getList();
};

const resetQuery = () => {
  state.dateRange = [];
  proxy.resetForm("searchRef");
  handleQuery();
};

const getList = async () => {
  state.loading = true;
  let res = await queryTable(
    proxy.addDateRange(state.searchParams, state.queryParams)
  );
  if (res.code === 200) {
    state.tableData = res.rows;
    state.total = res.total;
    state.loading = false;
  } else {
    state.loading = false;
    proxy.$modal.msgError("查询失败");
  }
};

// 分页
const handlePageChange = ({ page, type }) => {
  if (type === "size") {
    state.queryParams.pageNum = 1;
  } else {
    state.queryParams.pageNum = page.pageNum;
  }
  state.queryParams.pageSize = page.pageSize;
  getList();
};

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  state.ids = selection.map((item) => item.configId);
  state.multiple = !selection.length;
}

/* 批量删除 */
function handleDelete() {
  const configIds = state.ids.join(",");
  proxy.$modal
    .confirm('是否确认删除参数编号为"' + configIds + '"的数据项？')
    .then(function () {
      return batchDelete(configIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {});
}

/** 删除按钮操作 */
const confirmCallback = async (data) => {
  let res = await batchDelete([data.id]);
  if (res.code === 200) {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  } else {
    proxy.$modal.msgError("删除失败");
  }
};

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "system/config/export",
    {
      ...state.queryParams,
    },
    `config_${new Date().getTime()}.xlsx`
  );
}

/* 详情 */
const handleDetail = async (row) => {
  state.open = true;
  state.form = row;
};

/** 下拉框获取 **/
// 话题类别下拉框
const getThemeTypeData = async () => {
  let res = await getThemeTypeList();
  if (res.code === 200) {
    state.list.themeTypeList = res.data;
  } else {
    proxy.$modal.msgError("获取提醒类型失败");
  }
};

// 反馈类型下拉框
const getFeedbackTypeData = async () => {
  let res = await getFeedbackTypeList();
  if (res.code === 200) {
    state.list.feedbackTypeList = res.data;
  } else {
    proxy.$modal.msgError("获取提醒类型失败");
  }
};

const goBack = () => {
  emit("back");
};

const init = () => {
  getThemeTypeData();
  getFeedbackTypeData();
  getList();
};

init();
</script>
<style lang="less" scoped>
.log-space__header {
  display: flex;
  justify-content: space-between;
}
.log-space__header__title {
  display: flex;
  cursor: pointer;
}
</style>
