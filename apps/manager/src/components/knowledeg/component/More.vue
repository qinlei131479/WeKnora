<template>
  <div class="more-info">
    <div class="title">知识库管理</div>
    <div class="op-row">
      <el-button type="danger" @click="handleDel">删除知识库</el-button>
    </div>
    <div class="op-row">
      <div class="mt-2 text-xs text-slate-500">删除后，所有向量数据及原文件将移入回收站中保存30天。</div>
    </div>
    <el-dialog
      v-model="state.dialogVisible"
      width="500"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
      class="more-dialog"
    >
      <div class="content">
        <svg-icon
          icon-class="error_info"
          style="width: 48px;height: 48px;"
        ></svg-icon>
        <div class="title-content">删除提示</div>
        <div class="info-content">
          <div>删除知识库将删除该知识库内全部数据</div>
          <div>请确认是否删除选中知识库</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.dialogVisible = false">取 消</el-button>
          <el-button type="danger" @click="submitClick">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MoreInfo">
import { ElMessage } from "element-plus";
import { delLibApi } from "@/api/knowledge/knowledgeApi";

const emits = defineEmits(["del"]);
const props = defineProps({
  dataId: {
    type: String,
    default: "",
  },
});

const state = reactive({
  dialogVisible: false,
});

/** 提交按钮 */
function handleDel() {
  state.dialogVisible = true;
}

const submitClick = () => {
  delLibApi(props.dataId).then((res) => {
    if (res?.code === 200) {
      ElMessage.success("删除成功");
      state.dialogVisible = false;
      emits("del");
    } else {
      ElMessage.error(res?.msg || "删除失败");
    }
  });
};
</script>
<style lang="less" scoped>
.more-info {
  margin-left: 40px;
  .title {
    font-weight: 400;
    font-size: 14px;
    color: #333333;
    margin-bottom: 16px;
  }
}
.content{
  text-align: center;
}
.title-content {
  font-weight: bold;
  font-size: 18px;
  color: #333333;
  margin-top: 24px;
}
.info-content {
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  line-height: 20px;
  text-align: center;
  margin-top: 24px;
}
</style>
<style>
.more-dialog{
  .el-dialog__header{
    padding: 0;
  }
  .el-dialog--center .el-dialog__body{
    padding: 32px;
    box-sizing: border-box;
  }
  .el-dialog__footer{
    padding: 0 0 24px 0;
    box-sizing: border-box;
  }
}
</style>
