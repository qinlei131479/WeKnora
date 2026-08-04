<template>
  <my-page class="model-edit-my-page">
    <div class="page-header">
      <div class="header-title">
        <el-button :icon="ArrowLeft" text circle @click="handleCancel" />
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDescription }}</p>
        </div>
      </div>

      <div class="header-actions">
        <btn @click="handleCancel">取消</btn>
        <btn type="primary" :icon="Save" @click="handleSave">{{ saveText }}</btn>
      </div>
    </div>

    <el-form ref="formRef" :model="model" :rules="rules" :validate-on-rule-change="false" label-position="top" class="model-edit-page">
      <BaseInfo v-model="model" :categories="categories" @model-type-change="handleModelTypeChange" />

      <Profile v-model="model" />

      <RestrictionLLM v-if="model.modelType === 1" v-model="model" />
    </el-form>
  </my-page>
</template>

<script setup lang="ts">
import { ArrowLeft, Save } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import type { FormInstance as ElFormInstance } from 'element-plus/es/components/form';
import type { FormRules as ElFormRules } from 'element-plus/es/components/form/src/types';
import { agiModel } from '@/api/resources/model';
import { agiCategory } from '@/api/settings/category';
import type { CategoryVO, ModelVO } from '@/types';
import BaseInfo from './components/BaseInfo.vue';
import Profile from './components/Profile.vue';
import RestrictionLLM from './components/RestrictionLLM.vue';

const router = useRouter();
const model = ref<ModelVO>({ ...((history.state?.model || {}) as ModelVO) });
const formRef = ref<ElFormInstance>();
const isEdit = computed(() => Boolean(model.value.id));
const pageTitle = computed(() => (isEdit.value ? '编辑模型资源' : '注册新模型资源'));
const pageDescription = computed(() =>
  isEdit.value ? '调整模型基础信息、服务接入配置与能力约束' : '接入第三方托管 API 服务或关联本地高性能模型实例接口'
);
const saveText = computed(() => (isEdit.value ? '保存模型变更' : '保存模型配置'));

const categories = ref<CategoryVO[]>([]);

const rules = computed<ElFormRules<ModelVO>>(() => {
  const formRules: ElFormRules<ModelVO> = {
    name: [{ required: true, message: '请填写模型显示名称', trigger: 'submit' }],
    categoryId: [{ required: true, message: '请选择归属领域分类', trigger: 'submit' }],
    supplier: [{ required: true, message: '请填写提供商 / 厂商标识', trigger: 'submit' }],
    modelType: [{ required: true, message: '请选择模型类型', trigger: 'submit' }],
    version: [{ required: true, message: '请填写版本号', trigger: 'submit' }],
    baseUrl: [{ required: true, message: '请填写 Base URL', trigger: 'submit' }],
    modelCode: [{ required: true, message: '请填写 Model ID', trigger: 'submit' }],
    apiKey: [{ required: true, message: '请填写 API Key / Token', trigger: 'submit' }],
    fastThinkFlag: [
      {
        validator: (rule: any, value: any, callback: any) => {
          if (value === 1) {
            callback();
          } else {
            if (model.value.slowThinkFlag != 1) {
              callback(new Error('可用于快思考和可用于深度思考至少选择一个'));
            } else {
              callback();
            }
          }
        },
        trigger: 'submit'
      }
    ],
    slowThinkFlag: [
      {
        validator: (rule: any, value: any, callback: any) => {
          if (value === 1) {
            callback();
          } else {
            if (model.value.fastThinkFlag != 1) {
              callback(new Error('可用于快思考和可用于深度思考至少选择一个'));
            } else {
              callback();
            }
          }
        },
        trigger: 'submit'
      }
    ]
  };

  if (model.value.modelType === 1) {
    formRules.param1 = [{ required: true, message: '请填写最大上下文窗口', trigger: 'submit' }];
    formRules.param2 = [{ required: true, message: '请填写全局单次最大输出限制', trigger: 'submit' }];
  }

  return formRules;
});

// API 获取分类树
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
      console.error('--> --> 获取模型分类失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取模型分类失败');
    });
};

const handleModelTypeChange = () => {
  model.value.param1 = undefined;
  model.value.param2 = undefined;
  model.value.deepThinkFlag = undefined;
  model.value.streamFlag = undefined;
  nextTick(() => formRef.value?.clearValidate(['param1', 'param2']));
};

const handleCancel = () => {
  router.back();
};

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('校验未通过，请检查');
    return;
  }

  const data: ModelVO = {
    ...model.value,
    name: model.value.name?.trim(),
    supplier: model.value.supplier?.trim(),
    version: model.value.version?.trim(),
    description: model.value.description?.trim(),
    baseUrl: model.value.baseUrl?.trim(),
    modelCode: model.value.modelCode?.trim(),
    apiKey: model.value.apiKey?.trim(),
    status: isEdit.value ? (model.value.status ?? 0) : 2
  };

  if (model.value.modelType !== 1) {
    delete data.param1;
    delete data.param2;
  }

  if (!isEdit.value) {
    delete data.id;
  }

  const saveRequest = isEdit.value ? agiModel.update : agiModel.insert;

  saveRequest(data)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success(isEdit.value ? '模型变更已保存' : '模型配置已保存');
      router.push('/resources/models');
    })
    .catch((err) => {
      console.error('--> --> 保存模型配置失败', err);
      // ElMessage.closeAll();
      // ElMessage.warning(`保存模型配置失败：${err}`);
    });
};

onMounted(() => {
  apiCategoryTree();
});
</script>

<style scoped lang="less">
:deep(.el-card__header) {
  padding: 20px 40px !important;
  border-width: 0 !important;
}

:deep(.el-card__body) {
  padding: 0 60px 32px 60px !important;
}

:deep(.el-card__header .panel-title) {
  color: #2b2f33;
  font-size: 16px;
  font-weight: bold;
}

div.my-page.model-edit-my-page {
  height: auto;
  min-height: 100%;

  & > :deep(.my-page-content) {
    height: auto;
    overflow: visible;
  }
}

.page {
  &-header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
  }
}

.header {
  &-title {
    display: flex;
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
    }

    p {
      margin-top: 8px;
      color: #77838f;
      font-size: 14px;
    }
  }

  &-actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;

    :deep(.el-button span) {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
}

.model-edit-page {
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

  :deep(.form-item--full-row) {
    grid-column: 1 / -1;
  }
  :deep(.form-item--col-2_3) {
    grid-column: 2 / 4;
  }

  :deep(.form-grid) {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0 20px;
  }

  .form {
    &-panel {
      box-sizing: border-box;
      width: 100%;
      margin: 0;
      border: 0;
      border-radius: 24px;

      :deep(.el-select),
      :deep(.el-cascader),
      :deep(.el-input-number) {
        width: 100%;
      }
    }
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

  .model-edit-page {
    :deep(.form-grid) {
      grid-template-columns: 1fr;
    }

    :deep(.form-item--col-2_3) {
      grid-column: 1 / -1;
    }
  }
}
</style>
