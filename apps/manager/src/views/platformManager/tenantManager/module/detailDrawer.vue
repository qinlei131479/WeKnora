<template>
  <el-drawer
    size="88%"
    v-model="state.visible"
    @open="onOpen"
    @close="onClose"
    class="detail-drawer"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="header-box">
        <div class="header-top-box">{{ $t('page.platformManager.tenantManager.tenantDetails', '租户详情') }}</div>
      </div>
    </template>
    <div class="content-box">
      <div class="content-box-detail">
        <div class="content-box-detail-title">
          {{ state.dataObj.name || "- -" }}
        </div>
        <el-row>
          <el-col :span="10">
            <div class="detail-box">
              <div class="detail-box-item">
                <span>{{ $t('page.platformManager.tenantManager.tenantId', '租户ID：') }}</span>
                <span>{{ state.dataObj.id || "- -" }}</span>
              </div>
              <div class="detail-box-item">
                <span>{{ $t('page.platformManager.tenantManager.createdBy', '创建人：') }}</span>
                <span>{{ state.dataObj.createBy || "- -" }}</span>
              </div>
              <div class="detail-box-item">
                <span>{{ $t('page.platformManager.tenantManager.concurrencyLimit', '并发限制：') }}</span>
                <span>{{ state.dataObj.qps || "- -" }}{{ $t('page.platformManager.tenantManager.callsSecond', '次/秒') }}</span>
              </div>
            </div>
            <div class="detail-box">
              <div class="detail-box-item">
                <span>{{ $t('page.platformManager.tenantManager.createdAt', '创建时间：') }}</span>
                <span>{{ state.dataObj.createTime || "- -" }}</span>
              </div>
              <div class="detail-box-item">
                <span>{{ $t('page.platformManager.tenantManager.updatedAt', '更新时间：') }}</span>
                <span>{{ state.dataObj.updateTime || "- -" }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="14" style="display: flex; justify-content: end">
            <Statistical
              style="justify-content: start"
              :data="state.invokeData"
              :tenantInfo="state.dataObj"
            />
            <div style="display: flex; align-items: end; margin-left: 6px">
              <kjsc-button
                type="primary"
                v-hasPermi="['system:tenant:edit']"
                @click="handleUpdate"
                >{{ $t('page.platformManager.tenantManager.edit', '编 辑') }}</kjsc-button
              >
              <kjsc-button
                type="success"
                v-hasPermi="['system:tenant:invoke']"
                @click="handleInvoke"
                >{{ $t('page.platformManager.tenantManager.addCallQuota', '添加调用次数') }}</kjsc-button
              >
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="content-box-static">
        <div class="content-box-static-title">
          <div class="d-flex">
            <div class="box-static-left">{{ $t('page.platformManager.tenantManager.requestTrends', '数据请求趋势') }}</div>
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="$t('page.platformManager.tenantManager.dataFromMoreThanOneYearAgoCannotBeQueried', '不支持查询一年之前的数据')"
              placement="bottom"
            >
              <el-icon color="rgba(138, 140, 157, 1)"
                ><WarnTriangleFilled
              /></el-icon>
            </el-tooltip>
            <div class="d-flex m-l-24">
              <svg-icon icon-class="static_icon" />
              <div class="static-title">{{ $t('component.tenant.calls', '调用次数') }}</div>
            </div>
          </div>
          <el-form :inline="true" :model="form" label-width="auto">
            <el-form-item :label="$t('page.platformManager.tenantManager.system', '所属系统')">
              <el-select
                v-model="state.queryParams.systemId"
                :placeholder="$t('page.platformManager.tenantManager.allSystems', '全部系统')"
                clearable
                style="width: 160px"
                @change="handleQuery"
              >
                <el-option :label="$t('page.platformManager.tenantManager.allSystems', '全部系统')" value=""></el-option>
                <el-option
                  v-for="dict in state.system_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <!-- <el-form-item label="所属能力">
              <el-select
                v-model="state.queryParams.businessType"
                placeholder="全部能力"
                clearable
                style="width: 160px"
                @change="handleQuery"
              >
                <el-option label="全部能力" :value="0"></el-option>
                <el-option
                  v-for="dict in state.ability"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item> -->
            <el-form-item :label="$t('page.platformManager.tenantManager.callTime', '调用时间')">
              <el-date-picker
                v-model="state.dateRange"
                value-format="YYYY-MM-DD"
                type="daterange"
                :range-separator="$t('page.system.role.rangeSeparator', '至')"
                :start-placeholder="$t('page.platformManager.tenantManager.startDate', '开始日期')"
                :end-placeholder="$t('page.platformManager.tenantManager.endDate', '结束日期')"
                style="width: 250px"
                :disabled-date="disabledDateLastYear"
                @change="selectData"
              ></el-date-picker>
            </el-form-item>
            <el-form-item label="">
              <el-button @click="handleExport"
                :disabled="state.total == 0"
                ><svg-icon
                  icon-class="export"
                  style="margin-right: 8px"
                ></svg-icon
                >{{ $t('page.platformManager.tenantManager.exportData', '数据导出') }}</el-button
              >
            </el-form-item>
          </el-form>
        </div>

        <div class="content-box-static-echarts">
          <LineStctic :data="state.staticData" />
        </div>
      </div>
    </div>
  </el-drawer>
  <!-- 新增编辑 -->
  <AddAndEditDialog
    v-model="state.dialogParams.addAndEditDialogVisiable"
    :data-id="state.dataId"
    :title="state.dialogParams.title"
    @submitClick="DialogSubmit"
    @cancleClick="cancel"
  />
  <!-- 调用次数 -->
  <InvokeDialog
    v-model="state.dialogParams.addInvokeDialogVisiable"
    :data-id="state.dataId"
    :teantInfo="state.dataObj"
    @submitClick="DialogSubmit"
    @cancleClick="cancel"
  />
</template>
<script setup>
import { t } from '@/i18n';
import LineStctic from "@/components/Tenant/lineStatic.vue";
import Statistical from "@/components/Tenant/statistical";
import AddAndEditDialog from "./addAndEditDialog.vue";
import InvokeDialog from "./invokeDialog.vue";
import {
  disabledDateLastYear,
  getDate,
  DateDiff,
  get30Days,
} from "@/utils/common";
import api from "@/utils/api";

const { proxy } = getCurrentInstance();
const emits = defineEmits(["update:modelValue", "cancleClick", "submitClick"]);

const props = defineProps({
  dataId: {
    type: [String, Number],
    default: "",
  },
  modelValue: {
    type: [Boolean],
    default: false,
  },
});

const state = reactive({
  visible: false,
  // 基础信息
  dataObj: {},
  // 调用次数信息
  invokeData: {},
  // 趋势统计信息
  staticData: {},
  // 趋势查询参数
  queryParams: {},
  // 弹窗参数
  dialogParams: {
    title: "",
    addAndEditDialogVisiable: false,
    addInvokeDialogVisiable: false,
  },
  dateRange: [],
  system_type: [],
  // ability_type: [],
});

const reset = () => {
  state.visible = false;
  state.queryParams.systemId = '';
  emits("update:modelValue", false);
};

const onClose = () => {
  reset();
  emits("cancleClick");
};

// 抽屉打开
const onOpen = () => {
  if (props.dataId) {
    state.dataId = props.dataId;
    state.dateRange = get30Days();
    getDetail();
    getInvoke();
    handleQuery();
    getSystemListData();
  }
};

// 获取详细信息
const getDetail = async () => {
  let res = await api.tenantManager.getById(state.dataId);
  if (res.code === 200) {
    state.dataObj = res.data;
  }
};

// 获取调用次数
const getInvoke = async () => {
  let res = await api.tenantManager.getTenantCount(state.dataId);
  if (res.code === 200) {
    state.invokeData = res.data;
  }
};

watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits("update:modelValue", val);
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
});

