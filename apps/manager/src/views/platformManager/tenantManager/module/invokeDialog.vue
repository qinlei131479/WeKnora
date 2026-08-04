<template>
  <!-- 添加调用次数对话框 -->
  <KJSCDialogV2
    title="添加调用次数"
    v-model="state.visible"
    width="750px"
    append-to-body
    :showCloseBtn="false"
    :showSubitBtn="false"
    @open="openDialog"
  >
    <div class="content-style">
      <div class="content-style-title">{{ props.dataName }}</div>
      <Statistical :isShowImg="false" style="justify-content: start" :data="state.dataObj" :tenantInfo="props.teantInfo" />
      <el-form
        :model="state.form"
        :rules="state.rules"
        ref="callRef"
        class="content-style-form"
      >
        <el-form-item label="添加次数" prop="callTimes">
          <el-input v-model="state.form.callTimes" placeholder="请输入整数数字">
            <template #append>万次</template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
    <template #prefixFooter>
      <div class="dialog-footer">
        <kjsc-button @click="cancel">取 消</kjsc-button>
        <kjsc-button
          type="primary"
          :disabled="!state.form.callTimes"
          @click="invokeSubmitForm"
          >确 定</kjsc-button
        >
      </div>
    </template>
  </KJSCDialogV2>
</template>

<script setup>
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import Statistical from "@/components/Tenant/statistical";
import api from "@/utils/api";

const emits = defineEmits(["update:modelValue", "submitClick", "cancleClick"]);
const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false,
  },
  dataId: {
    type: String,
    default: "",
  },
  dataName: {
    type: String,
    default: "",
  },
  teantInfo: {
    type: Object,
    default: () => {},
  }
});

const { proxy } = getCurrentInstance();

// 校验调用次数
const validateCallTimes = (rule, value, callback) => {
  if (!value) {
    callback(new Error("调用次数不能为空"));
  } else {
    const regex = /[^\d]/g;
    if (!regex.test(value)) {
      callback();
    } else {
      callback(new Error("只能输入整数数字"));
    }
  }
};
const state = reactive({
  visible: false,
  dataId: "",
  dataObj: {},
  form: {
    callTimes: "",
  },
  rules: {
    callTimes: [
      { required: true, validator: validateCallTimes, trigger: "blur" },
    ],
  },
});

watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits("update:modelValue", val);
  }
);

watchEffect(() => {
  state.visible = props.modelValue;
  state.dataId = props.dataId;
});

const reset = () => {
  state.dataId = "";
  state.dataObj = {};
  state.form = {};
  state.visible = false;
};

const cancel = () => {
  reset();
  emits("cancleClick");
};

const invokeSubmitForm = () => {
  proxy.$refs["callRef"].validate(async (valid) => {
    if (valid) {
      state.form.tenantId = state.dataId;
      let res = await api.tenantManager.addCallCount(state.form);
      if (res.code === 200) {
        proxy.$modal.msgSuccess("操作成功");
        reset();
        emits("update:modelValue", false);
        emits("submitClick");
      } else {
        proxy.$modal.msgSuccess(res.msg || "操作失败，请重新提交");
      }
    }
  });
};

const getTenantCountNum = async () => {
  let res = await api.tenantManager.getTenantCount(state.dataId);
  if (res.code === 200) {
    state.dataObj = res.data;
  }
};

const openDialog = () => {
  getTenantCountNum();
};
</script>
<style lang="less" scoped>
.content-style-title {
  margin-bottom: 24px;
  font-family: '思源黑体 CN';
  font-weight: 500;
  font-size: 16px;
  color: #0c113d;
}
.content-style-form {
  margin-top: 24px;
}
</style>
