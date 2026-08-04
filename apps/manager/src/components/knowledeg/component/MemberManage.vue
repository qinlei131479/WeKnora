<template>
  <div class="MemberManage">
    <el-form
      ref="saveFormRef"
      :model="state.saveForm"
      :rules="state.saveRules"
      label-width="140px"
      label-position="top"
    >
      <!-- <el-form-item label="可见范围" prop="scopeType">
        <el-radio-group v-model="state.saveForm.scopeType" :disabled="state.dataError || state.dataUpdating" class="radio-group-1">
          <el-radio label="1" @click.stop="handleClickScopeType">仅本部门可见</el-radio>
          <el-radio label="2" @click.stop="handleClickScopeType">仅对应成员可见</el-radio>
          <el-radio label="3" @click.stop="handleClickScopeType">全公司公开可见</el-radio>
        </el-radio-group>
      </el-form-item> -->
      <el-form-item label="知识库权限管理" prop="userIds">
        <MemberList :lib-id="props.dataId" :refresh="state.memberListRefresh" @change="handleMemberChange" />
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup name="MemberManage">
import MemberList from "../component/MemberList.vue";
import { getLibApi, saveLibVisibleApi } from "@/api/knowledge/knowledgeApi";
const { proxy } = getCurrentInstance();
// const emits = defineEmits(["update:modelValue", "done"]);
const props = defineProps({
  dataId: {
    type: [String, Number],
    default: ''
  },
});
const state = reactive({
  disabled: false,
  dataError: false,
  dataUpdating: false,
  libItem: {},
  saveForm: {},
  saveRules: {
    scopeType: [
      { required: true, message: "可见范围不能为空", trigger: "change" },
    ],
    userIds: [
      { required: true, message: "成员不能为空", trigger: "change" },
    ],
  },
  memberListRefresh: null
});

const getLibInfo = ()=>{
  state.dataError = false;
  getLibApi(props.dataId).then(res=>{
    if (res?.code === 200) {
      state.libItem = res.data;
      updateSaveForm(res.data);
    } else {
      state.dataError = true;
    }
  }, ()=>{
    state.dataError = true;
  });
}

let delayTimer = 0;
const handleClickScopeType = () => {
  if (delayTimer) {
    clearTimeout(delayTimer);
  }
  delayTimer = setTimeout(doSave, 500);
};

function doSave(){
  if (state.saveForm.scopeType === ''+state.libItem?.scopeType) {
    return;
  }
  state.dataUpdating = true;
  setTimeout(function(){
    state.dataUpdating = false;
  }, 1000);
  const params = {...state.saveForm};
  saveLibVisibleApi(params).then((res)=>{
    if (res.code === 200) {
      let tipsMessage = "修改成功";
      proxy.$modal.msgSuccess(tipsMessage);
      state.memberListRefresh = {};
    }
    getLibInfo();
  },()=>{
    getLibInfo();
  });
}

function updateSaveForm(libItem){
  state.saveForm = {...libItem};
  state.saveForm.scopeType = ''+state.saveForm.scopeType;
}

function handleMemberChange(){
  getLibInfo();
}

function init(){
  getLibInfo();
}
init();
</script>
<style lang="less" scoped>
.radio-group-1 {
  flex-direction: column;
  align-items: flex-start;
}
.MemberManage{
  // padding-top: 20px;
  // margin-left: 40px;
}
</style>
