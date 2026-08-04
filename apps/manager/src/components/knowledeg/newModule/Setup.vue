<template>
  <div class="knowledge-lib-setup" :class="{ 'large': state.activeName === 'members' }">
    <!-- 知识库设置 -->
    <div class="knowledge-lib-header">知识库设置</div>
    <el-tabs v-model="state.activeName" @tab-change="handleChange" class="knowledge-lib-tabs">
      <el-tab-pane label="基础信息" name="base">
        <BaseInfo v-if="state.activeName === 'base'" :data-id="props.libItem?.id" />
      </el-tab-pane>
      <el-tab-pane label="权限管理" name="members">
        <LibPerm v-if="state.activeName === 'members'" :data-id="props.libItem?.id" />
      </el-tab-pane>
      <el-tab-pane label="更多" name="more">
        <More v-if="state.activeName === 'more'" :data-id="props.libItem?.id" @del="goBack" />
      </el-tab-pane>
    </el-tabs>
    <!-- <div style="position: absolute; left: 930px; top: 188px">
      <el-image
        style="width: 820px; height: 628px"
        :src="libSetBg"
        fit="cover"
      ></el-image>
    </div> -->
  </div>
</template>

<script setup name="knowledgeLibSetup">
import BaseInfo from "../component/BaseInfo.vue";
// import MemberManage from "../component/MemberManage.vue";
import LibPerm from "../component/LibPerm.vue";
import More from "../component/More.vue";
// import libSetBg from "@/assets/images/libSetBg.png";
const props = defineProps({
  libItem: {
    type: Object,
  },
});
const emit = defineEmits(["back"]);
const state = reactive({
  activeName: "base",
  keyword: "",
});
const goBack = () => {
  emit("back");
};
const handleChange = (val) => {
  state.activeName = val;
};
</script>
<style lang="scss" scoped>
.knowledge-lib-setup {
  padding: 20px 60px;
  border-radius: 24px;
  background-color: #fff;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 820px 628px;
  background-image: url('../../../assets/images/libSetBg.png');
  // padding-right: 160px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // &.large {
  //   padding-right: 0;

  //   .knowledge-lib-tabs {
  //     min-width: 80%;
  //   }
  // }
}

.knowledge-lib-header {
  font-weight: bold;
  font-size: 16px;
  color: #2B2F33;
  line-height: 24px;
  margin-left: -20px;
}

.knowledge-lib-tabs {
  // margin-left: 16px;
  // width: 720px;
  margin-top: 5px;
  flex-grow: 1;
  overflow: hidden;

  .el-tab-pane {
    height: 100%;
    overflow: hidden;
  }
}
</style>
