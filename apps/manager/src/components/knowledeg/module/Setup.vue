<template>
  <div class="app-container knowledge-lib-setup">
    <div class="top-area">
      <div class="top-title">
        {{ state.libName || props.libItem?.name}}知识库设置
      </div>
      <kjsc-button plain @click="goBack" class="back-btn">返回</kjsc-button>
    </div>
    <el-tabs
      v-model="state.activeName"
      @tab-change="handleChange"
    >
      <el-tab-pane label="基础信息" name="base">
        <BaseInfo v-if="state.activeName === 'base'" :data-id="props.libItem?.id" @newname="state.libName=$event" />
      </el-tab-pane>
      <el-tab-pane label="成员管理" name="members">
        <MemberManage v-if="state.activeName === 'members'" :data-id="props.libItem?.id"/>
      </el-tab-pane>
      <el-tab-pane label="更多" name="more">
        <More v-if="state.activeName === 'more'" :data-id="props.libItem?.id" @del="goBack"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="knowledgeLibSetup">
import BaseInfo from '../component/BaseInfo.vue';
import MemberManage from '../component/MemberManage.vue';
import More from '../component/More.vue';
const { proxy } = getCurrentInstance();
const props = defineProps({
  libItem: {
    type: Object
  },
});
const emit = defineEmits(['back']);
const state = reactive({
  // libItem: {},
  activeName: 'base',
  libName: ''
});
const goBack = () => {
  emit('back');
};
const handleChange = (val) => {
  // getList()
};
// const getLibItem = () => {
  
// };
// watchEffect(() => {
//   state.libItem = props.libItem;
// });
</script>
<style lang="less" scoped>
.top-area {
  position: relative;
}
.top-title {
  line-height: 60px;
  font-size: 20px;
}
.back-btn {
  position: absolute;
  top: 0;
  right: 0;
}
// .member-list {
//   position: relative;
//   .top-area {
//     position: absolute;
//     top: 0;
//     right: 0;
//     z-index: 1;
//   }
// }
</style>
