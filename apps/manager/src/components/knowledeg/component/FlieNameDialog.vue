<template>
  <el-dialog
      :title="props.fileOperateTitle"
      :model-value="props.modelValue"
      width="400px"
      append-to-body
      @update:model-value="emits('update:modelValue', $event)"
    >
      <el-form ref="queryRef" :model="state.addForm" :rules="state.rules" @submit.prevent>
        <el-form-item label="名称" prop="folderName">
          <el-input
            v-model="state.addForm.folderName"
            placeholder="请输入文件夹名称"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="submitAddFolder"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
</template>

<script setup name="FlieNameDialog">
import { addFolder,renameFileApi } from "@/api/knowledge/knowledgeApi";
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    params:{
        type: Object,
        default: {}
    },
    fileOperateTitle:{
        type: String,
        default: ''
    },
    folderName:{
        type: String,
        default: ''
    }
})
const emits = defineEmits(['update:modelValue','append','done']);
const state = reactive({
    folderName:'',
    rules: {
        folderName: [{
            required: true,
            message: "请输入文件夹名称",
            trigger: "blur",
        }],
    },
    addForm: {
        folderName: "",
    },
    fileNameParams:{}
})
const { proxy } = getCurrentInstance();
const submitAddFolder = async() => {
  proxy.$refs["queryRef"].validate((valid) => {
    if (valid) {
        var params = {};
        if(props.fileOperateTitle =='重命名'){
            params = {
                id: state.fileNameParams.id,
                fileName: state.addForm.folderName,
            }
            renameFileApi(params).then((res) => {
                if (res?.code == 200) {
                    proxy.$modal.msgSuccess("重命名成功");
                    emits("append");
                }
            });
        }else{
            params = {
              name: state.addForm.folderName,
              knowledgeId:state.fileNameParams.knowledgeId,
              parentCode:state.fileNameParams.parentCode
            }
            addFolder(params).then((res) => {
              if (res.code == 200) {
                  proxy.$modal.msgSuccess("添加成功");
                  proxy.resetForm("queryRef");
                  state.addForm = {};
                  emits("append");
              } else {
                  proxy.$modal.msgError(res.msg);
                  handleCancel();
              }
            })
        }
    }
  });
};
const handleCancel = () => {
    proxy.resetForm("queryRef");
    state.addForm = {};
    emits("done");
    emits('update:modelValue', false)
};
watchEffect(() => {
  state.fileNameParams = props.params;
  if(props.fileOperateTitle =='重命名'){
    state.addForm.folderName = props.params.fileName;
  }
})
</script>

<style>

</style>