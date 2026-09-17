<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus/es/components/form';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import modal from '@/plugins/modal';
import { useI18n } from 'vue-i18n';
import { Trash } from 'lucide-vue-next';
import { useRoleOptions } from '@/composables/useRoleLabel';
import type { AjaxResult, TenantMemberEntity, TenantMemberTenantIdAndRole, TenantSpaceEntity, ValueLabelOption } from '@/types';
import { addTenantMemberSingleApi, getTenantMemberSingleApi, updateTenantMemberSingleApi } from '@/api/space/tenantMember.js';
import { getTenantSpaceListApi } from '@/api/space/tenantSpace';

interface FormEntity extends TenantMemberEntity {
  password?: string;
  bindTenants: TenantMemberTenantIdAndRole[];
}

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const { t } = useI18n();
const open = ref(false);
const mode = ref<'add' | 'edit'>('add');
const title = ref(t('page.tenantMember.addTitle', '新增空间成员'));
const saveFormRef = ref<FormInstance>();
const form = ref<FormEntity>({ bindTenants: [] });

const validateBindTenants = (_rule: unknown, value: TenantMemberTenantIdAndRole[], callback: (error?: Error) => void) => {
  if (!value || value.length === 0) {
    callback(new Error(t('page.tenantMember.error.tenants.empty', '关联空间&空间角色不能为空')));
  } else {
    let errorMsg: string | null = null;
    value.some((item: TenantMemberTenantIdAndRole) => {
      if (!item.tenantId) {
        errorMsg = t('page.tenantMember.error.tenants.space', '关联空间不能为空');
        return true;
      } else if (!item.role) {
        errorMsg = t('page.tenantMember.error.tenants.role', '关联角色不能为空');
        return true;
      }
    });
    if (errorMsg) {
      callback(new Error(errorMsg));
    } else {
      callback();
    }
  }
};

const addRules: FormRules<FormEntity> = {
  username: [{ required: true, message: t('page.tenantMember.error.username', '租户成员名称不能为空'), trigger: 'blur' }],
  password: [{ required: true, message: t('page.tenantMember.error.password', '密码不能为空'), trigger: 'blur' }],
  email: [{ required: true, message: t('page.tenantMember.error.email', '登录账号不能为空'), trigger: 'blur' }],
  bindTenants: [{ validator: validateBindTenants, trigger: 'change' }]
};
const editRules: FormRules<FormEntity> = {
  bindTenants: [{ validator: validateBindTenants, trigger: 'change' }]
};

const tenantOptions = ref<TenantSpaceEntity[]>([]);
const tenantRoleOptions = ref<ValueLabelOption[]>(useRoleOptions());
const addBindTenant = () => {
  form.value.bindTenants.push({
    tenantId: undefined,
    role: undefined
  });
};
const removeBindTenant = (index: number) => {
  if (form.value.bindTenants.length <= 1) {
    return;
  }
  form.value.bindTenants.splice(index, 1);
};

const getTenantOptions = () => {
  getTenantSpaceListApi({}, { pageNum: 1, pageSize: 9999 }).then((res) => {
    tenantOptions.value = res.rows || [];
  });
};
const handleSaveModelOpen = () => {
  getTenantOptions();
};

/** 重置操作表单 */
function reset() {
  form.value = {
    bindTenants: [
      {
        tenantId: undefined,
        role: undefined
      }
    ] as TenantMemberTenantIdAndRole[]
  };
  saveFormRef.value?.resetFields();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  title.value = t('page.tenantMember.addTitle', '新增成员');
  open.value = true;
  mode.value = 'add';
}

/** 修改按钮操作 */
function handleUpdate(id: string) {
  reset();
  title.value = t('page.tenantMember.updateTitle', '修改成员信息');
  mode.value = 'edit';
  getTenantMemberSingleApi(id).then((res) => {
    if (res?.code === 200) {
      form.value = serverDataToFormData(res.data || {});
      open.value = true;
    }
  });
}

function serverDataToFormData(data: TenantMemberEntity) {
  const formData = { ...data } as FormEntity;
  formData.bindTenants = data.tenants || [];
  return formData;
}
function formDataToServerData(formData: FormEntity) {
  const { bindTenants, ...serverData } = formData;
  serverData.tenants = bindTenants || [];
  return serverData;
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return updateTenantMemberSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'));
      emit('success');
      open.value = false;
    }
  });
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return addTenantMemberSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'));
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
  <KjscRtlDrawer :title="title" v-model="open" size="800px" @open="handleSaveModelOpen">
    <el-form
      :model="form"
      :rules="mode === 'add' ? addRules : editRules"
      ref="saveFormRef"
      label-position="left"
      class="tenant-space-form"
      :label-width="$dim('page.tenantMember.formLabel', 120)"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item :label="$t('page.tenantMember.username', '成员名称')" prop="username">
            <el-input
              v-model="form.username"
              :placeholder="$t('page.tenantMember.usernamePlaceholder', '请输入成员名称')"
              maxlength="999"
              :show-word-limit="false"
              :disabled="mode === 'edit'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('page.tenantMember.password', '密码')" prop="password" label-position="right">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              autocomplete="new-password"
              :placeholder="$t('page.tenantMember.passwordPlaceholder', '请输入账号密码')"
              maxlength="999"
              :show-word-limit="false"
              :disabled="mode === 'edit'"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item :label="$t('page.tenantMember.email', '登录账号')" prop="email">
        <el-input v-model="form.email" :placeholder="$t('page.tenantMember.emailPlaceholder', '请输入登录账号')" :disabled="mode === 'edit'" />
      </el-form-item>
      <el-form-item :label="$t('page.tenantMember.spaceAndRole', '空间&角色')" prop="bindTenants">
        <div class="space-and-role">
          <div class="add-area">
            <el-button type="primary" size="small" @click="addBindTenant">
              {{ $t('page.normal.addNew', '新增') }}
            </el-button>
          </div>
          <div class="list-area">
            <div v-for="(item, index) in form.bindTenants" :key="index" class="item-area">
              <el-select-v2
                v-model="item.tenantId"
                :options="tenantOptions"
                filterable
                :props="{ value: 'id', label: 'name' }"
                :placeholder="$t('page.tenantMember.spacePlaceholder', '请选择空间')"
              />
              <el-select-v2
                v-model="item.role"
                :options="tenantRoleOptions"
                filterable
                :placeholder="$t('page.tenantMember.rolePlaceholder', '请选择角色')"
              />
              <el-button type="danger" text @click="removeBindTenant(index)">
                <el-icon><Trash /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="manage-dialog-footer">
        <el-button @click="closeDialog">
          {{ t('page.normal.cancel', '取消') }}
        </el-button>
        <el-button type="primary" @click="submitForm">
          {{ t('page.normal.save', '保存') }}
        </el-button>
      </div>
    </template>
  </KjscRtlDrawer>
</template>

<style scoped lang="scss">
.space-and-role {
  width: 100%;
  .add-area {
    margin-bottom: 12px;
  }
  .list-area {
    overflow: auto;
    max-height: 400px;
    .item-area {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .el-select {
        + .el-select {
          margin-left: 12px;
        }
      }
    }
  }
}
</style>
