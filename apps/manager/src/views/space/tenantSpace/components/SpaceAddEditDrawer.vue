<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus/es/components/form';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { useI18n } from 'vue-i18n';
import { isEmpty } from '@/utils/common.js';
import modal from '@/plugins/modal';
import type { AjaxResult, TenantSpaceEntity } from '@/types';
import { addTenantSpaceSingleApi, getTenantSpaceSingleApi, updateTenantSpaceSingleApi } from '@/api/space/tenantSpace.js';

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const { t } = useI18n();
const open = ref(false);
const title = ref(t('page.tenantSpace.title.add', '新增空间'));
const saveFormRef = ref<FormInstance>();
const form = ref<TenantSpaceEntity>({} as TenantSpaceEntity);
const rules: FormRules<TenantSpaceEntity> = {
  name: [{ required: true, message: '空间名称不能为空', trigger: 'blur' }]
};

const submitDisabled = computed(() => isEmpty(form.value.name));

/** 重置操作表单 */
function reset() {
  form.value = {} as TenantSpaceEntity;
  saveFormRef.value?.resetFields();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  title.value = t('page.tenantSpace.title.add', '新增空间');
  open.value = true;
}

/** 修改按钮操作 */
function handleUpdate(id: number) {
  reset();
  title.value = t('page.tenantSpace.title.update', '修改空间信息');
  getTenantSpaceSingleApi(id).then((res) => {
    if (res?.code === 200) {
      form.value = serverDataToFormData(res.data || ({} as TenantSpaceEntity));
      open.value = true;
    }
  });
}

function serverDataToFormData(data: TenantSpaceEntity) {
  const formData = { ...data };
  return formData;
}
function formDataToServerData(formData: TenantSpaceEntity) {
  const { ...serverData } = formData;
  return serverData;
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return updateTenantSpaceSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenantSpace.updateSuccess', '修改成功'));
      emit('success');
      open.value = false;
    }
  });
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return addTenantSpaceSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.tenantSpace.addSuccess', '新增成功'));
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
      <el-form-item :label="$t('page.tenantSpace.name', '空间名称')" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="$t('page.tenantSpace.namePlaceholder', '例如：我的新项目')"
          maxlength="999"
          :show-word-limit="false"
        />
      </el-form-item>
      <el-form-item :label="$t('page.tenantSpace.description', '空间描述')" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          :placeholder="$t('page.tenantSpace.descriptionPlaceholder', '简单描述一下这个空间的用途')"
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
