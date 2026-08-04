<template>
  <div>
    <KJSCDrawer
      v-model="state.visible"
      :title="state.tittle"
      :show-close-btn="false"
      :show-subit-btn="false"
      size="50%"
      @close-click="closeClick"
    >
      <div style="height: 100%" class="table-flex-style">
        <KJSCCollapseSearch @do-search="doSearch" @do-reset="doReset">
          <el-form ref="searchForm" :inline="true" :model="state.searchInfo">
            <KJSCKeySearch
              v-model="state.searchInfo.episodeTitle"
              placeholder="请输入媒资名称&唯一标识搜索"
              @do-key-search="doSearch"
            />
          </el-form>

          <!--更多的查询条件写在这里面 -->
          <template #more>
            <el-form :inline="true" :model="state.searchInfo">
              <el-form-item label="视频关联状态" prop="existMovie">
                <el-select v-model="state.searchInfo.existMovie" placeholder="全部" clearable>
                  <el-option label="全部" value=""></el-option>
                  <el-option
                    v-for="item in state.videoStatusData"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="审核状态" prop="auditStatus">
                <el-select v-model="state.searchInfo.auditStatus" placeholder="全部" clearable>
                  <el-option label="全部" value=""></el-option>
                  <el-option
                    v-for="item in state.aduitStatusStepData"
                    :key="item.id"
                    :label="item.label"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </el-form-item>
              <!-- <el-form-item label="媒资分类" prop="pgmCategory">
                <el-select v-model="state.searchInfo.pgmCategory" placeholder="全部" clearable>
                  <el-option
                    v-for="item in state.pgmCategoryData"
                    :key="item.id"
                    :label="item.dictLabel"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </el-form-item> -->
              <el-form-item label="锁定状态" prop="enabled">
                <el-select v-model="state.searchInfo.enabled" placeholder="全部" clearable>
                  <el-option label="全部" value=""></el-option>
                  <el-option
                    v-for="item in state.meidiaStatusData"
                    :key="item.id"
                    :label="item.label2"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="注入时间" prop="createTime">
                <el-date-picker
                  v-model="state.createTime"
                  style="width: 215px"
                  :shortcuts="state.pickerOptions"
                  type="daterange"
                  start-placeholder="起始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="chooseTime"
                >
                </el-date-picker>
              </el-form-item>
              <!-- <el-form-item label="更新时间" prop="updateTime">
                <el-date-picker
                  v-model="state.updateTime"
                  style="width: 215px"
                  :shortcuts="state.pickerOptions"
                  type="daterange"
                  start-placeholder="起始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="chooseTimeUpdate"
                >
                </el-date-picker>
              </el-form-item> -->
            </el-form>
          </template>
        </KJSCCollapseSearch>
        <el-divider></el-divider>

        <TableFlex style="width: 100%">
          <el-table
            ref="multipleTable"
            :data="state.tableData"
            class="table"
            height="100%"
            @sort-change="handleSortChange"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" />
            <!-- :selectable="
                () => {
                  return !isAuditRecord;
                }
              " -->
            <el-table-column prop="name" label="媒资名称" width="300" show-overflow-tooltip sortable />
            <el-table-column prop="code" label="唯一标识" width="100" show-overflow-tooltip />
            <el-table-column prop="sequence" label="集数" sortable />
            <el-table-column prop="existMovie" label="视频关联状态" show-overflow-tooltip width="120">
              <template #default="scope">
                <span :class="scope.row.existMovie == 0 ? 'text-none' : 'text-light'">{{
                  scope.row.existMovie == 0 ? '未关联' : '已关联'
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="auditStatus" label="审核状态" width="90">
              <template #default="scope">
                <KJSCStatusTag :status="scope.row.auditStatus" style="width: 80px"></KJSCStatusTag>
              </template>
            </el-table-column>
            <el-table-column prop="cpName" label="所属CP单位" show-overflow-tooltip width="100" />
            <el-table-column prop="duration" label="时长（分钟）" width="120" />
            <el-table-column prop="enabled" label="媒资状态" width="100">
              <template #default="scope">
                <span class="light" :class="scope.row.enabled == 0 ? 'active' : ''"></span>
                <span style="margin-left: 10px">{{ scope.row.enabled == '0' ? '启用' : '停用' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="注入时间" sortable="custom" min-width="150" />
          </el-table>
        </TableFlex>
        <KJSCPagination :total="state.pageInfo.total" :page="state.pageInfo.page" @change="handlePageChange" />
      </div>
      <template #prefixFooter>
        <el-button type="primary" @click="submitClick">绑定</el-button>
        <el-button @click="closeClick">取消</el-button>
      </template>
    </KJSCDrawer>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, reactive, watch, watchEffect, nextTick, computed } from 'vue';
import TableFlex from '@/components/KJSCCmpt/TableFlex.vue';
import KJSCKeySearch from '@/components/KJSCCmpt/KJSCKeySearch.vue';
import KJSCCollapseSearch from '@/components/KJSCCmpt/KJSCCollapseSearch.vue';
import KJSCStatusTag from '@/components/KJSCCmpt/KJSCStatusTag.vue';
import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import KJSCDrawer from '@/components/KJSCCmpt/KJSCDrawer.vue';
import { showMessage } from '@/utils/element-plus-message';
import { videoStatusData, aduitStatusStepData, meidiaStatusData } from '@/utils/dict';
import { daterangeShortcuts2 } from '@/utils/common';
import api from '@/utils/api';
import useAppStore from "@/store/modules/app"
const appStore = useAppStore()

const searchForm = ref(null);
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  multiCode: {
    type: [String, Number]
  }
});

const emits = defineEmits(['update:modelValue', 'done']);

const state = reactive({
  pickerOptions: daterangeShortcuts2,
  visible: false,
  tittle: '绑定子集',
  searchInfo: {}, // 查询条件
  // 多选数据
  selectedData: [],
  // 表格列表数据
  tableData: [],
  pageInfo: { page: getPage(), total: 0 },
  sortInfo: { orderByColumn: 'name', isAsc: 'asc' }, // 排序
  multiCode: '',
  // isAuditRecord: false, // 是否是审核记录
  videoStatusData, // 视频关联状态
  aduitStatusStepData, // 审核状态
  meidiaStatusData, // 媒资状态
  pgmCategoryData: [],
  createTime: [],
  updateTime: []
});

// // 获取媒资分类
// const getPgmCategoryType = async () => {
//   await api.dict.getDicByType('pgmCategory').then((res) => {
//     state.pgmCategoryData = res.data;
//   });
// };

const selectedIds = computed(() => {
  return state.selectedData.map((item) => {
    return item.code;
  });
});

// 排序
const handleSortChange = ({ column, prop, order }) => {
  state.sortInfo = {
    orderByColumn: column.label === '集数' ? 'sequence' : prop,
    isAsc: order === 'descending' ? 'desc' : 'asc'
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
  const params = { ...state.searchInfo };
  const cpId = appStore.companyId;
  params.cpId = cpId;
  params.seriesFlag = 1;
  const res = await api.multiSubsetManage.getMultiBindlist(params, state.pageInfo.page, state.sortInfo);
  if (res.code === 200) {
    state.selectedData = [];
    state.tableData = res.rows;
    state.pageInfo.total = parseInt(res.total);
  } else {
    showMessage(res.msg, 'error', true);
  }
};

// 取消
const closeClick = (val) => {
  state.selectedData = [];
  state.visible = false;
  state.multiCode = '';
  state.title = '';
  emits('done');
};

const submitClick = async () => {
  const ids = selectedIds;
  const params = {
    seriesCode: state.multiCode,
    programCodes: ids.value
  };
  const res = await api.multiSubsetManage.multiBindSub(params);
  if (res.code === 200) {
    showMessage('绑定成功', 'success', true);
    state.visible = false;
    emits('done');
  } else {
    showMessage(res.msg, 'error', true);
  }
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
  state.createTime = [];
  state.updateTime = [];
  searchForm.value.resetFields();
};

// 起止时间
const chooseTime = (val) => {
  state.searchInfo.createTimeStart = val[0] + ' 00:00:00';
  state.searchInfo.createTimeEnd = val[1] + ' 23:59:59';
};

watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits('update:modelValue', val);
    if (val) {
      // getPgmCategoryType();
      getTableData(true);
    }
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
  state.multiCode = props.multiCode;
});
</script>
<script>
export default {
  name: 'MultiSubsetBind'
};
</script>

<style lang="less" scoped>
.title {
  color: #909399;
  font-size: 14px;
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
</style>
