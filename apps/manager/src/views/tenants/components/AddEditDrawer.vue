<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus/es/components/form';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import { isEmpty } from '@/utils/common.js';
import modal from '@/plugins/modal';
import type { AjaxResult, TenantsDTO, TenantsVO } from '@/types';
import { API } from '@/api';

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const open = ref(false);
const title = ref(t('page.tenants.title.add', '新增空间'));
const saveFormRef = ref<FormInstance>();
const form = ref<TenantsDTO>({});
const rules: FormRules<TenantsDTO> = {
  name: [{ required: true, message: '空间名称不能为空', trigger: 'blur' }]
};

const submitDisabled = computed(() => isEmpty(form.value.name));

/** 重置操作表单 */
function reset() {
  form.value = {};
  saveFormRef.value?.resetFields();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  title.value = t('page.tenants.title.add', '新增空间');
  open.value = true;
}

/** 修改按钮操作 */
function handleUpdate(id: number) {
  reset();
  title.value = t('page.tenants.title.update', '修改空间信息');
  API.Tenants.single(id).then((res) => {
    if (res?.code === 200) {
      form.value = serverDataToFormData(res.data || {});
      open.value = true;
    }
  });
}

function serverDataToFormData(data: TenantsVO): TenantsDTO {
  const { deletedAt, ...formData } = data;
  return formData;
}
function formDataToServerData(formData: TenantsDTO): TenantsDTO {
  const { ...serverData } = formData;
  return serverData;
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return API.Tenants.update(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenants.updateSuccess', '修改成功'));
      emit('success');
      open.value = false;
    }
  });
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return API.Tenants.insert(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenants.addSuccess', '新增成功'));
      emit('success');
      open.value = false;
    }
  });
}

/** 提交按钮 */
function submitForm() {
  saveFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (form.value.id) {
        doUpdate();
      } else {
        doAdd();
      }
    }
  });
}
function closeDialog() {
  open.value = false;
}

defineExpose({
  openAdd: handleAdd,
  openEdit: handleUpdate
});
</script>

<template>
  <KjscRtlDrawer :title="title" v-model="open" size="800px">
    <el-form :model="form" :rules="rules" ref="saveFormRef" label-position="top" class="tenant-space-form">
      <el-form-item :label="$t('page.tenants.name', '空间名称')" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="$t('page.tenants.namePlaceholder', '例如：我的新项目')"
          maxlength="999"
          :show-word-limit="false"
        />
      </el-form-item>
      <el-form-item :label="$t('page.tenants.description', '空间描述')" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          :placeholder="$t('page.tenants.descriptionPlaceholder', '简单描述一下这个空间的用途')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="manage-dialog-footer">
        <el-button class="close-btn" @click="closeDialog">
          {{ $t('page.normal.cancel', '取消') }}
        </el-button>
        <el-button class="submit-btn" type="primary" :disabled="submitDisabled" @click="submitForm">
          {{ $t('page.normal.save', '保存') }}
        </el-button>
      </div>
    </template>
  </KjscRtlDrawer>
</template>