const selectData = async () => {
  if (state.dateRange[0] != null && state.dateRange[1] != null) {
    if (DateDiff(state.dateRange[0], state.dateRange[1]) > 90) {
      proxy.$modal.msgError(t('page.platformManager.tenantManager.youCanSelectAMaximumOf90ConsecutiveDays', '最多支持连续选择90天的数据'));
      state.dateRange = [getDate(state.dateRange[1]), state.dateRange[1]];
    }
  }
  handleQuery();
};

// 趋势统计查询
const handleQuery = async () => {
  let params = proxy.addDateRange(state.queryParams, state.dateRange);
  let res = await api.tenantManager.getStaticTrend({
    ...params,
    beginTime: params.params.beginTime,
    endTime: params.params.endTime,
    tenantId: state.dataId,
  });
  state.total = 0;
  if (res.code === 200) {
    state.staticData = res.data.trendList.map((el) => {
      state.total += +el.value;
      return {
        ...el,
        name: el.date,
      };
    });
  }
};

// 添加调用次数
const handleInvoke = () => {
  state.dialogParams.addInvokeDialogVisiable = true;
};

/** 取消回调 */
const cancel = () => {
  state.dialogParams.addAndEditDialogVisiable = false;
  state.dialogParams.addInvokeDialogVisiable = false;
  state.dialogParams.detailDrawerVisiable = false;
};

