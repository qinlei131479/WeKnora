<template>
  <div>
    <KJSCDrawer
      v-model="state.visible"
      :title="state.tittle"
      :show-close-btn="false"
      :show-subit-btn="false"
      size="50%"
      @close-click="componentsCloseClick"
    >
      <div style="height: 100%" class="table-flex-style">
        <el-row :gutter="20" style="margin-left: 0px; margin-right: 0px">
          <el-col :span="8"
            ><div class="title">
              当前节目：<span class="name">{{ state.dataInfo.name }}</span>
            </div></el-col
          >
          <el-col :span="11"
            ><div class="title">
              <span
                >共{{ state.dataInfo.volumnCount }}集<span v-if="state.tableData.length > 0"
                  >，已添加{{ state.pageInfo.total }}集</span
                ></span
              >
            </div></el-col
          >
          <el-col v-if="state.tableData.length > 0" :span="1"
            ><el-button type="primary" :icon="CirclePlus" @click="bindMulti">绑定子集</el-button></el-col
          >
        </el-row>
        <div v-if="state.tableData.length <= 0" class="noData">
          <div class="noDataBox">
            <el-image :src="noData" alt="暂无数据" style="width: 80px" />
            <div class="noDataName">暂无数据</div>
            <el-button type="primary" :icon="CirclePlus" @click="bindMulti">绑定子集</el-button>
          </div>
        </div>
        <el-row v-if="state.tableData.length > 0" justify="start">
          <KJSCToolBar :length="state.selectedData.length">
            <el-button plain :disabled="!isSelected" @click="funOperation('batch-remove')">批量移除</el-button>
            <el-button plain :disabled="!isSelected" @click="funOperation('batch-enable')">批量启用</el-button>
            <el-button plain :disabled="!isSelected" @click="funOperation('batch-stop')">批量停用</el-button>
          </KJSCToolBar>
        </el-row>
        <TableFlex v-if="state.tableData.length > 0" style="width: 100%">
          <el-table
            ref="multipleTable"
            :data="state.tableData"
            class="table"
            height="100%"
            @sort-change="handleSortChange"
            @selection-change="handleSelectionChange"
            @row-click="handlePreview"
          >
            <el-table-column
              type="selection"
              :selectable="
                () => {
                  return !isAuditRecord;
                }
              "
            />
            <el-table-column prop="elementName" label="媒资名称" show-overflow-tooltip width="300" sortable />
            <el-table-column prop="programCode" label="唯一标识" show-overflow-tooltip min-width="100" />
            <el-table-column prop="sequence" label="集数" sortable />
            <el-table-column prop="aduitStatus" label="视频关联状态" show-overflow-tooltip min-width="150">
              <template #default="scope">
                <span :class="scope.row.existMovie == 0 ? 'text-none' : 'text-light'">{{
                  scope.row.existMovie == 0 ? '未关联' : '已关联'
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="auditStatus" label="审核状态" min-width="100">
              <template #default="scope">
                <KJSCStatusTag :status="scope.row.auditStatus" style="width: 80px"></KJSCStatusTag>
              </template>
            </el-table-column>
            <el-table-column prop="cpName" label="所属CP单位" show-overflow-tooltip min-width="100" />
            <el-table-column prop="duration" label="时长（分钟）" min-width="150" />
            <el-table-column prop="enabled" label="媒资状态" min-width="100">
              <template #default="scope">
                <span class="light" :class="scope.row.enabled == 0 ? 'active' : ''"></span>
                <span style="margin-left: 10px">{{ scope.row.enabled == '0' ? '启用' : '停用' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="注入时间" sortable min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="scope">
                <el-popconfirm
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                  title="确认移除吗?"
                  @confirm="doDelete(scope.row)"
                >
                  <template #reference>
                    <el-button text @click.stop>移除子集</el-button>
                  </template>
                </el-popconfirm>
                <el-button text @click.stop="postingDetails(scope.row)">发布详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </TableFlex>
        <KJSCPagination
          v-if="state.tableData.length > 0"
          :total="state.pageInfo.total"
          :page="state.pageInfo.page"
          @change="handlePageChange"
        />
      </div>
    </KJSCDrawer>
    <SubsetBind v-model="state.subsetBindVisible" :multi-code="state.multiCode" @done="bindDone" />
    <!-- 修改子集信息 -->
    <EditSub v-model="state.editDetailInfoDialogVisible" :data-id="state.dataId" @done="doneDetailInfo" />
    <ReleaseDetails
      v-model="state.ReleaseDetailsDialogVisible"
      :data-id="state.dataId"
      :mz-name="state.mzName"
      :source-id="state.sourceId"
      @done="doneReleaseDetail"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch, watchEffect, computed } from 'vue';
import TableFlex from '@/components/KJSCCmpt/TableFlex.vue';
import ReleaseDetails from '../components/release-details.vue';
import noData from '@/assets/img/icon/noData.png';
import SubsetBind from '../components/multi-subsetBind.vue';
import KJSCStatusTag from '@/components/KJSCCmpt/KJSCStatusTag.vue';
import KJSCToolBar from '@/components/KJSCCmpt/KJSCToolBar.vue';
import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import KJSCDrawer from '@/components/KJSCCmpt/KJSCDrawer.vue';
import { showConfirm, showMessage } from '@/utils/element-plus-message';
import { operationMessage } from '@/utils/dict';
import EditSub from '../components/detail-editSub.vue';

import api from '@/utils/api';
import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  seriesCode: {
    type: [String, Number]
  },
  dataInfo: {
    type: Object
  }
});

const emits = defineEmits(['update:modelValue', 'done']);

const state = reactive({
  visible: false,
  dataInfo: {}, // 基本信息
  tittle: '子集管理',
  searchInfo: {}, // 查询条件
  taskName: '',
  // 多选数据
  selectedData: [],
  // 表格列表数据
  tableData: [],
  pageInfo: { page: getPage(), total: 0 },
  sortInfo: { orderByColumn: 'elementName', isAsc: 'asc' }, // 排序
  dialogVisible: false, // 删除
  deleteInfo: {}, // 当前需要删除的数据
  dialogListVisible: false, // 批量删除
  ReleaseDetailsDialogVisible: false, // 发布详情
  subsetBindVisible: false,
  editDetailInfoDialogVisible: false,
  dataId: '',
  seriesCode: '', // 父级code，用来查询子集数据
  isAuditRecord: false, // 是否是审核记录
  noData, // 暂无数据图标
  multiCode: '',
  mzName: '',
  sourceId: 1
});
const isSelected = computed(() => {
  return state.selectedData.length > 0;
});
const selectedIds = computed(() => {
  return state.selectedData.map((item) => {
    return item.id;
  });
});
const selectedIdsCode = computed(() => {
  return state.selectedData.map((item) => {
    return item.programCode;
  });
});

const bindMulti = () => {
  state.ReleaseDetailsDialogVisible = false;
  state.subsetBindVisible = true;
  state.multiCode = state.dataInfo.code;
};
const bindDone = () => {
  state.subsetBindVisible = false;
  state.ReleaseDetailsDialogVisible = false;
  state.visible = true;
  getTableData(true);
};
const auditDoChange = (val) => {
  state.isAuditRecord = val === '审核记录';
  state.taskName = val;
  state.auditUpdate = false;
  getTableData(true);
};
// 排序
const handleSortChange = (props) => {
  let order = '';
  if (props.order) {
    order = props.order === 'descending' ? 'desc' : 'asc';
  } else {
    order = props.order;
  }
  state.sortInfo = {
    orderByColumn:
      props.column.label === '媒资名称' ? 'elementName' : props.column.label === '集数' ? 'sequence' : props.prop,
    isAsc: order
  };
  if (order !== null) {
    getTableData(true);
  }
};
// 全选
const handleSelectionChange = (val) => {
  state.selectedData = val;
};

// 分页
const handlePageChange = (val) => {
  getTableData();
};

// 获取table数据
const getTableData = async (isReset) => {
  if (isReset) {
    state.pageInfo.page.resetPageNo();
  }
  const params = { seriesCode: state.seriesCode };
  const cpId = appStore.companyId;
  params.cpId = cpId;
  const res = await api.multiSubsetManage.listMultiProgram(params, state.pageInfo.page, state.sortInfo);
  if (res.code === 200) {
    state.selectedData = [];
    state.tableData = res.rows;
    state.pageInfo.total = parseInt(res.total);
  } else {
    showMessage(res.msg, 'error', true);
  }
};
// 单个删除
const doDelete = async (val) => {
  const res = await api.multiSubsetManage.batchDelete([val.id]);
  if (res.code === 200) {
    showMessage('移除成功', 'success', true);
    getTableData(true);
  } else {
    showMessage(res.msg, 'error', true);
    getTableData(true);
  }
};
// 批量操作
const funOperation = (type) => {
  switch (type) {
    case 'batch-remove':
      showConfirm(
        '批量移除',
        '已选中' + state.selectedData.length + '条数据，移除数据后不可恢复，您确定要批量移除吗?',
        batchListDoReject
      );
      break;
    case 'batch-enable':
      showConfirm('批量启用', '启用后，运营人员可正常操作媒资编排、发布和回收，是否继续？', batchStart);

      break;
    case 'batch-stop':
      showConfirm('批量停用', '停用后，运营人员将不可操作媒资编排、发布和回收，是否继续？', batchStop);

      break;
    default:
      break;
  }
};

const batchListDoReject = async () => {
  const params = selectedIds;
  const res = await api.multiSubsetManage.batchDelete(params.value);
  if (res.code === 200) {
    showMessage('移除成功', 'success', true);
    getTableData(true);
  } else {
    showMessage(res.msg, 'error', true);
    getTableData(true);
  }
};

// 批量启用
const batchStart = async () => {
  const ids = selectedIdsCode;
  // status: 状态 // 0:启用 1:停用
  const res = await api.multiSubsetManage.batchStartAndStop(ids.value, 0);
  if (res.code === 200) {
    showMessage(operationMessage.commonMessage, 'success', true);
    getTableData(true);
  } else {
    showMessage(res.msg, 'error', true);
  }
};

// 批量停用
const batchStop = async () => {
  const ids = selectedIdsCode;
  // status: 状态 // 0:启用 1:停用
  const res = await api.multiSubsetManage.batchStartAndStop(ids.value, 1);
  if (res.code === 200) {
    showMessage(operationMessage.commonMessage, 'success', true);
    getTableData(true);
  } else {
    showMessage(res.msg, 'error', true);
  }
};

// 子集修改
const doneDetailInfo = () => {
  state.editDetailInfoDialogVisible = false;
  getTableData(true);
};

const handlePreview = (val) => {
  state.dataId = val.programId;
  state.editDetailInfoDialogVisible = true;
};

// 发布详情
const postingDetails = (val) => {
  state.mzName = val.elementName;
  state.dataId = val.programId;
  state.ReleaseDetailsDialogVisible = true;
};

// 发布详情回调
const doneReleaseDetail = () => {
  state.ReleaseDetailsDialogVisible = false;
  state.dataId = '';
  state.mzName = '';
};

const componentsCloseClick = () => {
  state.visible = false;
  state.dataInfo = {};
  state.title = '';
  emits('done');
};

watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits('update:modelValue', val);
    if (val) {
      auditDoChange();
    }
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
  state.seriesCode = props.seriesCode;
  state.dataInfo = props.dataInfo;
});
</script>
<script>
export default {
  name: 'MultiSubsetManage'
};
</script>

<style lang="less" scoped>
.title {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.name {
  color: #000;
}

.light {
  width: 8px;
  height: 8px;
  line-height: 20px;
  display: inline-block;
  background-color: #909399;
  border-radius: 50%;
}
.light.active {
  background-color: #00cc88;
}
.noData {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  .noDataBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    .el-image {
      width: 100%;
    }
    .noDataName {
      color: rgb(192, 196, 204);
      font-size: 14px;
      text-align: center;
      margin: 20px 0;
    }
  }
}
</style>
