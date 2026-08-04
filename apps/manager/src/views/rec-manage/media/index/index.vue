<template>
  <div class="app-container">
    <AuditStatus
      ref="auditRef"
      :type="state.auditType"
      :audit-update="state.auditUpdate"
      :task-name="state.taskName"
      @do-change="auditDoChange"
    >
    </AuditStatus>
    <!-- 单集 -->
    <SingleManage v-if="state.auditType == '单集'" ref="singleRef" @change-tabs="changeTabs" />
    <!-- 子集 -->
    <SubManage v-if="state.auditType == '子集'" ref="subRef" @change-tabs="changeTabs" />
    <!-- 剧集 -->
    <MultiManage v-if="state.auditType == '剧集'" ref="multiRef" @change-tabs="changeTabs" />
  </div>
</template>
<script setup>
import { ref, reactive, nextTick } from 'vue';
import AuditStatus from '../components/audit-status.vue';
import MultiManage from '../multi-manage/index.vue';
import SingleManage from '../single-manage/index.vue';
import SubManage from '../sub-manage/index.vue';

const auditRef = ref();
const singleRef = ref();
const subRef = ref();
const multiRef = ref();
const state = reactive({
  auditType: '单集',
  auditUpdate: false,
  taskName: ''
});
// 切换
const auditDoChange = async (val) => {
  console.log(val);
  state.auditType = val;
  state.taskName = val;
  getTableData(val);
};

// 回调
const changeTabs = (val) => {
  state.taskName = val;
  state.auditUpdate = true;
  auditRef.value.typeChange();
  // getTableData(val);
};

// 调用媒资列表方法
const getTableData = (val) => {
  if (val === '单集') {
    nextTick(() => {
      singleRef.value.getTableData();
    });
  } else if (val === '子集') {
    nextTick(() => {
      subRef.value.getTableData();
    });
  } else if (val === '剧集') {
    nextTick(() => {
      multiRef.value.getTableData();
    });
  }
};
</script>

<script>
export default {
  name: 'MediaManageIndexAuditStatus'
};
</script>
