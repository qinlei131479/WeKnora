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
        <el-row style="margin-left: 0px; margin-right: 0px">
          <el-col :span="8"
            ><div class="title">
              当前节目：<span class="name">{{ state.dataInfo.name }}</span>
            </div></el-col
          >
        </el-row>
        <div v-if="state.tableData.length <= 0" class="noData">
          <!-- <img src="" alt=""> -->
          <!-- <template #default="scope"> -->
          <div class="noDataBox">
            <el-image :src="noData" alt="暂无数据" style="width: 80px" />
            <div class="noDataName">暂无数据</div>
            <el-button type="primary" :icon="CirclePlus" @click="bindMulti">绑定子集</el-button>
          </div>
          <!-- </template> -->
        </div>
        <TableFlex v-if="state.tableData.length > 0" style="width: 100%">
          <el-table
            ref="multipleTable"
            :data="state.tableData"
            class="common-table"
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
            <el-table-column prop="mediaName" label="授权SP名称" />
            <!-- <el-table-column prop="searchName" label="搜索别名" /> -->
            <el-table-column prop="id" label="所属渠道" />
            <!-- <el-table-column prop="contentName" label="内容提供商" show-overflow-tooltip /> -->
            <el-table-column prop="totalNum" label="媒资发布状态" />
            <el-table-column prop="daysRemaining" label="媒资发布通道" show-overflow-tooltip width="100" />
            <!-- <el-table-column prop="region" label="所属地区" />
            <el-table-column prop="releaseDate" label="上映年份" /> -->
            <el-table-column prop="CPName" label="所属栏目" show-overflow-tooltip width="100" />
            <el-table-column prop="duration" label="所属产品包" width="100" />
          </el-table>
        </TableFlex>
        <KJSCPagination
          v-if="state.tableData.length > 0"
          :total="state.pageInfo.total"
          :page="state.pageInfo.page"
          @change="handlePageChange"
        />
        <!-- 移除 -->
        <KJSCDelete
          v-model="state.dialogVisible"
          title="移除数据"
          width="18.5%"
          @submit-click="batchDoReject"
          @close="closeClick"
        >
          <!-- <el-input
            v-model="state.comment"
            type="textarea"
            placeholder="请输入原因"
          /> -->
          移除数据后不可恢复，您确定要移除吗？
        </KJSCDelete>
        <!-- 批量移除 -->
        <KJSCDelete
          v-model="state.dialogListVisible"
          title="批量移除"
          width="18.5%"
          @submit-click="batchListDoReject"
          @close="closeClick"
        >
          <!-- <el-input
            v-model="state.comment"
            type="textarea"
            placeholder="请输入原因"
          /> -->
          已选中<span style="color: #1890ff">{{ state.selectedData.length }}</span
          >条数据，移除数据后不可恢复，您确定要<span style="color: #1890ff">批量移除</span>吗？
        </KJSCDelete>
      </div>
    </KJSCDrawer>
    <SubsetBind v-model="state.subsetBindVisible" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch, watchEffect, onMounted, computed } from 'vue';
import TableFlex from '@/components/KJSCCmpt/TableFlex.vue';
import noData from '@/assets/img/icon/noData.png';
import SubsetBind from '../components/multi-subsetBind.vue';
import KJSCDelete from '@/components/KJSCCmpt/KJSCDelete.vue';

import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import KJSCDrawer from '@/components/KJSCCmpt/KJSCDrawer.vue';

const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  }
  // dataId: {
  //   type: [String, Number],
  // },
});

const emits = defineEmits(['update:modelValue', 'done']);

