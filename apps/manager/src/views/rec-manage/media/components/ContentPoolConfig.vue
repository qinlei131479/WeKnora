<template>
  <el-dialog :model-value="props.modelValue" :title="state.title" :width="props.width"
    append-to-body
    @open="onOpen" @close="onClose">
    <el-form ref="formRef" :model="state.form" :rules="state.rules" label-width="120px">
      <el-form-item label="内容池配置：" prop="recType">
        <el-checkbox-group v-model="state.form.recType">
          <el-checkbox v-for="dict in recTypeOptions" :key="'search_recType_' + dict.value" :value="dict.value">{{ dict.label }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm" :disabled="!props.dataId">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import api from '@/utils/api';
import { contentType_cherryPick, contentType_base, contentTypeNames } from '@/utils/dict';
const { proxy } = getCurrentInstance()
// const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const emit = defineEmits(["change", "update:modelValue"])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  dataId: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "1",
  },
  width: {
    type: String,
    default: "500px",
  },
})
const state = reactive({
  open: false,
  title: "内容池管理",
  form: {
    recType: []
  },
  rules: {
    recType: [{ required: true, message: "请选择推荐类型", trigger: "blur" }],
  },
})
const recTypeOptions = [
  {
    label: contentTypeNames[contentType_cherryPick],
    value: contentType_cherryPick,
  },
  // {
  //   label: contentTypeNames[contentType_rec],
  //   value: contentType_rec
  // },
  {
    label: contentTypeNames[contentType_base],
    value: contentType_base
  }
];
const onOpen = () => {
  if (props.dataId) {
    getDataById(props.dataId)
  } else {
    state.form = {
      recType: []
    }
  }
}
const onClose = () => {
  close()
}
const getDataById = (dataId: string) => {
  api.mediaCapital.getContentPoolConfigById(dataId).then((res: any) => {
    if (res.code == 200) {
      state.form.recType = res.data.contentTypes || []
    }
  })
}
const submitForm = () => {
  proxy.$refs["formRef"].validate((valid: boolean) => {
    if (valid) {
      doSubmit()
    }
  })
}
const doSubmit = () => {
  const params = {
    contentTypes: state.form.recType,
    code: props.dataId,
    type: props.type,
  }
  api.mediaCapital.saveContentPoolConfig(params).then((res: any) => {
    if (res.code == 200) {
      proxy.$modal.msgSuccess("提交成功")
      emit("change", true)
      close(true)
    }
  })
}
const cancel = () => {
  emit("update:modelValue", false)
}
const close = (change?: boolean) => {
  emit("update:modelValue", false)
  if (change) {
    emit("change", true)
  }
}
</script>
<style scoped lang="less"></style>
