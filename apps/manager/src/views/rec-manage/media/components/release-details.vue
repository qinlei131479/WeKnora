<template>
  <div>
    <KJSCDrawer
      v-model="state.visible"
      :title="state.tittle"
      :show-close-btn="false"
      :show-subit-btn="false"
      size="50%"
      @close="closeClick"
    >
      <div style="height: 100%" class="table-flex-style-drawer">
        <p style="color: #909399">
          当前节目:<span style="color: #000; font-weight: 600; margin-left: 10px">{{ state.mzName }}</span>
        </p>
        <TableFlex>
          <el-table
            ref="multipleTableRef"
            :data="state.tableData"
            class="table"
            style="width: 100%; margin: 0 auto"
            height="100%"
          >
            <el-table-column property="spName" label="授权SP名称" min-width="150" show-overflow-tooltip />
            <el-table-column property="channelName" label="所属渠道" min-width="150" show-overflow-tooltip />
            <el-table-column property="publishStatusName" label="媒资发布状态" min-width="150" show-overflow-tooltip />
            <el-table-column property="distributionName" label="媒资发布通道" min-width="150" show-overflow-tooltip />
            <el-table-column
              v-if="state.sourceId !== 1"
              prop="categoryName"
              label="所属栏目"
              show-overflow-tooltip
              min-width="100"
            />
            <el-table-column
              v-if="state.sourceId !== 1"
              prop="packageName"
              label="所属产品包"
              min-width="100"
              show-overflow-tooltip
            />
          </el-table>
        </TableFlex>
        <KJSCPagination :total="state.pageInfo.total" :page="state.pageInfo.page" @change="handlePageChange" />
      </div>
    </KJSCDrawer>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch, watchEffect } from 'vue';
import KJSCPagination, { getPage } from '@/components/KJSCCmpt/KJSCPagination.vue';
import KJSCDrawer from '@/components/KJSCCmpt/KJSCDrawer.vue';
import TableFlex from '@/components/KJSCCmpt/TableFlex.vue';
import api from '@/utils/api';
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  dataId: {
    type: [String, Number]
  },
  sourceId: {
    // sourceId 0-单集 1-子集 2-剧集
    type: [String, Number]
  },
  mzName: {
    type: String
  }
});

const emits = defineEmits(['done', 'update:modelValue']);

const state = reactive({
  visible: false,
  dataId: '',
  sourceId: '',
  mzName: '',
  tittle: '媒资发布详情',
  pageInfo: { page: getPage(), total: 0 },
  tableData: []
});

const closeClick = () => {
  state.visible = false;
  state.dataId = '';
  state.sourceId = '';
  state.mzName = '';
  emits('done');
};
// 分页
const handlePageChange = (val) => {
  getTableData();
};
const getTableData = async () => {
  let res = {};
  if (state.sourceId !== 2) {
    res = await api.mediaCapital.getDetailPublish(state.dataId);
  } else {
    res = await api.mediaCapital.getDetailPublishBySeries(state.dataId);
  }
  state.tableData = res.rows;
  state.pageInfo.total = parseInt(res.total);
};
watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits('update:modelValue', val);
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
  state.mzName = props.mzName;
  state.sourceId = props.sourceId;
  state.dataId = props.dataId;
  console.log(state.sourceId, 'state.sourceId');
});

watchEffect(async () => {
  if (state.visible && props.dataId) {
    let res = {};

    if (props.sourceId !== 2) {
      res = await api.mediaCapital.getDetailPublish(props.dataId);
    } else {
      res = await api.mediaCapital.getDetailPublishBySeries(props.dataId);
    }
    state.tableData = res.rows;
    state.pageInfo.total = parseInt(res.total);
  }
});
</script>
<script>
export default {
  name: 'ReleaseDetails'
};
</script>

<style lang="less" scoped></style>
