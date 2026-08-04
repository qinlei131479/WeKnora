<template>
  <KJSCDialogV2
    v-model="state.visible"
    :title="state.title + '黑名单'"
    width="600px"
    show-subit-btn
    @submit-click="submitClick"
    @close="closeClick"
  >
    <el-form ref="saveForm" :model="state.saveInfo" :rules="state.rules" label-width="120px" label-position="left">
      <el-row>
        <el-col :span="24">
          <el-form-item label="黑名单名称" prop="tag">
            <el-input v-model="state.saveInfo.tag" clearable placeholder="请输入黑名单名称" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </KJSCDialogV2>
</template>

<script setup name="blackListEdit">
import { ref, reactive, defineProps, defineEmits, watch, watchEffect } from 'vue';
import cache from '@/plugins/cache'
import KJSCDialogV2 from "@/components/KJSCCmpt/KJSCDialogV2.vue";
import { whiteAdd,whiteEdit} from "@/api/system/white";
import { ElMessage } from 'element-plus';
import store from '@/store';

const props = defineProps({
  modelValue: {
    type: [Boolean],
    default: false
  },
  dataId: {
    type: [String, Number]
  }
});
const { proxy } = getCurrentInstance();
const emits = defineEmits(['update:modelValue', 'done']);
const saveForm = ref(null);
const state = reactive({
  visible: false,
  title: '添加',
  activeName: 'menu',
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  saveInfo: {
  }, // 表单数据
  props: {
    label: 'label',
    value: 'id',
    checkStrictly: true
  },
  rules: {
    tag: [
      {
        required: true,
        message: '请输入黑名单名称',
        trigger: 'blur'
      }
    ]
  }
});

// 保存
const submitClick = async () => {
  saveForm.value.validate(async (valid) => {
    if (valid) {
      const params = { ...state.saveInfo };
      params.type = 1;
      params.tenantId = cache.session.getJSON('tenantId');
      if (state.dataId) {
        // 编辑
        const res = await whiteEdit(params);
        if(res.code==200){
          proxy.$modal.msgSuccess('编辑成功');
        }else{
          proxy.$modal.msgError(res.msg);
        }
      } else {
        // 新增
        const res = await whiteAdd(params)
        if(res.code==200){
          proxy.$modal.msgSuccess('新增成功');
        }else{
          proxy.$modal.msgError(res.msg);
        }
      }
      closeClick();
      emits('done');
    } else {
      return false;
    }
  });
};

// 关闭
const closeClick = () => {
  saveForm.value.resetFields();
  state.dataId = '';
  state.visible = false;
};
watch(
  () => {
    return state.visible;
  },
  (val) => {
    emits('update:modelValue', val);
  }
);
watchEffect(() => {
  state.visible = props.modelValue;
  state.dataId = props.dataId;
  state.title = props.dataId ? '编辑' : '添加';
});
</script>
