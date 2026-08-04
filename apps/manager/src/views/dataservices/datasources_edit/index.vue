<template>
  <my-page class="datasource-edit-my-page">
    <div class="page-header">
      <div class="header-title">
        <el-button :icon="ArrowLeft" text circle @click="handleCancel" />
        <div>
          <h1>{{ isEdit ? '编辑物理数据源' : '绑定物理数据源' }}</h1>
          <p>配置物理数据库、提取元数据，实现智能体安全直连</p>
        </div>
      </div>

      <div class="header-actions">
        <btn @click="handleCancel">取消</btn>
        <btn type="primary" :icon="Save" :loading="saving" @click="handleSave">测试通过并保存</btn>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :validate-on-rule-change="false"
      label-position="top"
      class="datasource-edit-page"
    >
      <el-card shadow="never" class="form-panel datasource-config-panel">
        <template #header>
          <div class="panel-title">选择目标资源类型</div>
        </template>

        <div class="type-grid">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            class="type-option"
            :class="{ 'is-active': form.dsType === option.value }"
            :aria-pressed="form.dsType === option.value"
            @click="handleTypeChange(option.value)"
          >
            <el-icon class="type-option__icon">
              <component :is="option.icon" />
            </el-icon>
            <span class="type-option__label">{{ option.label }}</span>
          </button>
        </div>

        <div class="form-grid form-grid--connection">
          <el-form-item label="连接名称" prop="name" required>
            <input-radius v-model="form.name" maxlength="80" placeholder="例如：核心交易库主/从库" />
          </el-form-item>

          <el-form-item label="归属领域分类" prop="categoryId" required>
            <el-cascader
              v-model="form.categoryId"
              :options="categoryOptions"
              :props="categoryProps"
              clearable
              filterable
              placeholder="选择数据源归属分类"
            />
          </el-form-item>

          <MySQL v-if="form.dsType === 1" v-model="form" />
          <PostgreSQL v-if="form.dsType === 2" v-model="form" />
        </div>
      </el-card>

      <el-card shadow="never" class="form-panel datasource-credentials-panel">
        <template #header>
          <div class="panel-title">安全认证凭据</div>
        </template>

        <div class="form-grid form-grid--credentials">
          <el-form-item label="Username（物理只读用户名）" prop="username" required>
            <input-radius v-model="form.username" maxlength="255" placeholder="root或reader" />
          </el-form-item>

          <el-form-item label="Password（物理访问密码）" prop="password" required>
            <input-radius
              v-model="form.password"
              type="password"
              maxlength="255"
              show-password
              placeholder="密码将进行对称硬件卡加密"
            />
          </el-form-item>
        </div>

        <div class="connect-confirm">
          <div class="connect-tip">
            <el-icon>
              <InfoFilled />
            </el-icon>
            <span>物理连通性选择：连通检测通过后，系统才可以提取元数据提供给Agent。</span>
          </div>
          <btn type="primary" :loading="testing" @click="handleTest">手动测试物理连接性</btn>
        </div>

        <div v-if="connectionStatus !== 'idle'" class="connection-status" :class="connectionStatus">
          {{ connectionMessage }}
        </div>
      </el-card>
    </el-form>
  </my-page>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue';
import { ArrowLeft, Database, Save } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import type { FormInstance as ElFormInstance } from 'element-plus/es/components/form';
import type { FormRules as ElFormRules } from 'element-plus/es/components/form/src/types';
import { agiDatasource } from '@/api/dataservices/datasource';
import { agiCategory } from '@/api/settings/category';
import type { CategoryVO, DatasourceDTO, DatasourceVO } from '@/types';
import MySQL from './components/MySQL.vue';
import PostgreSQL from './components/PostgreSQL.vue';

const router = useRouter();
const formRef = ref<ElFormInstance>();
const categories = ref<CategoryVO[]>([]);
const testing = ref(false);
const saving = ref(false);
const connectionStatus = ref('idle');
const connectionMessage = ref('');
const validationFailed = Symbol('validationFailed');

