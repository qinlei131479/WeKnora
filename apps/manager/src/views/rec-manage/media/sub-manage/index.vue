<template>
  <div class="app-container media-manage_media_sub-manage">
    <KJSCCollapseSearch2 v-show="showSearch">
      <el-form ref="searchForm" label-width="140px" :model="state.searchInfo">
        <el-row>
          <el-form-item label="关键词" prop="episodeTitle">
            <el-input
              v-model="state.searchInfo.episodeTitle"
              placeholder="请输入媒资名称&别名&唯一标识搜索"
              clearable
              class="search-field-width"
              @keyup.enter="doSearch"
            />
          </el-form-item>
          <!-- <el-form-item label="所属剧集媒资分类" prop="type" label-width="140px">
            <el-select v-model="state.searchInfo.type" placeholder="全部" clearable filterable class="search-field-width">
              <el-option
                v-for="item in state.pgmCategoryData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              ></el-option>
            </el-select>
          </el-form-item> -->
          <el-form-item label="所属剧集清晰度" prop="definitionFlag" label-width="140px">
            <el-select v-model="state.searchInfo.definitionFlag" placeholder="全部" clearable filterable class="search-field-width">
              <el-option label="全部" value=""></el-option>
              <el-option
                v-for="item in state.definitionFlagData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="doSearch">搜索</el-button>
            <el-button icon="Refresh" @click="doReset">重置</el-button>
            <el-button text @click="cs2DoExpand">
              {{ cs2ExpandBtnText }}<el-icon><CaretBottom v-if="cs2Expand" /><CaretTop v-else /></el-icon>
            </el-button>
          </el-form-item>
        </el-row>
      </el-form>
      <!--更多的查询条件写在这里面 -->
      <template #more>
        <el-form v-show="cs2Expand" :model="state.searchInfo" label-width="140px">
          <el-row>
            <el-form-item label="注入时间" prop="injection">
              <el-date-picker
                v-model="state.injection"
                style="width: 215px"
                class="search-field-width"
                :shortcuts="state.pickerOptions"
                type="daterange"
                start-placeholder="起始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              >
              </el-date-picker>
            </el-form-item>
            <el-form-item label="更新时间" prop="toUpdate">
              <el-date-picker
                v-model="state.toUpdate"
                style="width: 215px"
                class="search-field-width"
                :shortcuts="state.pickerOptions"
                type="daterange"
                start-placeholder="起始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              >
              </el-date-picker>
            </el-form-item>
          </el-row>
        </el-form>
      </template>
    </KJSCCollapseSearch2>

    <el-table
      ref="multipleTable"
      class="table"
      :data="state.tableData"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
      @row-click="handlePreview"
    >
      <template #empty>
        <kjsc-empty></kjsc-empty>
      </template>
      <el-table-column
        type="selection"
        :selectable="
          () => {
            return !state.isAuditRecord;
          }
        "
      />
      <!-- <el-table-column prop="previewImg" label="预览图" min-width="120" show-overflow-tooltip>
        <template #default="scope">
          <el-image
            style="width: 80px; height: 50px"
            :src="getFilesUrl(scope.row.localFileUrl)"
            :preview-src-list="[getFilesUrl(scope.row.localFileUrl)]"
            :initial-index="0"
            :preview-teleported="true"
            fit="scale-down"
          />
        </template>
      </el-table-column> -->
      <el-table-column prop="name" label="媒资名称" width="300" show-overflow-tooltip />
      <el-table-column prop="definitionFlag" label="所属剧集清晰度" width="140" show-overflow-tooltip>
        <template #default="scope">
          {{ state.definitionFlagMap[scope.row.definitionFlag] || '' }}
        </template>
      </el-table-column>
      <!-- <el-table-column prop="type" label="所属剧集媒资分类" width="160" show-overflow-tooltip>
      </el-table-column> -->
      <el-table-column prop="code" label="唯一标识" width="100" show-overflow-tooltip />
      <el-table-column prop="volumnCount" label="集数" width="100" show-overflow-tooltip />
      <!-- <el-table-column prop="seriesName" label="所属剧集" width="100" show-overflow-tooltip /> -->
      <!-- <el-table-column prop="cpName" label="所属CP单位" width="100" show-overflow-tooltip /> -->
      <el-table-column prop="existMovie" label="视频关联状态" width="120" show-overflow-tooltip>
        <template #default="scope">
          <span :class="scope.row.existMovie == 0 ? 'text-none' : 'text-light'">{{
            scope.row.existMovie == 0 ? '未关联' : '已关联'
          }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" min-width="100">
        <template #default="scope">
          <KJSCStatusTag :status="scope.row.auditStatus" style="width: 90px"></KJSCStatusTag>
        </template>
      </el-table-column>
      <el-table-column prop="chargeFlag" label="收费/免费" min-width="120" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.chargeFlag ? '收费' : '免费' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="媒资生效状态" min-width="120" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.status == '1'" class="text-active">生效</span>
          <span v-else class="text-inactive">失效</span>
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="时长(分钟)" show-overflow-tooltip min-width="120" />
      <!-- <el-table-column prop="upAuditStatusName" label="上游审核状态" show-overflow-tooltip width="120" /> -->
      <el-table-column prop="enabled" label="锁定状态" show-overflow-tooltip>
        <template #default="scope">
          <span class="light" :class="scope.row.enabled == 0 ? 'active' : ''"></span>
          <span style="margin-left: 10px">{{ scope.row.enabled == '0' ? '正常' : '锁定' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注入时间" show-overflow-tooltip width="120" />
      <el-table-column prop="updateTime" label="更新时间" show-overflow-tooltip width="120" />
      <el-table-column label="操作" fixed="right" prop="operate" width="150px">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="contentPoolManage(scope.row)">内容池管理</el-button>
          <!-- <el-button text @click.stop="releaseDetailsMore(scope.row)"> 发布详情 </el-button>
          <el-button
            :class="{ 'no-markFlag': !scope.row.markFlag }"
            type="text"
            @click.stop="preShowDadian(scope.row)"
          >
            节目打点
          </el-button>
          <el-dropdown trigger="click" :hide-on-click="false" class="more-dropdown">
            <span>
              更多操作
              <el-icon>
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-popconfirm
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    title="确认删除吗?"
                    :hide-after="100"
                    @confirm="deleteRow(scope.row)"
                  >
                    <template #reference>
                      <el-button text class="delColor">删除</el-button>
                    </template>
                  </el-popconfirm>
                </el-dropdown-item>
                <el-dropdown-item
                  ><el-popconfirm
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    title="确认删除(含介质)吗?"
                    :hide-after="100"
                    @confirm="deleteRowAnd(scope.row)"
                  >
                    <template #reference>
                      <el-button text class="delColor">删除(含介质)</el-button>
                    </template>
                  </el-popconfirm></el-dropdown-item
                >
                <el-dropdown-item v-if="scope.row.type == 1" @click="preSubsetManage(scope.row)"
                  >子集管理</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
        </template>
      </el-table-column>
    </el-table>
    <KJSCPagination :total="state.pageInfo.total" :page="state.pageInfo.page" @change="handlePageChange" />
    <!-- 新增修改详细信息 -->
    <EditSub v-model="state.editDetailInfoDialogVisible" is-look :data-id="state.dataId" @done="doneDetailInfo" />
    <!-- 发布详情 -->
    <!-- <ReleaseDetails
      v-model="state.ReleaseDetailsDialogVisible"
      :data-id="state.dataId"
      :mz-name="state.mzName"
      :source-id="state.sourceId"
      @done="doneReleaseDetail"
    /> -->
    <!-- 批量模版导入 -->
    <!-- <BatchTemplateImport v-model="state.batchImportVisiable" @done="doneBatchImport" /> -->
    <!-- 节目打点 -->
    <!-- <MarkingForm v-model="state.markingFormVisiable" :code="state.dataId" @submit="onAddMarking" /> -->
    <!-- 内容池管理 -->
    <ContentPoolConfig v-model="state.contentPoolConfigVisible" type="1" :data-id="state.dataId" @change="contentPoolConfigChange" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, defineExpose } from 'vue';
// import TableFlex from '@/components/KJSCCmpt/TableFlex.vue';
import EditSub from '../components/detail-editSub.vue';
import ContentPoolConfig from '../components/ContentPoolConfig.vue';

// import KJSCKeySearch from '@/components/KJSCCmpt/KJSCKeySearch.vue';
// import KJSCCollapseSearch from '@/components/KJSCCmpt/KJSCCollapseSearch.vue';
import KJSCCollapseSearch2, { useCollapseSearch2 } from '@/components/KJSCCmpt/KJSCCollapseSearch2.vue';

// import KJSCToolBar from '@/components/KJSCCmpt/KJSCToolBar.vue';
import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import api from '@/utils/api';
import { videoStatusData, aduitStatusStepData, meidiaStatusData } from '@/utils/dict';
import { showConfirm } from '@/utils/element-plus-message';
import { ElMessage } from 'element-plus';
import KJSCStatusTag from '@/components/KJSCCmpt/KJSCStatusTag.vue';
// import ReleaseDetails from '../components/release-details.vue';
import { daterangeShortcuts2, getFilesUrl } from '@/utils/common';
// import BatchTemplateImport from '../components/batch-template-import.vue';
// import MarkingForm from '@/components/KJSCCmpt/windows-components/modules/marking-form';

import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

const emits = defineEmits(['changeTabs']);
const multipleTable = ref(null);
const searchForm = ref(null);
const state = reactive({
  contentPoolConfigVisible: false,
  pickerOptions: daterangeShortcuts2,
  accept: 'xlsx,xls',
  isupload: false, // 防止上传按钮重复点击
  videoStatusData, // 视频关联状态
  aduitStatusStepData, // 审核状态
  meidiaStatusData, // 锁定状态
  mediaTypeData: [], // 媒资审核
  searchInfo: {}, // 查询条件
  // dialogVisibleDelete: false, //删除
  editDetailInfoDialogVisible: false, // 新增修改子集管理详细信息
  taskName: '',
  fileList: [],
  // 用户状态：0黑名单，1正常
  statusData: [],
  // 多选数据
  selectedData: [],
  // 表格列表数据
  tableData: [],
  pageInfo: { page: getPage(), total: 0 },
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  comment: '', // 驳回原因
  isColumn: true,
  auditType: 3,
  rowData: {},
  // 审核页面抽屉
  dataId: '',
  auditUpdate: false,
  isAuditRecord: false, // 是否是审核记录
  editBatchDialogVisible: false,
  ids: [], // 选中id
  markingFormVisiable: false,
  mzName: '',
  ReleaseDetailsDialogVisible: false,
  pgmCategoryData: [],
  injection: [],
  toUpdate: [],
  batchImportVisiable: false,
  aduitStatusStepDataList: [],
  definitionFlagData: [], // 清晰度
  definitionFlagMap: {}, // 清晰度map
  sourceId: 1 //  判断 子集、单集、剧集
});
const showSearch = ref(true)
const { cs2Expand, cs2ExpandBtnText, cs2DoExpand } = useCollapseSearch2();
onMounted(() => {
  getStatusData();
  aduitStatusStepDataList();
  getDefinitionFlagType();
  getPgmCategoryType();
  // getTableData();

  // /** 该方法属于曲线救国，可用但不适用，有更好的方法请自行更改并分享
  //  * yuans
  //  * 2023年4月11日08:59:12
  //  * 气泡的延迟属性hide-after默认200，此方法需将其改为150以下，此处为100
  //  * （150是因为下拉菜单的hide-timeout属性为150）
  //  */
  // const table = multipleTable.value.layout.table.refs.bodyWrapper;
  // table.addEventListener(
  //   'scroll',
  //   () => {
  //     document.body.click();
  //   },
  //   true
  // );
});
// 获取清晰度
const getDefinitionFlagType = () => {
  api.dict.getDicByType('definitionFlag').then((res) => {
    const definitionFlagMap = {};
    state.definitionFlagData = res.data || [];
    state.definitionFlagData.forEach((item) => {
      definitionFlagMap[item.dictValue] = item.dictLabel;
    });
    state.definitionFlagMap = definitionFlagMap;
  });
};
const isSelected = computed(() => {
  return state.selectedData.length > 0;
});
const selectedIds = () => {
  return state.selectedData.map((item) => {
    return item.id;
  });
};

const doSearch = () => {
  emits('changeTabs', '子集');
  // getTableData(true);
};

const doReset = () => {
  resetForm();
  nextTick(() => {
    getTableData(true);
  });
};
const resetForm = () => {
  state.searchInfo = {};
  state.selectedData = [];
  state.injection = [];
  state.toUpdate = [];
  searchForm.value.resetFields();
};
// 导出表格
const doExport = async () => {
  const params = { ...state.searchInfo };
  const cpId = appStore.companyId;
  params.cpId = cpId;
  params.seriesFlag = 1;
  api.mediaCapital.export(params, '子集列表');
};

// 新增媒资
const addGroup = () => {
  state.editDetailInfoDialogVisible = true;
};
// 排序
const handleSortChange = ({ column, prop, order }) => {
  state.sortInfo = {
    orderByColumn: prop,
    isAsc: order === 'descending' ? 'desc' : 'asc'
  };
  getTableData(true);
};
// 全选
const handleSelectionChange = (val) => {
  state.selectedData = val;
};

// 审核预览
const handlePreview = (val, column, event) => {
  event.cancelBubble = true;
  if (column.property === 'operate' || column.property === 'previewImg') {
    return;
  }
  state.editDetailInfoDialogVisible = true;
  state.dataId = val.id;
  state.rowData = val;
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
  const params = { ...state.searchInfo };
  const cpId = appStore.companyId;
  params.cpId = cpId;
  // params.taskName = state.taskName;
  params.seriesFlag = 1;
  // const sortInfo = state.sortInfo;
  await api.mediaCapital.list(params, state.pageInfo.page).then((res) => {
    state.selectedData = [];
    state.tableData = res.rows;
    state.pageInfo.total = parseInt(res.total);
  });
};

// 删除
const deleteRow = async (params) => {
  await api.mediaCapital.batchDelete([params.id]).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '子集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 删除（含介质）
const deleteRowAnd = async (params) => {
  await api.mediaCapital.delConrogram(params.id).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '子集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 批量操作
const funOperation = (type) => {
  switch (type) {
    // 批量审批
    case 'arraigned':
      showConfirm('批量提审', '是否确认对选定媒资批量提审？', batchArraigned);
      break;
    // 批量回收
    case 'recover':
      break;
    // 子集转单集
    case 'change':
      showConfirm('子集转单集', '是否将选定媒资子集转化为单集？', batchUpdateSeries);
      break;
    // 批量解锁
    case 'start':
      showConfirm('批量解锁', '解锁后，运营人员可正常操作媒资编排、发布和回收，是否继续？', batchStart);
      break;
    // 批量锁定
    case 'stop':
      showConfirm('批量锁定', '锁定后，运营人员将不可操作媒资编排、发布和回收，是否继续？', batchStop);
      break;
    // 批量删除
    case 'delete':
      // eslint-disable-next-line no-var
      var ids = selectedIds();
      showConfirm('批量删除', '已选中' + ids.length + '条数据，删除数据后不可恢复，您确定要批量删除吗?', comfrmDelete);
      // state.ids = selectedIds();
      // state.dialogVisibleDelete = true;
      break;
    // 删除(含介质)
    case 'deleteother':
      deleteOther();
      break;
    default:
      break;
  }
};
// 删除含介质
const deleteOther = () => {
  const ids = selectedIds();
  if (ids.length > 1) {
    ElMessage.error('一次只能删除一条含介质影片');
  } else {
    showConfirm('删除(含介质)', '是否确认删除剧头，剧头关系、剧头关联的图片介质和视频介质？', deleteOtherItem);
  }
};
const deleteOtherItem = async () => {
  const ids = selectedIds();
  await api.mediaCapital.delConrogram(ids[0]).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '子集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 子集转单集
const batchUpdateSeries = async () => {
  const ids = selectedIds();
  const params = {
    ids,
    seriesFlag: 0
  };
  await api.mediaCapital.batchUpdateSeriesFlag(params).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '操作成功',
        type: 'success'
      });
      emits('changeTabs', '子集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 批量审批
const batchArraigned = async () => {
  const ids = selectedIds();
  await api.mediaCapital.batchAudit(ids).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '操作成功',
        type: 'success'
      });
      getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 批量解锁
const batchStart = async () => {
  const ids = selectedIds();
  const params = {
    enabled: 0, // 1:锁定 0:正常
    ids
  };
  await api.mediaCapital.batchUpdateEnabled(params).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '操作成功',
        type: 'success'
      });
      getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 批量锁定
const batchStop = async () => {
  const ids = selectedIds();
  const params = {
    enabled: 1, // 1:锁定 0:正常
    ids
  };
  await api.mediaCapital.batchUpdateEnabled(params).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '操作成功',
        type: 'success'
      });
      getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 审核方法
// const funExamine = (params) => {};

// 批量通过审核
// const batchDoAdopt = (val) => {
//   const ids = val ? [val.id] : selectedIds.value;
//   const params = {
//     ids,
//     reviewOpinion: '通过'
//   };
//   funExamine(params);
// };
// 确认删除
const comfrmDelete = async () => {
  // state.dialogVisibleDelete = false;
  const ids = selectedIds();
  await api.mediaCapital.batchDelete(ids).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '子集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 发布详情回调
const doneReleaseDetail = () => {
  state.ReleaseDetailsDialogVisible = false;
  state.dataId = '';
  state.mzName = '';
};
// 发布详情
const releaseDetailsMore = (row) => {
  state.mzName = row.name;
  state.dataId = row.id;
  state.ReleaseDetailsDialogVisible = true;
};
// 节目打点
const preShowDadian = (row) => {
  state.dataId = row.code;
  state.markingFormVisiable = true;
};
const onAddMarking = () => {
  state.markingFormVisiable = false;
  getTableData(true);
};
// 取消
// const closeClickDelete = (val) => {
//   state.dialogVisibleDelete = false;
// };
// 获取用户状态
const getStatusData = async () => {
  // const statusData = await services.businessStatusData();
  const statusData = [
    { id: 0, name: '黑名单' },
    { id: 1, name: '正常' }
  ];
  state.statusData = statusData;
};
const doneDetailInfo = (data) => {
  state.editDetailInfoDialogVisible = false;
  state.dataId = '';
  if (data && data.refresh) emits('changeTabs', '子集');
  // getTableData(true);
};
// 批量修改弹框回调
// const doneEditBatch = () => {
//   state.editBatchDialogVisible = false;
//   state.ids = [];
//   getTableData(true);
// };
// 获取媒资分类
const getPgmCategoryType = async () => {
  await api.dict.getDicByType('pgmCategory').then((res) => {
    state.pgmCategoryData = res.data || [];
  });
};
// 获取审核状态
const aduitStatusStepDataList = async () => {
  await api.dict.getDicByType('auth_media_audit_status').then((res) => {
    state.aduitStatusStepDataList = res.data;
  });
};
// 内容池管理
const contentPoolManage = (row) => {
  state.contentPoolConfigVisible = true;
  state.dataId = row.code;
};
const contentPoolConfigChange = () => {
  emits('changeTabs', '子集');
};
watch(
  () => [state.injection, state.toUpdate],
  ([injection, toUpdate]) => {
    if (injection && injection.length === 2) {
      state.searchInfo.createTimeStart = injection[0] + ' 00:00:00';
      state.searchInfo.createTimeEnd = injection[1] + ' 23:59:59';
    } else {
      state.searchInfo.createTimeStart = '';
      state.searchInfo.createTimeEnd = '';
    }
    if (toUpdate && toUpdate.length === 2) {
      state.searchInfo.updateTimeStart = toUpdate[0] + ' 00:00:00';
      state.searchInfo.updateTimeEnd = toUpdate[1] + ' 23:59:59';
    } else {
      state.searchInfo.updateTimeStart = '';
      state.searchInfo.updateTimeEnd = '';
    }
  }
);

// 导入
const doImport = () => {
  state.batchImportVisiable = true;
};

/** 批量导入成功后回调 */
const doneBatchImport = (data) => {
  state.batchImportVisiable = false;
  if (data && data.refresh) emits('changeTabs', '子集');
};
/*
const submitUpAudit = async (row) => {
  const params = {
    ids: [row.id],
    sourceType: 1
  };
  await api.mediaCapital.submitUpAudit(params).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '操作成功',
        type: 'success'
      });
      getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
*/
/**
 * 将方法抛出去，切换媒资类型后再在父调用该方法
 */
defineExpose({
  getTableData
});
</script>
<script>
export default {
  name: 'SubManage'
};
</script>
<style lang="less" scoped>
.search-field-width {
  width: 215px;
}
.tool-bar {
  :deep(.el-form-item) {
    margin: 5px 20px 5px 0px;
  }
}
.no-markFlag {
  color: #494949;
}
.no-markFlag:not(.is-disabled):hover {
  color: #001;
}
.text-active {
  color: #00cc88;
}
.text-inactive {
  color: #bd3124;
}
</style>
