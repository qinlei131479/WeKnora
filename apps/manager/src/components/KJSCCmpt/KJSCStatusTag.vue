<template>
  <div class="col-status" :style="getStyle(props.status)">
    {{ getStatusByCode(props.status).label }}
  </div>
</template>

<script setup>
import { aduitStatusData, epgAduitStatusData } from '@/utils/dict';
const props = defineProps({
  status: {
    type: [String, Number]
  },
  auditType: {
    // epg审核还是其他审核 -默认其他审核
    type: [String, Number],
    default: '0'
  }
});

// auditType : 0 -其他审核; 1- epg审核
const statusData = props.auditType === '0' ? aduitStatusData : epgAduitStatusData;
const aduitStatusColorData = statusData.map((item) => {
  switch (item.id) {
    case '未提交':
      item.color = '#C0C4CC';
      break;
    // epg审核
    case '未提交/草稿':
      item.color = '#C0C4CC';
      break;
    case '初审中':
      item.color = '#C0C4CC';
      break;
    // epg审核
    case '待审核':
      item.color = '#C0C4CC';
      break;
    case '复审中':
      item.color = '#5677FC';
      break;
    case '终审中':
      item.color = '#FF9800';
      break;
    case '已审核':
      item.color = '#00CC88';
      break;
    // epg审核
    case '审核通过':
      item.color = '#00CC88';
      break;
    case '审核失败':
      item.color = '#FF6161';
      break;
    default:
      item.color = '#C0C4CC';
  }
  return item;
});

const getStatusByCode = (status) => {
  const statusItems = aduitStatusColorData.filter((item) => {
    return item.id === status || item.value === Number(status);
  });
  if (statusItems.length > 0) {
    return statusItems[0];
  }
  return { id: '', label: ``, color: '#C0C4CC' };
  // return { id: "", label: `未知状态（${status}）`, color: "#C0C4CC" };
  // return aduitStatusColorData[0];
};

const getStyle = (status) => {
  const color = getStatusByCode(status).color;
  return { 'background-color': color };
};
</script>

<style lang="less" scoped>
.col-status {
  line-height: 24px;
  text-align: center;
  border-radius: 12px;
  margin: 0 auto;
  padding: 0 10px;
  color: #fff;
}
</style>
