<template>
  <div class="app-container media-manage_media_multi-manage">
    
    <KJSCCollapseSearch2 v-show="showSearch">
      <el-form ref="searchForm" label-width="100px" :model="state.searchInfo">
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
          <el-form-item label="媒资分类" prop="pgmCategory">
            <el-select v-model="state.searchInfo.pgmCategory" placeholder="全部" clearable filterable class="search-field-width">
              <el-option
                v-for="item in state.pgmCategoryData"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="内容提供商" prop="contentProvider">
            <el-select v-model="state.searchInfo.contentProvider" placeholder="全部" clearable filterable class="search-field-width">
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
      <!--更多的查询条件写在这里面 -->
      <template #more>
        <el-form v-show="cs2Expand" :model="state.searchInfo" label-width="100px">
          <el-row>
            <el-form-item label="清晰度" prop="definitionFlag">
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
            <el-form-item label="节目语种" prop="language">
              <el-select v-model="state.searchInfo.language" placeholder="全部" clearable filterable class="search-field-width">
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
              />&nbsp;-&nbsp;
              <el-date-picker
                v-model="state.searchInfo.releaseYearEnd"
                type="year"
                placeholder="结束年份"
                format="YYYY"
                value-format="YYYY"
                style="width: 100px"
              />
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
              <el-select v-model="state.searchInfo.originalCountry" placeholder="全部" clearable filterable class="search-field-width">
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

    <!-- <el-row justify="start">
      <KJSCToolBar :length="state.selectedData.length">
        <el-button plain :disabled="!isSelected" @click="funOperation('batch-arraigned')">批量提审</el-button>
        <el-button plain :disabled="!isSelected" @click="funOperation('batch-modify')">批量修改</el-button>
        <el-button plain :disabled="!isSelected" @click="funOperation('batch-enable')">批量解锁</el-button>
        <el-button plain :disabled="!isSelected" @click="funOperation('batch-stop')">批量锁定</el-button>
        <el-button plain :disabled="!isSelected" @click="funOperation('batch-delete')">批量删除</el-button>
      </KJSCToolBar>
    </el-row> -->

    <el-table
      ref="multipleTable"
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
      <el-table-column prop="name" label="媒资名称" show-overflow-tooltip width="300" />
      <el-table-column prop="searchName" label="搜索别名" show-overflow-tooltip />
      <el-table-column prop="code" label="唯一标识" min-width="120" show-overflow-tooltip />
      <!-- <el-table-column prop="cpName" label="所属CP单位" show-overflow-tooltip width="100" /> -->
      <el-table-column prop="contentProvider" label="内容提供商" min-width="100" show-overflow-tooltip />
      <el-table-column prop="volumnCount" label="总集数" />
      <!-- <el-table-column prop="licensingWindow" label="版权剩余天数" min-width="120" show-overflow-tooltip /> -->
      <!-- <el-table-column prop="existMovie" label="视频关联状态" show-overflow-tooltip min-width="120">
        <template #default="scope">
          <span :class="existMovieFn(scope.row.existMovie) == '未关联' ? 'text-none' : 'text-light'">
            {{ existMovieFn(scope.row.existMovie) }}
          </span>
        </template>
      </el-table-column> -->
      <el-table-column prop="auditStatus" label="审核状态" min-width="120">
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
      <el-table-column prop="originalCountry" label="所属地区" />
      <el-table-column prop="releaseYear" label="上映年份" />
      <el-table-column prop="pgmCategory" label="媒资分类" show-overflow-tooltip />
      <!-- <el-table-column prop="aiTags" label="智能标签" show-overflow-tooltip min-width="100" /> -->
      <!-- <el-table-column prop="tags" label="节目标签" show-overflow-tooltip min-width="100" /> -->
      <!-- <el-table-column prop="upAuditStatusName" label="上游审核状态" show-overflow-tooltip width="120" /> -->
      <el-table-column prop="enabled" label="锁定状态" width="100">
        <template #default="scope">
          <span class="light" :class="scope.row.enabled == 1 ? '' : 'active'"></span>
          <span style="margin-left: 10px">{{ scope.row.enabled == 1 ? '锁定' : '正常' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注入时间" width="150" show-overflow-tooltip />
      <el-table-column prop="updateTime" label="更新时间" width="150" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" prop="operate" width="150px">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="contentPoolManage(scope.row)">内容池管理</el-button>
          <!-- <el-button text @click.stop="subsetManage(scope.row)">子集管理</el-button>
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
                  <el-button text @click.stop="postingDetails(scope.row)">发布详情</el-button>
                </el-dropdown-item>
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
                      <el-button text class="delColor">删除(含子集/介质)</el-button>
                    </template>
                  </el-popconfirm></el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
        </template>
      </el-table-column>
    </el-table>
    <KJSCPagination :total="state.pageInfo.total" :page="state.pageInfo.page" @change="handlePageChange" />
    <!-- 子集管理 -->
    <!-- <SubsetManage
      v-model="state.subsetManageVisible"
      :series-code="state.seriesCode"
      :data-info="state.subsetManageInfo"
    /> -->
    <!-- 发布详情 -->
    <!-- <ReleaseDetails
      v-model="state.ReleaseDetailsDialogVisible"
      :data-id="state.dataId"
      :mz-name="state.mzName"
      :source-id="state.sourceId"
      @done="doneReleaseDetail"
    /> -->
    <!-- 新增剧集 -->
    <Edit v-model="state.editDetailInfoDialogVisible" is-look :data-id="state.dataId" @done="doneDetailInfo" />
    <!-- 批量修改 -->
    <!-- <EditBatch v-model="state.editBatchDialogVisible" :ids="state.ids" :source="3" @done="doneEditBatch" /> -->
    <!-- 批量模版导入 -->
    <!-- <BatchTemplateImport v-model="state.batchImportVisiable" @done="doneBatchImport" /> -->
    <!-- 内容池管理 -->
    <ContentPoolConfig v-model="state.contentPoolConfigVisible" type="2" :data-id="state.dataId" @change="contentPoolConfigChange" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, defineExpose } from 'vue';
// import TableFlex from '@/components/KJSCCmpt/TableFlex.vue';
import Edit from '../components/multi-datailEdit.vue';
// // import PostingDetails from '../components/multi-postingDetails.vue';
// import ReleaseDetails from '../components/release-details.vue';
// import SubsetManage from '../components/multi-subsetManage.vue';
// import KJSCKeySearch from '@/components/KJSCCmpt/KJSCKeySearch.vue';
// import KJSCCollapseSearch from '@/components/KJSCCmpt/KJSCCollapseSearch.vue';
import KJSCCollapseSearch2, { useCollapseSearch2 } from '@/components/KJSCCmpt/KJSCCollapseSearch2.vue';
import { daterangeShortcuts2, getFilesUrl } from '@/utils/common';
// import KJSCToolBar from '@/components/KJSCCmpt/KJSCToolBar.vue';
import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import KJSCStatusTag from '@/components/KJSCCmpt/KJSCStatusTag.vue';
// import EditBatch from '../components/edit-batch.vue';
import api from '@/utils/api';
import { videoStatusData, aduitStatusStepData, meidiaStatusData } from '@/utils/dict';
import { showConfirm } from '@/utils/element-plus-message';
import { ElMessage } from 'element-plus';
// import BatchTemplateImport from '../components/batch-template-import.vue';
import ContentPoolConfig from '../components/ContentPoolConfig.vue';

import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

const emits = defineEmits(['changeTabs']);
const multipleTable = ref(null);
const searchForm = ref(null);
const state = reactive({
  contentPoolConfigVisible: false,
  pickerOptions: daterangeShortcuts2,
  videoStatusData, // 视频关联状态
  aduitStatusStepData, // 审核状态
  pgmCategoryData: [], // 媒资审核
  existMovieData: [], // 视频关联状态
  lessProgramData: [
    {
      id: 0,
      label: '否'
    },
    {
      id: 1,
      label: '是'
    }
  ], // 是否缺集
  meidiaStatusData, // 锁定状态
  languageData: [],
  originalCountryData: [],
  definitionFlagData: [],
  contentData: [],

  searchInfo: {}, // 查询条件
  selectedData: [], // 多选数据
  tableData: [], // 表格列表数据
  pageInfo: { page: getPage(), total: 0 },
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序

  subsetManageVisible: false, // 子集管理
  editDetailInfoDialogVisible: false, // 新增剧集
  editBatchDialogVisible: false, // 批量修改
  isAuditRecord: false, // 是否是审核记录
  batchImportVisiable: false,

  // postingDetailsVisible: false,
  mzName: '',
  sourceId: 2,
  ReleaseDetailsDialogVisible: false,

  dataId: '',
  dataCode: '',
  seriesCode: '', // 子集管理code
  subsetManageInfo: {}, // 子级管理-当前选中子级信息

  authorization: [],
  injection: [],
  toUpdate: [],
  cpId: '' // cp单位id;
});
const showSearch = ref(true)
const { cs2Expand, cs2ExpandBtnText, cs2DoExpand } = useCollapseSearch2();

const isSelected = computed(() => {
  return state.selectedData.length > 0;
});
const selectedIds = () => {
  return state.selectedData.map((item) => {
    return item.id;
  });
};
const selectedIdsOther = () => {
  return state.selectedData.map((item) => {
    return item.code;
  });
};
// 获取媒资分类
const getPgmCategoryType = async () => {
  await api.dict.getDicByType('pgmCategory').then((res) => {
    state.pgmCategoryData = res.data;
  });
};
// 获取视频关联状态
const getExistMovieType = async () => {
  await api.dict.getDicByType('exist_movie').then((res) => {
    state.existMovieData = res.data;
  });
};
// 获取节目语种
const getLanguageType = async () => {
  await api.dict.getDicByType('language').then((res) => {
    state.languageData = res.data;
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
// 获取内容提供商
const getContent = async () => {
  api.dict.getContentProviderDict().then((res) => {
    state.contentData = res.data;
  });
};
onMounted(() => {
  console.log(appStore.companyId);
  state.cpId = appStore.companyId;
  nextTick(() => {
    getPgmCategoryType();
    getExistMovieType();
    getLanguageType();
    getOriginalCountryType();
    getDefinitionFlagType();
    getContent();
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
const doSearch = () => {
  emits('changeTabs', '剧集');
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
  state.authorization = [];
  state.injection = [];
  state.toUpdate = [];
  searchForm.value.resetFields();
};
// 导出表格
const doExport = () => {
  const cpId = state.cpId;
  const params = { ...state.searchInfo, cpId };
  api.mediaCapital.exportMulti(params);
};
// 新增剧集
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

// 修改剧集
const handlePreview = (val, column, event) => {
  if (column.property === 'operate' || column.property === 'previewImg') {
    return;
  }
  state.editDetailInfoDialogVisible = true;
  state.dataId = val.id;
  state.dataCode = val.code;
};

// 分页
const handlePageChange = (val) => {
  getTableData();
};
// 批量修改弹框回调
const doneEditBatch = (data) => {
  state.editBatchDialogVisible = false;
  state.ids = [];
  if (data && data.refresh) {
    getTableData();
  }
};
// 获取table数据
const getTableData = async (isReset) => {
  if (isReset) {
    state.pageInfo.page.resetPageNo();
  }
  const params = { ...state.searchInfo };
  const cpId = state.cpId;
  params.cpId = cpId;
  // const sortInfo = state.sortInfo;
  await api.mediaCapital.listMulti(params, state.pageInfo.page).then((res) => {
    state.selectedData = [];
    state.tableData = res.rows;
    state.pageInfo.total = parseInt(res.total);
  });
};

// 删除（含介质）
const deleteRowAnd = async (params) => {
  await api.mediaCapital.delConrogramConSeries(params.id).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '剧集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};
// 删除
const deleteRow = async (params) => {
  await api.mediaCapital.batchDeleteConSeries([params.id]).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '剧集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 批量操作
const funOperation = (type) => {
  console.log(state.selectedData);
  switch (type) {
    // 批量审批
    case 'batch-arraigned':
      showConfirm('批量提审', '是否确认对选定媒资批量提审？', batchArraigned);
      break;
    case 'batch-modify':
      state.ids = selectedIds();
      state.editBatchDialogVisible = true;
      break;
    case 'batch-recovery':
      console.log('批量回收');
      break;
    case 'batch-enable':
      console.log('批量解锁');
      showConfirm('批量解锁', '启用后，运营人员可正常操作媒资编排、发布和回收，是否继续？', batchStart);
      break;
    case 'batch-stop':
      console.log('批量锁定');
      showConfirm('批量锁定', '锁定后，运营人员将不可操作媒资编排、发布和回收，是否继续？', batchStop);
      break;
    case 'batch-delete':
      console.log('批量删除');
      // eslint-disable-next-line no-case-declarations
      const ids = selectedIds();
      showConfirm('批量删除', '已选中' + ids.length + '条数据，删除数据后不可恢复，您确定要批量删除吗?', comfrmDelete);
      break;
    case 'delete':
      deleteOther();
      break;
    default:
      break;
  }
};

// 确认删除
const comfrmDelete = async () => {
  const ids = selectedIds();
  await api.mediaCapital.batchDeleteConSeries(ids).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '剧集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 删除含介质
const deleteOther = () => {
  const ids = selectedIds();
  if (ids.length > 1) {
    ElMessage.error('一次只能删除一条含介质影片');
  } else {
    showConfirm(
      '删除(含子集介质)',
      '是否确认删除剧头，剧头关系、剧头关联的图片介质、视频介质和子集及子集全部关系',
      deleteOtherItem
    );
  }
};
const deleteOtherItem = async () => {
  const ids = selectedIds();
  await api.mediaCapital.delConrogramConSeries(ids[0]).then((res) => {
    if (res.code === 200) {
      ElMessage({
        message: '删除成功',
        type: 'success'
      });
      emits('changeTabs', '剧集');
      // getTableData(true);
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 批量审批
const batchArraigned = async () => {
  const ids = selectedIds();
  await api.mediaCapital.batchAuditConSeries(ids).then((res) => {
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
  const ids = selectedIdsOther();
  const params = {
    enabled: 0, // 0:正常 1:锁定
    ids
  };
  await api.mediaCapital.batchUpdateEnabledConSeries(params).then((res) => {
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
  const ids = selectedIdsOther();
  const params = {
    enabled: 1, // 0:正常 1:锁定
    ids
  };
  await api.mediaCapital.batchUpdateEnabledConSeries(params).then((res) => {
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

// 发布详情
const postingDetails = (row) => {
  state.mzName = row.name;
  state.dataId = row.id;
  state.ReleaseDetailsDialogVisible = true;
};

// 发布详情回调
const doneReleaseDetail = () => {
  state.ReleaseDetailsDialogVisible = false;
  state.dataId = '';
  state.mzName = '';
};

const doneDetailInfo = (data) => {
  state.editDetailInfoDialogVisible = false;
  state.dataId = '';
  if (data && data.refresh) {
    emits('changeTabs', '剧集');
  }
  // getTableData(true);
};

// 子集管理
const subsetManage = (val) => {
  state.seriesCode = val.code;
  state.subsetManageVisible = true;
  state.subsetManageInfo = val;
};
// 内容池管理
const contentPoolManage = (row) => {
  state.contentPoolConfigVisible = true;
  state.dataId = row.code;
};
const contentPoolConfigChange = () => {
  emits('changeTabs', '剧集');
};

const existMovieFn = (val) => {
  const item = state.existMovieData.filter((res) => {
    return res.dictValue === val + '';
  });
  if (item.length > 0) {
    return item[0].dictLabel;
  }
  return '';
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

// 导入
const doImport = () => {
  state.batchImportVisiable = true;
};

/** 批量导入成功后回调 */
const doneBatchImport = (data) => {
  state.batchImportVisiable = false;
  if (data && data.refresh) {
    emits('changeTabs', '剧集');
  }
};
/*
const submitUpAudit = async (row) => {
  const params = {
    ids: [row.id],
    sourceType: 2
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
  name: 'MultiManageIndex'
};
</script>

<style lang="less" scoped>
.search-field-width {
  width: 215px;
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
.tool-bar {
  :deep(.el-form-item) {
    margin: 5px 20px 5px 0px;
  }
}
.text-active {
  color: #00cc88;
}
.text-inactive {
  color: #bd3124;
}
</style>
