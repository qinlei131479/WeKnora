<template>
  <div class="app-container rec-media-select-table">
    <KJSCCollapseSearch2 v-show="showSearch">
      <el-form :model="state.searchInfo" ref="searchForm" label-width="100px">
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
          <el-form-item label="媒资分类" prop="type">
            <el-select v-model="state.searchInfo.type" placeholder="全部" clearable class="search-field-width">
              <el-option
                v-for="item in state.pgmCategoryData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="内容提供商" prop="contentProvider">
            <el-select v-model="state.searchInfo.contentProvider" placeholder="全部" clearable class="search-field-width">
              <el-option label="全部" value=""></el-option>
              <el-option
                v-for="item in state.contentData"
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
      <template #rightBtns>
        <kjsc-button
          type="success"
          :disabled="state.selectedData.length === 0"
          @click="handleSave"
          icon="Plus"
          >保存</kjsc-button
        >
      </template>
      <!--更多的查询条件写在这里面 -->
      <template #more>
        <el-form v-show="cs2Expand" :model="state.searchInfo" label-width="100px">
          <el-row>
            <el-form-item label="清晰度" prop="definitionFlag">
              <el-select v-model="state.searchInfo.definitionFlag" placeholder="全部" clearable class="search-field-width">
                <el-option label="全部" value=""></el-option>
                <el-option
                  v-for="item in state.definitionFlagData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="节目语种" prop="language">
              <el-select v-model="state.searchInfo.language" placeholder="全部" clearable class="search-field-width">
                <el-option label="全部" value=""></el-option>
                <el-option
                  v-for="item in state.languageData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="上映年份" prop="releaseYear">
              <el-date-picker
                v-model="state.searchInfo.releaseYearStart"
                type="year"
                placeholder="开始年份"
                format="YYYY"
                value-format="YYYY"
                style="width: 100px"
              />&nbsp;-&nbsp;<el-date-picker
                v-model="state.searchInfo.releaseYearEnd"
                type="year"
                placeholder="结束年份"
                format="YYYY"
                value-format="YYYY"
                style="width: 100px"
              />
              <!-- <el-date-picker
                v-model="releaseYear"
                type="monthrange"
                unlink-panels
                range-separator="To"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :shortcuts="state.pickerOptions"
              /> -->
            </el-form-item>
          </el-row>
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
            <el-form-item label="所属地区" prop="originalCountry">
              <el-select v-model="state.searchInfo.originalCountry" placeholder="全部" clearable class="search-field-width">
                <el-option label="全部" value=""></el-option>
                <el-option
                  v-for="item in state.originalCountryData"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-row>
        </el-form>
      </template>
    </KJSCCollapseSearch2>

    <el-table
      :data="state.tableData"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
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
      <el-table-column prop="name" label="媒资名称" width="300" show-overflow-tooltip />
      <el-table-column prop="searchName" label="搜索别名" width="100" show-overflow-tooltip />
      <el-table-column prop="code" label="唯一标识" width="100" show-overflow-tooltip />
      <!-- <el-table-column prop="cpName" label="所属CP单位" width="100" show-overflow-tooltip /> -->
      <el-table-column prop="contentProvider" label="内容提供商" width="100" show-overflow-tooltip />
      <el-table-column prop="licensingWindow" label="版权剩余天数" width="120" show-overflow-tooltip />
      <el-table-column prop="existMovie" label="视频关联状态" width="120" show-overflow-tooltip>
        <template #default="scope">
          <span :class="scope.row.existMovie == 0 ? 'text-none' : 'text-light'">{{
            scope.row.existMovie == 0 ? '未关联' : '已关联'
          }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" min-width="120" show-overflow-tooltip>
        <template #default="scope">
          <KJSCStatusTag
            :status="scope.row.auditStatus"
            :aduit-status-data="state.aduitStatusStepDataList"
            style="width: 90px"
          ></KJSCStatusTag>
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
      <el-table-column prop="originalCountry" label="所属地区" show-overflow-tooltip />
      <el-table-column prop="releaseYear" label="上映年份" show-overflow-tooltip />
      <el-table-column prop="duration" label="时长(分钟)" show-overflow-tooltip min-width="120" />
      <el-table-column prop="type" label="媒资分类" show-overflow-tooltip />
      <!-- <el-table-column prop="aiTags" label="智能标签" show-overflow-tooltip min-width="100" /> -->
      <!-- <el-table-column prop="tags" label="节目标签" show-overflow-tooltip min-width="100" /> -->
      <!-- <el-table-column prop="upAuditStatusName" label="上游审核状态" show-overflow-tooltip width="120" /> -->
      <!-- <el-table-column prop="mediaSourceTypeName" label="来源" min-width="100" /> -->
      <el-table-column prop="enabled" label="锁定状态" show-overflow-tooltip>
        <template #default="scope">
          <span class="light" :class="scope.row.enabled == 0 ? 'active' : ''"></span>
          <span style="margin-left: 10px">{{ scope.row.enabled == '0' ? '正常' : '锁定' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注入时间" show-overflow-tooltip width="120" />
      <el-table-column prop="updateTime" label="更新时间" show-overflow-tooltip width="120" />
      <!-- <el-table-column label="操作" fixed="right" prop="operate" width="150px">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="contentPoolManage(scope.row)">内容池管理</el-button>
        </template>
      </el-table-column> -->
    </el-table>


    <KJSCPagination :total="state.pageInfo.total" :page="state.pageInfo.page" @change="handlePageChange" />
    
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, defineExpose } from 'vue';
// import Edit from '../components/detail-edit.vue';
import KJSCCollapseSearch2, { useCollapseSearch2 } from '@/components/KJSCCmpt/KJSCCollapseSearch2.vue';

import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import api from '@/utils/api';
// import { videoStatusData, aduitStatusStepData, meidiaStatusData } from '@/utils/dict';
// import { showConfirm } from '@/utils/element-plus-message';
// import { ElMessage } from 'element-plus';
import KJSCStatusTag from '@/components/KJSCCmpt/KJSCStatusTag.vue';
import { daterangeShortcuts2, getFilesUrl } from '@/utils/common';

// import useAppStore from "@/store/modules/app"
// const appStore = useAppStore()

const { proxy } = getCurrentInstance();

const emits = defineEmits(['save']);
const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  }
});
const searchForm = ref(null);
const state = reactive({
  contentPoolConfigVisible: false,
  pickerOptions: daterangeShortcuts2,
  searchInfo: {}, // 查询条件
  // dialogVisibleDelete: false, //删除
  // editDetailInfoDialogVisible: false, // 新增修改单集管理详细信息
  // taskName: '',
  // 用户状态：0黑名单，1正常
  // statusData: [],
  // 多选数据
  selectedData: [],
  // 表格列表数据
  tableData: [],
  pageInfo: { page: getPage(), total: 0 },
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  // rowData: {},
  // 审核页面抽屉
  dataId: '',
  isAuditRecord: false, // 是否是审核记录
  // editBatchDialogVisible: false,
  // ids: [], // 选中id
  // markingFormVisiable: false,
  // mzName: '',
  // ReleaseDetailsDialogVisible: false,
  pgmCategoryData: [],
  contentData: [],
  originalCountryData: [],
  definitionFlagData: [],
  languageData: [],
  authorization: [],
  injection: [],
  toUpdate: [],
  // batchImportVisiable: false,
  aduitStatusStepDataList: [],
  cpId: '' // cp单位id;
});
const showSearch = ref(true)
const { cs2Expand, cs2ExpandBtnText, cs2DoExpand } = useCollapseSearch2();