const datasource = history.state?.datasource as DatasourceVO | undefined;
const form = ref<DatasourceVO>({
  dsType: 1,
  status: 2,
  name: '',
  categoryId: undefined,
  host: '',
  port: 3306,
  dsName: '',
  username: '',
  password: '',
  description: '',
  ...(datasource || {}),
  tableSchema: datasource?.dsType === 2 ? datasource.tableSchema || 'public' : undefined
});
const isEdit = computed(() => Boolean(form.value.id));

const typeOptions = [
  { label: 'MySQL', value: 1, icon: Database },
  { label: 'PostgreSQL', value: 2, icon: Database }
];

const categoryOptions = computed(() => categories.value);
const categoryProps = {
  value: 'id',
  label: 'name',
  children: 'childrenList',
  checkStrictly: true,
  checkOnClickNode: true,
  showPrefix: false,
  emitPath: false
};

const rules = computed<ElFormRules<DatasourceVO>>(() => ({
  name: [{ required: true, message: '请填写数据源名称', trigger: 'submit' }],
  categoryId: [{ required: true, message: '请选择归属领域分类', trigger: 'submit' }],
  host: [{ required: true, message: '请填写主机地址', trigger: 'submit' }],
  port: [{ required: true, message: '请填写端口', trigger: 'submit' }],
  dsName: [{ required: true, message: '请填写数据库名', trigger: 'submit' }],
  tableSchema: form.value.dsType === 2 ? [{ required: true, message: '请填写 Schema', trigger: 'submit' }] : [],
  username: [{ required: true, message: '请填写用户名', trigger: 'submit' }],
  password: [{ required: true, message: '请填写密码', trigger: 'submit' }]
}));

const apiCategoryTree = () => {
  agiCategory
    .tree()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      categories.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取数据源分类失败', err);
    });
};

const handleTypeChange = (dsType: number) => {
  if (form.value.dsType === dsType) return;

  form.value.dsType = dsType;
  form.value.port = dsType === 1 ? 3306 : 5432;
  form.value.tableSchema = dsType === 2 ? 'public' : undefined;
  form.value.host = datasource?.host ?? '';
  form.value.dsName = datasource?.dsName ?? '';
  form.value.username = datasource?.username ?? '';
  form.value.password = datasource?.password ?? '';
  connectionStatus.value = 'idle';
  nextTick(() => formRef.value?.clearValidate());
};

const handleTest = (): Promise<boolean> => {
  const { dsType, host, port, dsName, tableSchema, username, password } = form.value;
  if (!dsType || !host?.trim() || !port || !dsName?.trim() || !username?.trim() || !password?.trim() || (dsType === 2 && !tableSchema?.trim())) {
    connectionStatus.value = 'incomplete';
    connectionMessage.value = '请先填写数据库连接与认证必填字段后再进行连接测试';
    return Promise.resolve(false);
  }

  testing.value = true;
  connectionStatus.value = 'idle';
  connectionMessage.value = '';
  return agiDatasource
    .ping2(dsType, host, port, dsName, dsType === 2 ? tableSchema || null : null, username, password)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      if (!res.data) {
        form.value.status = 1;
        connectionStatus.value = 'failed';
        connectionMessage.value = '连接失败';
        return false;
      }
      form.value.status = 0;
      connectionStatus.value = 'success';
      connectionMessage.value = '连接成功';
      return true;
    })
    .catch((err) => {
      console.error('--> --> 测试数据源连接失败', err);
      form.value.status = 1;
      connectionStatus.value = 'failed';
      connectionMessage.value = '连接失败';
      return false;
    })
    .finally(() => {
      testing.value = false;
    });
};