// 提交回调
const DialogSubmit = () => {
  cancel();
  onOpen();
};

/** 修改按钮操作 */
const handleUpdate = async () => {
  state.dialogParams.title = t('page.platformManager.tenantManager.editTenant', '修改租户');
  state.dialogParams.addAndEditDialogVisiable = true;
};

// 导出
const handleExport = async () => {
  let params = proxy.addDateRange(state.queryParams, state.dateRange);
  let exportParams = {
    ...params,
    beginTime: params.params.beginTime,
    endTime: params.params.endTime,
    tenantId: state.dataId,
  };
  await api.tenantManager.exportRequestTrend(exportParams);
};

// 获取系统下拉
const getSystemListData = async () => {
  let res = await api.tenantManager.getSystemList(state.dataId);
  if (res.code === 200) {
    state.system_type = res.data;
  }
};
</script>

<style lang="less" scoped>
.header-box {
  display: flex;
  justify-content: space-between;
}
.header-top-box {
  font-family: "思源黑体 CN";
  font-weight: 500;
  font-size: 18px;
  color: #0c113d;
}
.content-box {
  width: 100%;
  height: 100%;
}
.content-box-detail {
  width: 100%;
  height: 100px;
  font-family: "思源黑体 CN";
  font-weight: 0;
  font-size: 14px;
  color: #8a8c9d;
}
.content-box-detail-title {
  font-family: "思源黑体 CN";
  font-weight: 500;
  font-size: 16px;
  color: #0c113d;
}
.content-box-static {
  width: 100%;
  margin-top: 40px;
  height: calc(100% - 140px);
}
.content-box-static-title {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  color: #373737;
  margin-bottom: 20px;
  height: 32px;
}
.content-box-static-echarts {
  width: 100%;
  height: 278px;
}
.detail-box {
  display: flex;
  margin-top: 16px;
}
.detail-box-item {
  min-width: 84px;
  margin-right: 24px;
}
.content-box-search {
  display: flex;
  align-items: center;
}
.flex-item {
  margin-right: 20px;
}
.d-flex {
  display: flex;
  align-items: center;
}
.box-static-left {
  font-family: "思源黑体 CN";
  font-weight: 500;
  font-size: 14px;
  color: #0c113d;
  margin-right: 4px;
}
.static-title {
  font-family: "思源黑体 CN";
  font-weight: 0;
  font-size: 14px;
  color: #8a8c9d;
}
.m-l-24 {
  margin-left: 24px;
}
</style>
<style>
.el-drawer__header {
  margin-bottom: 0;
}
.el-drawer__body {
  padding-top: 24px;
}
</style>
