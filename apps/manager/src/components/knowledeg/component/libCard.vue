<template>
  <div class="lib-card">
    <div class="lib-card-top">
      <el-tooltip
        class="box-item"
        effect="dark"
        content="选择知识库"
        placement="top"
      >
        <el-checkbox
          class="check-box"
          v-model="state.info.check"
          label=""
          @change="handleSelect"
        />
      </el-tooltip>
      <div style="margin-right: 8px;">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="设置"
          placement="top" 
        >
          <svg-icon
            icon-class="libSet" 
            @click.stop="handleSet"
            style="margin-right: 8px;border: 1px dashed #bbb"
            v-hasPermi="['knowledge:lib:setup']"
          />
        </el-tooltip>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="置顶知识库"
          placement="top"
        >
          <svg-icon
            v-if="!state.info.top"
            icon-class="defaultTop"
            style="border: 1px dashed #bbb"
            @click.stop="handleUp"
            v-hasPermi="['knowledge:lib:setup']"
          />
          <svg-icon
            v-else
            icon-class="selectTop"
            style="border: 1px dashed #bbb"
            @click.stop="handleCancelUp"
            v-hasPermi="['knowledge:lib:setup']"
          />
        </el-tooltip>
      </div>
    </div>
    <div class="lib-card-click" @click.stop="handleManage(item)"></div>
    <div class="lib-card-title">
      {{ state.info.name }}
    </div>
    <div class="lib-card-info">
      <div class="lib-card-info-status" :style="{ color: getStatusColor(state.info.status) }">
        {{ getStatusName(state.info.status) }} {{ state.info.progress ? state.info.progress + "%" : ""}}
      </div>
      <div style="width: calc(100% - 30px);">
        <el-progress :percentage="state.info.progress" :color="state.info.status === 3 ? '#236FD2' : getStatusProgressColor(state.info.status)" :show-text="false">
        </el-progress>
      </div>
    </div>
  </div>
</template>
<script setup name="LibCard">
import { getStatusName, getStatusColor,getStatusProgressColor } from "../constance";
// const { proxy } = getCurrentInstance();

const emit = defineEmits(["setup", "manage", "toTop", "select","toTopCancel"]);

const props = defineProps({
  dataId: {
    type: String,
    default: "",
  },
  libItem: {
    type: Object,
  },
});

const state = reactive({
  info: {},
  dataId: '',
});

// 选择知识库
const handleSelect = () => {
  emit("select", state.info);
};

// 知识库文件管理
const handleManage = () => {
  emit("manage", state.info);
};

// 知识库编辑
const handleSet = () => {
  emit("setup", state.info);
};

// 知识库置顶
const handleUp = () => {
  emit("toTop", state.info);
};
// 知识库取消置顶
const handleCancelUp = () => {
  emit("toTopCancel", state.info);
};
watchEffect(() => {
  state.info = props.libItem;
  state.dataId = props.dataId;
});
</script>
<style lang="less" scoped>
.lib-card {
  width: 300px;
  height: 160px;
  // background: #f5f7f8;
  border-radius: 16px 16px 16px 16px;
  border: 1px solid #d1d6e2;
  // margin-left: 48px;
  // margin-right: 52px;
  // margin-bottom: 32px;
  box-sizing: border-box;
  position: relative;
  background: linear-gradient( 180deg, #F2F7FB 0%, #DCF0FF 100%);
}
.lib-card-top {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 8px;
  height: 24px;
  line-height: 24px;
}
.lib-card-click{
  position: absolute;
  left: 0;
  top: 28px;
  width: 300px;
  height: 132px;
}
.lib-card-title {
  width: 100%;
  font-weight: bold;
  font-size: 20px;
  color: #333333;
  line-height: 22px;
  text-align: center;
  font-style: normal;
  text-transform: none;
  margin-top: 28px;
  margin-bottom: 27px;
}
.lib-card-info {
  font-weight: 400;
  font-size: 14px;
  line-height: 22px;
  text-align: left;
  // width: calc(100% - 30px);
  margin: 0 30px;
}
.lib-card-info-status{
  margin-bottom: 8px;
}
.set-up {
  cursor: pointer;
}

.check-box {
  padding-left: 12px;
  box-sizing: border-box;
}
</style>