onMounted(() => {
  // console.log(appStore.companyId);
  // state.cpId = appStore.companyId;
  nextTick(() => {
    getStatusData();
    getPgmCategoryType();
    getContent();
    aduitStatusStepDataList();
    getOriginalCountryType();
    getDefinitionFlagType();
    getLanguageType();
    // getTableData();
  });

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
// const isSelected = computed(() => {
//   return state.selectedData.length > 0;
// });
const selectedIds = () => {
  return state.selectedData.map((item) => {
    return item.id;
  });
};

const doSearch = () => {
  getTableData(true);
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
  state.authorization = [];
  state.injection = [];
  state.toUpdate = [];
  searchForm.value.resetFields();
};
// // 导出表格
// const doExport = async () => {
//   const params = { ...state.searchInfo };
//   const cpId = state.cpId;
//   params.cpId = cpId;
//   params.seriesFlag = 0;
//   params.ids = selectedIds();
//   api.mediaCapital.export(params, '单集列表');
// };
// // 新增媒资
// const addGroup = () => {
//   state.editDetailInfoDialogVisible = true;
// };
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

// // 审核预览
// const handlePreview = (val, column, event) => {
//   event.cancelBubble = true;
//   if (column.property === 'operate' || column.property === 'previewImg') {
//     return;
//   }
//   state.editDetailInfoDialogVisible = true;
//   state.dataId = val.id;
//   state.rowData = val;
// };

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
  const cpId = state.cpId;
  params.cpId = cpId;
  // params.taskName = state.taskName;
  // console.log(params);
  // console.log(state.pageInfo.page);
  params.seriesFlag = 0;
  // , state.sortInfo
  await api.mediaCapital.list(params, state.pageInfo.page, {}).then((res) => {
    state.selectedData = [];
    state.tableData = res.rows;
    state.pageInfo.total = parseInt(res.total);
  });
};
// // 删除（含介质）
// const deleteRowAnd = async (params) => {
//   await api.mediaCapital.delConrogram(params.id).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '删除成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };
// /** 删除按钮操作 */
// function handleDelete(row) {
//   proxy.$modal.confirm('是否确认删除内容池媒资为"' + row.name + '"的数据项？').then(function () {
//     return deleteRow(row)
//   }).catch(() => {})
// }
// // 删除
// const deleteRow = async (params) => {
//   await api.mediaCapital.batchDeleteContentPool([params.id]).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '删除成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };
// // 批量操作
// const funOperation = (type) => {
//   switch (type) {
//     // 批量审批
//     case 'arraigned':
//       showConfirm('批量提审', '是否确认对选定媒资批量提审？', batchArraigned);
//       break;
//     // 批量修改
//     case 'update':
//       state.ids = selectedIds();
//       state.editBatchDialogVisible = true;
//       break;
//     // 批量回收
//     case 'recover':
//       break;
//     // 单集转子集
//     case 'change':
//       showConfirm('单集转子集', '是否将选定媒资单集转化为子集？', batchUpdateSeries);
//       break;
//     // 批量解锁
//     case 'start':
//       showConfirm('批量解锁', '解锁后，运营人员可正常操作媒资编排、发布和回收，是否继续？', batchStart);
//       break;
//     // 批量锁定
//     case 'stop':
//       showConfirm('批量锁定', '锁定后，运营人员将不可操作媒资编排、发布和回收，是否继续？', batchStop);
//       break;
//     // 批量删除
//     case 'delete':
//       // eslint-disable-next-line no-var
//       var ids = selectedIds();
//       showConfirm('批量删除', '已选中' + ids.length + '条数据，删除数据后不可恢复，您确定要批量删除吗?', comfrmDelete);
//       // state.ids = selectedIds();
//       // state.dialogVisibleDelete = true;
//       break;
//     // 删除(含介质)
//     case 'deleteother':
//       deleteOther();
//       break;
//     default:
//       break;
//   }
// };
// // 删除含介质
// const deleteOther = () => {
//   const ids = selectedIds();
//   if (ids.length > 1) {
//     ElMessage.error('一次只能删除一条含介质影片');
//   } else {
//     showConfirm('删除(含介质)', '是否确认删除剧头，剧头关系、剧头关联的图片介质和视频介质？', deleteOtherItem);
//   }
// };
// const deleteOtherItem = async () => {
//   const ids = selectedIds();
//   await api.mediaCapital.delConrogram(ids[0]).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '删除成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };
// // 单集转子集
// const batchUpdateSeries = async () => {
//   const ids = selectedIds();
//   const params = {
//     ids,
//     seriesFlag: 1
//   };
//   await api.mediaCapital.batchUpdateSeriesFlag(params).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '操作成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };
// // 批量审批
// const batchArraigned = async () => {
//   const ids = selectedIds();
//   await api.mediaCapital.batchAudit(ids).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '操作成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };
// // 批量解锁
// const batchStart = async () => {
//   const ids = selectedIds();
//   const params = {
//     enabled: 0, // 1:锁定 0:正常
//     ids
//   };
//   await api.mediaCapital.batchUpdateEnabled(params).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '操作成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };
// // 批量锁定
// const batchStop = async () => {
//   const ids = selectedIds();
//   const params = {
//     enabled: 1, // 1:锁定 0:正常
//     ids
//   };
//   await api.mediaCapital.batchUpdateEnabled(params).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '操作成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };

// 审核方法
// const funExamine = (params) => {};

// // // 批量通过审核
// // const batchDoAdopt = (val) => {
// //   const ids = val ? [val.id] : selectedIds.value;
// //   const params = {
// //     ids,
// //     reviewOpinion: '通过'
// //   };
// //   funExamine(params);
// // };
// // 确认删除
// const comfrmDelete = async () => {
//   // state.dialogVisibleDelete = false;
//   const ids = selectedIds();
//   await api.mediaCapital.batchDeleteContentPool(ids).then((res) => {
//     if (res.code === 200) {
//       ElMessage({
//         message: '删除成功',
//         type: 'success'
//       });
//       getTableData(true);
//     } else {
//       ElMessage.error(res.msg);
//     }
//   });
// };

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
// const doneDetailInfo = (data) => {
//   state.editDetailInfoDialogVisible = false;
//   state.dataId = '';
//   if (data && data.refresh) getTableData(true);
// };
// // 批量修改弹框回调
// const doneEditBatch = (data) => {
//   state.editBatchDialogVisible = false;
//   state.ids = [];
//   if (data && data.refresh) {
//     getTableData();
//   }
// };
// // 发布详情回调
// const doneReleaseDetail = () => {
//   state.ReleaseDetailsDialogVisible = false;
//   state.dataId = '';
//   state.mzName = '';
// };
// // 发布详情
// const releaseDetailsMore = (row) => {
//   console.log(row, 'row');
//   state.mzName = row.name;
//   state.dataId = row.id;
//   console.log(state.dataId, 'state.dataId');
//   state.ReleaseDetailsDialogVisible = true;
// };
// // 节目打点
// const preShowDadian = (row) => {
//   state.dataId = row.code;
//   state.markingFormVisiable = true;
// };
// const onAddMarking = () => {
//   state.markingFormVisiable = false;
//   getTableData(true);
// };
// 获取媒资分类
const getPgmCategoryType = async () => {
  await api.dict.getDicByType('pgmCategory').then((res) => {
    state.pgmCategoryData = res.data;
  });
};
// 获取内容提供商
const getContent = () => {
  api.dict.getContentProviderDict().then((res) => {
    state.contentData = res.data;
  });
};
// 获取所属地区
const getOriginalCountryType = async () => {
  await api.dict.getDicByType('originalCountry').then((res) => {
    state.originalCountryData = res.data;
  });
};
// 获取清晰度
const getDefinitionFlagType = async () => {
  await api.dict.getDicByType('definitionFlag').then((res) => {
    state.definitionFlagData = res.data;
  });
};
// 获取节目语种
const getLanguageType = async () => {
  await api.dict.getDicByType('language').then((res) => {
    state.languageData = res.data;
  });
};
// 获取审核状态
const aduitStatusStepDataList = async () => {
  await api.dict.getDicByType('auth_media_audit_status').then((res) => {
    state.aduitStatusStepDataList = res.data;
  });
};

watch(
  () => [state.injection, state.toUpdate, state.authorization],
  ([injection, toUpdate, authorization]) => {
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
    if (authorization && authorization.length === 2) {
      state.searchInfo.authorizationStTime = authorization[0] + ' 00:00:00';
      state.searchInfo.authorizationEndTime = authorization[1] + ' 23:59:59';
    } else {
      state.searchInfo.authorizationStTime = '';
      state.searchInfo.authorizationEndTime = '';
    }
  }
);
// // 导入
// const doImport = () => {
//   state.batchImportVisiable = true;
// };

// /** 批量导入成功后回调 */
// const doneBatchImport = (data) => {
//   state.batchImportVisiable = false;
//   if (data && data.refresh) getTableData(true);
// };
/*
const submitUpAudit = async (row) => {
  const params = {
    ids: [row.id],
    sourceType: 0
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
const handleSave = () => {
  emits('save', {data: state.selectedData});
}
watch(
  () => props.visible,
  (val) => {
    if (val) {
      getTableData();
    } else {
      resetForm();
    }
  },
  { immediate: true }
);
</script>
<script>
export default {
  name: 'RecMediaSelectTable'
};
</script>
<style lang="less" scoped>
.search-field-width {
  width: 215px;
  --el-date-editor-width: 215px;
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
