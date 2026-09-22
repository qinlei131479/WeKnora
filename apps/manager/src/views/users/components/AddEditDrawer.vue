<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus/es/components/form';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import modal from '@/plugins/modal';
import { t } from '@/i18n';
import { Trash } from 'lucide-vue-next';
import { useRoleOptions } from '@/composables/useRoleLabel';
import type { AjaxResult, UsersDTO, UsersVO, BindTenantDTO, TenantsVO, ValueLabelOption } from '@/types';
import { API } from '@/api';

interface FormEntity extends Omit<UsersDTO, 'tenants'> {
  bindTenants: BindTenantDTO[];
}

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const open = ref(false);
const mode = ref<'add' | 'edit'>('add');
const title = ref(t('page.users.addTitle', '新增空间成员'));
const saveFormRef = ref<FormInstance>();
const form = ref<FormEntity>({ id: '', bindTenants: [] });

const validateBindTenants = (_rule: unknown, value: BindTenantDTO[], callback: (error?: Error) => void) => {
  if (!value || value.length === 0) {
    callback(new Error(t('page.users.error.tenants.empty', '关联空间&空间角色不能为空')));
  } else {
    let errorMsg: string | null = null;
    value.some((item: BindTenantDTO) => {
      if (!item.tenantId) {
        errorMsg = t('page.users.error.tenants.space', '关联空间不能为空');
        return true;
      } else if (!item.role) {
        errorMsg = t('page.users.error.tenants.role', '关联角色不能为空');
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
  account: [
    { required: true, message: t('page.users.error.account', '账号不能为空'), trigger: 'blur' },
    {
      pattern: /^[A-Za-z][A-Za-z0-9_]*$/,
      message: t('page.users.error.accountFormat', '账号必须以字母开头，只能包含字母、数字和下划线'),
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: t('page.users.error.password', '密码不能为空'), trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*[0-9]).{6,20}$/,
      message: t('page.users.error.passwordFormat', '密码必须包含字母和数字，长度为6~20位'),
      trigger: 'blur'
    }
  ],
  username: [{ required: true, whitespace: true, message: t('page.users.error.username', '用户名不能为空'), trigger: 'blur' }],
  email: [
    { required: true, message: t('page.users.error.email', '邮箱不能为空'), trigger: 'blur' },
    { type: 'email', message: t('page.users.error.emailFormat', '请输入正确的邮箱地址'), trigger: 'blur' }
  ],
  bindTenants: [{ validator: validateBindTenants, trigger: 'change' }]
};
const editRules: FormRules<FormEntity> = {
  bindTenants: [{ validator: validateBindTenants, trigger: 'change' }]
};

const tenantOptions = ref<TenantsVO[]>([]);
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
  API.Tenants.list({}, { pageNum: 1, pageSize: 9999 }).then((res) => {
    tenantOptions.value = res.rows || [];
  });
};
const handleSaveModelOpen = () => {
  getTenantOptions();
};

/** 重置操作表单 */
function reset() {
  saveFormRef.value?.resetFields();
  form.value = {
    id: '',
    bindTenants: [
      {
        tenantId: undefined,
        role: undefined
      }
    ]
  };
  nextTick(() => {
    saveFormRef.value?.clearValidate();
  });
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  title.value = t('page.users.addTitle', '新增成员');
  open.value = true;
  mode.value = 'add';
}

/** 修改按钮操作 */
function handleUpdate(id: string) {
  reset();
  title.value = t('page.users.updateTitle', '修改成员信息');
  mode.value = 'edit';
  API.Users.single(id).then((res) => {
    if (res?.code === 200) {
      form.value = serverDataToFormData(res.data || {});
      open.value = true;
    }
  });
}

function serverDataToFormData(data: UsersVO): FormEntity {
  return {
    id: data.id || '',
    account: data.account,
    username: data.username,
    email: data.email,
    bindTenants: (data.tenants || []).map(({ tenantId, role }) => ({ tenantId, role }))
  };
}
function formDataToServerData(formData: FormEntity): UsersDTO {
  const { bindTenants, ...serverData } = formData;
  return {
    ...serverData,
    tenants: bindTenants || []
  };
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return API.Users.update(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'));
      emit('success');
      open.value = false;
    }
  });
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return API.Users.insert(params).then((res: AjaxResult) => {
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
      :validate-on-rule-change="false"
      ref="saveFormRef"
      label-position="left"
      class="tenant-space-form"
      :label-width="$dim('page.users.formLabel', 120)"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item :label="$t('page.users.account', '账号')" prop="account">
            <el-input v-model="form.account" :placeholder="$t('page.users.accountPlaceholder', '请输入账号')" :disabled="mode === 'edit'" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('page.users.password', '密码')" prop="password" label-position="right">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              autocomplete="new-password"
              :placeholder="$t('page.users.passwordPlaceholder', '请输入密码')"
              maxlength="20"
              :show-word-limit="false"
              :disabled="mode === 'edit'"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item :label="$t('page.users.username', '用户名')" prop="username">
            <el-input
              v-model="form.username"
              :placeholder="$t('page.users.usernamePlaceholder', '请输入用户名')"
              maxlength="999"
              :show-word-limit="false"
              :disabled="mode === 'edit'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('page.users.email', '邮箱')" prop="email" label-position="right">
            <el-input v-model="form.email" :placeholder="$t('page.users.emailPlaceholder', '请输入邮箱')" :disabled="mode === 'edit'" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item :label="$t('page.users.spaceAndRole', '租户&角色')" prop="bindTenants">
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
                :placeholder="$t('page.users.spacePlaceholder', '请选择空间')"
              />
              <el-select-v2
                v-model="item.role"
                :options="tenantRoleOptions"
                filterable
                :placeholder="$t('page.users.rolePlaceholder', '请选择角色')"
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