const state = reactive({
  visible: false,
  dataInfo: { name: '凡人修仙转第一季' }, // 基本信息
  tittle: '媒资发布详情',
  activeName: 'baseInfo',
  searchInfo: {}, // 查询条件
  taskName: '',
  // 多选数据
  selectedData: [],
  // 表格列表数据
  tableData: [
    {
      id: 11,
      mediaName: '测试节目1',
      searchName: '测试搜索1',
      CPName: 'MGCP',
      contentName: 'CCTV、腾讯',
      totalNum: 1,
      daysRemaining: 17,
      aduitStatus: true,
      auditStatus: '复审中',
      region: '湖北',
      releaseDate: 2023,
      duration: 121,
      mediaClass: '连续剧',
      label: '武侠',
      mediaStatus: false,
      createTime: '2023-02-09',
      updateTime: '2023-02-09'
    },
    {
      id: 12,
      mediaName: '测试节目2',
      searchName: '测试搜索2',
      CPName: '芒果',
      contentName: '芒果',
      totalNum: 2,
      daysRemaining: 203,
      aduitStatus: false,
      auditStatus: '审核失败',
      region: '重庆',
      releaseDate: 2017,
      duration: 43,
      mediaClass: '综艺',
      label: '科幻',
      mediaStatus: true,
      createTime: '2023-02-09',
      updateTime: '2023-02-09'
    }
  ],
  pageInfo: { page: getPage(), total: 0 },
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  dialogVisible: false, // 删除
  deleteInfo: {}, // 当前需要删除的数据
  dialogListVisible: false, // 批量删除
  postingDetailsVisible: false, // 发布详情弹窗
  subsetBindVisible: false,
  rowData: {},
  // 审核页面抽屉
  auditDialogVisible: false,
  dataId: '',
  isAuditRecord: false, // 是否是审核记录
  noData // 暂无数据图标
  // saveInfo:{
  //     baseInfo:{},
  //     detailInfo:{aa:1},
  //     config:{},
  //     preview:{},
  //     statistics:{},
  // }
});

const selectedIds = computed(() => {
  return state.selectedData.map((item) => {
    return item.id;
  });
});

onMounted(() => {});
const bindMulti = () => {
  // state.postingDetailsVisible = false;
  state.subsetBindVisible = true;
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
const handlePreview = (val) => {
  state.auditDialogVisible = true;
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
  console.log(state.searchInfo);
  const params = { ...state.searchInfo };
  params.taskName = state.taskName;
  // await api.examine.managerlist(params, state.pageInfo.page, state.sortInfo)
  //   .then((res) => {
  //     state.selectedData = [];
  //     state.tableData = res.rows;
  //     state.pageInfo.total = parseInt(res.total);
  //   });
};

const funExamine = (params) => {};

// 确认删除
const batchDoReject = (val) => {
  const ids = selectedIds;
  const params = {
    ids: ids.value,
    // comment: state.comment,
    reviewOpinion: '移除'
  };
  // 演示start
  state.tableData.forEach((item, index) => {
    if (item.id === state.deleteInfo.id) {
      state.tableData.splice(index, 1);
    }
  });
  closeClick();
  // 演示end
  funExamine(params);
};
// 确认批量删除
const batchListDoReject = (val) => {
  const ids = selectedIds;
  const params = {
    ids: ids.value,
    comment: state.comment,
    reviewOpinion: '移除'
  };
  // 演示start
  console.log(params.ids);
  params.ids.forEach((item, i) => {
    state.tableData.forEach((items, index) => {
      console.log(items.id, item);
      if (items.id === item) {
        state.tableData.splice(index, 1);
      }
    });
  });
  closeClick();
  // 演示end
  funExamine(params);
};
// 取消
const closeClick = (val) => {
  // state.selectedData = [];
  state.comment = '';
  state.dialogVisible = false;
  state.dialogListVisible = false;
  // state.postingDetailsVisible = false;
};
// const changeTab = () => {

// };
// const submitClick = () => {
//     state.visible = false;
//   console.log(state.saveInfo)
// };
// const doDone = () => {
//   closeClick();
// };

const componentsCloseClick = () => {
  console.log('componentsCloseClick');
  state.visible = false;
  state.dataInfo = {};
  // state.dataId = "";
  state.title = '';
  emits('done');
};

watch(
  () => {
    return state.visible;
  },
  (val) => {
    if (!val) {
      state.activeName = 'baseInfo';
    }
    emits('update:modelValue', val);
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
  // state.dataId = props.dataId;
});
</script>
<script>
export default {
  name: 'SingEdit'
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
