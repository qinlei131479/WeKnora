<template>
  <KJSCDialogV2 v-model="state.visible" :title="$t('page.system.whiteList.allowlist', { value1: state.title }, '{value1}白名单')" width="600px" show-subit-btn @submit-click="submitClick" @close="closeClick">
    <el-form ref="saveForm" :model="state.saveInfo" :rules="state.rules" label-width="120px" label-position="left">
      <el-row>
        <el-col :span="24">
          <el-form-item :label="$t('page.system.whiteList.allowlistName', '白名单名称')" prop="tag">
            <el-input v-model="state.saveInfo.tag" clearable :placeholder="$t('page.system.whiteList.enterAnAllowlistName', '请输入白名单名称')" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </KJSCDialogV2>
</template>

<script setup name="whiteListEdit">
import { t } from '@/i18n';
import cache from '@/plugins/cache';
import { ref, reactive, watch, watchEffect } from 'vue';
import KJSCDialogV2 from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import { whiteAdd, whiteEdit } from '@/api/system/white';

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
  title: t('page.system.blackList.add', '添加'),
  activeName: 'menu',
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  saveInfo: {}, // 表单数据
  props: {
    label: 'label',
    value: 'id',
    checkStrictly: true
  },
  rules: {
    tag: [
      {
        required: true,
        get message() { return t('page.system.whiteList.enterAnAllowlistName', '请输入白名单名称'); },
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
      params.type = 0;
      params.tenantId = cache.session.getJSON('tenantId');
      if (state.dataId) {
        // 编辑
        const res = await whiteEdit(params);
        if (res.code == 200) {
          proxy.$modal.msgSuccess(t('common.dict.updatedSuccessfully', '编辑成功'));
        } else {
          proxy.$modal.msgError(res.msg);
        }
      } else {
        // 新增
        const res = await whiteAdd(params);
        if (res.code == 200) {
          proxy.$modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'));
        } else {
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
  state.title = props.dataId ? t('page.normal.edit', '编辑') : t('page.system.blackList.add', '添加');
});
</script>