const handleSave = () => {
  formRef.value
    ?.validate()
    .catch(() => Promise.reject(validationFailed))
    .then(() => {
      saving.value = true;
      return handleTest().then((passed) => {
        if (!passed) {
          ElMessage.closeAll();
          ElMessage.warning('数据源连接测试失败');
          return;
        }

        const data: DatasourceDTO = {
          id: form.value.id,
          name: form.value.name,
          tableSchema: form.value.tableSchema,
          categoryId: form.value.categoryId,
          description: form.value.description,
          username: form.value.username,
          password: form.value.password,
          dsType: form.value.dsType,
          dsName: form.value.dsName,
          port: form.value.port,
          host: form.value.host,
          status: 0
        };
        const request = data.id ? agiDatasource.update(data) : agiDatasource.insert(data);
        return request.then((res) => {
          if (res.code !== 200) {
            return Promise.reject(res.msg);
          }
          ElMessage.success(data.id ? '数据源修改成功' : '数据源绑定成功');
          router.push('/dataservices/datasources');
        });
      });
    })
    .catch((err: any) => {
      if (err === validationFailed) {
        ElMessage.closeAll();
        ElMessage.warning('校验未通过，请检查');
        return;
      }
      console.error('--> --> 保存数据源失败', err);
      ElMessage.closeAll();
      ElMessage.warning('保存数据源失败');
    })
    .finally(() => {
      saving.value = false;
    });
};

const handleCancel = () => {
  router.back();
};

onMounted(() => {
  apiCategoryTree();
});
</script>

<style lang="scss" scoped>
div.my-page.datasource-edit-my-page {
  height: auto;
  min-height: 100%;

  & > :deep(.my-page-content) {
    height: auto;
    overflow: visible;
  }

  :deep(.el-card__header) {
    padding: 20px 40px !important;
    border-width: 0 !important;
  }

  :deep(.el-card__body) {
    padding: 0 60px 32px !important;
  }
}

.page-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 20px;

  :deep(.el-button) {
    width: 36px;
    height: 36px;
    padding: 0;
  }

  :deep(.el-button .el-icon) {
    font-size: 24px;
  }

  h1 {
    margin: 0;
    color: #2b2f33;
    font-size: 20px;
    font-weight: bold;
    line-height: 28px;
  }

  p {
    margin: 8px 0 0;
    color: #77838f;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
  }
}

.header-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;

  :deep(.el-button:first-child) {
    min-width: 72px;
  }

  :deep(.el-button:last-child) {
    min-width: 160px;
  }
}

.datasource-edit-page {
  display: flex;
  width: 100%;
  min-width: 860px;
  max-width: 1420px;
  margin: 0 auto;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item__label) {
    color: #77838f;
    font-size: 14px;
    font-weight: 400;
  }

  :deep(.el-cascader),
  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: left;
  }

}

.form-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;
}

.panel-title {
  color: #2b2f33;
  font-size: 16px;
  font-weight: bold;
  line-height: 22px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.type-option {
  display: flex;
  box-sizing: border-box;
  min-width: 0;
  min-height: 76px;
  padding: 10px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: var(--el-color-white);
  color: #77838f;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: rgba(235, 243, 245, 0.6);
    color: var(--el-color-primary);
  }

  &__icon {
    font-size: 20px;
  }

  &__label {
    max-width: 100%;
    overflow: hidden;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.form-grid {
  display: grid;
  width: 100%;
  gap: 0 20px;

  &--connection {
    margin-top: 20px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &--credentials {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.connect-confirm {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 8px;

  :deep(.btn) {
    min-width: 160px;
    flex: none;
  }
}

.connect-tip {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: #b0bac6;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;

  .el-icon {
    flex: none;
    color: #77838f;
  }
}

.connection-status {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: rgba(235, 243, 245, 0.6);
  font-size: 13px;

  &.success {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  &.failed,
  &.incomplete {
    border-color: var(--el-color-danger-light-5);
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .form-grid {
    &--connection,
    &--credentials {
      grid-template-columns: 1fr;
    }
  }


  .connect-confirm {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
