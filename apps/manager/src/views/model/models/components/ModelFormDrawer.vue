<script setup lang="ts">
import { t } from '@/i18n';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { API } from '@/api';
import { toProviderModelType } from '@/api/model/models';
import type { ModelCredentialField, ModelProviderVO, ModelTestRequestDTO, ModelTestResultVO, ModelsDTO, ModelsVO } from '@/types/api/model/model';
import { MODEL_TYPE_OPTIONS, MODEL_SOURCE_OPTIONS } from '../constants';
import { Remove } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as any;

const props = defineProps<{
  visible: boolean;
  mode: 'add' | 'edit';
  editId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const drawerTitle = computed(() =>
  props.mode === 'edit' ? t('page.models.form.title.edit', '编辑模型') : t('page.models.form.title.add', '新增模型')
);

/** 键值对编辑器的行结构，提交前会转成 Record<string, string> */
interface KeyValueRow {
  key: string;
  value: string;
}

const saveFormRef = ref();
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const credentialBusy = ref(false);

/** GET /providers 返回的厂商列表，按当前模型类型过滤 */
const providers = ref<ModelProviderVO[]>([]);

const testResult = ref<ModelTestResultVO | null>(null);

/** 后端不返回明文密钥，只返回 configured 标记 */
const apiKeyConfigured = ref(false);
const appSecretConfigured = ref(false);

/** 内置模型：可改配置与凭证，也可删除 */
const isBuiltin = ref(false);

const form = reactive({
  id: undefined as string | undefined,
  name: '',
  displayName: '',
  type: 'KnowledgeQA',
  source: 'remote',
  description: '',
  provider: '',
  baseUrl: '',
  interfaceType: '',
  parameterSize: '',
  supportsVision: false,
  maxConcurrency: undefined as number | undefined,
  appId: '',
  apiKey: '',
  appSecret: '',
  dimension: undefined as number | undefined,
  truncatePromptTokens: undefined as number | undefined,
  supportsDimensionOverride: false,
  customHeaders: [] as KeyValueRow[],
  extraConfig: [] as KeyValueRow[]
});

const rules = computed(() => ({
  name: [{ required: true, message: t('page.models.form.namePlaceholder', '请输入模型名称'), trigger: 'blur' }],
  type: [{ required: true, message: t('page.models.form.typePlaceholder', '请选择模型类型'), trigger: 'change' }],
  source: [{ required: true, message: t('page.models.form.sourcePlaceholder', '请选择模型来源'), trigger: 'change' }],
  baseUrl: [
    {
      required: form.source !== 'local',
      message: t('page.models.form.baseUrlPlaceholder', '请输入 Base URL'),
      trigger: 'blur'
    }
  ]
}));

/** 键值对编辑器 -> 提交用的 map，空行丢弃 */
const rowsToRecord = (rows: KeyValueRow[]) => {
  const record: Record<string, string> = {};
  rows.forEach((row) => {
    const key = row.key?.trim();
    if (!key) return;
    record[key] = row.value?.trim() ?? '';
  });
  return record;
};

const recordToRows = (record?: Record<string, string>): KeyValueRow[] =>
  Object.entries(record ?? {}).map(([key, value]) => ({ key, value: value ?? '' }));

const resetForm = () => {
  form.id = undefined;
  form.name = '';
  form.displayName = '';
  form.type = 'KnowledgeQA';
  form.source = 'remote';
  form.description = '';
  form.provider = '';
  form.baseUrl = '';
  form.interfaceType = '';
  form.parameterSize = '';
  form.supportsVision = false;
  form.maxConcurrency = undefined;
  form.appId = '';
  form.apiKey = '';
  form.appSecret = '';
  form.dimension = undefined;
  form.truncatePromptTokens = undefined;
  form.supportsDimensionOverride = false;
  form.customHeaders = [];
  form.extraConfig = [];
  apiKeyConfigured.value = false;
  appSecretConfigured.value = false;
  isBuiltin.value = false;
  testResult.value = null;
  saveFormRef.value?.clearValidate?.();
};

/**
 * 厂商列表按模型类型过滤，落库的 type 要先映射成厂商表的短名。
 */
const loadProviders = () => {
  const modelType = toProviderModelType(form.type);
  return API.Models.providers(modelType)
    .then((res) => {
      providers.value = res.data ?? [];
    })
    .catch((error) => {
      console.error('[Models] load providers failed:', error);
      providers.value = [];
    });
};

/** 厂商的 defaultUrls 也是按短名索引 */
const providerDefaultUrl = (provider?: ModelProviderVO) => {
  const modelType = toProviderModelType(form.type);
  if (!provider?.defaultUrls || !modelType) return '';
  return provider.defaultUrls[modelType] ?? '';
};

/** 切换厂商时用它的默认地址覆盖 Base URL，省得手输 */
const onProviderChange = () => {
  const defaultUrl = providerDefaultUrl(providers.value.find((item) => item.value === form.provider));
  if (defaultUrl) form.baseUrl = defaultUrl;
  testResult.value = null;
  nextTick(() => saveFormRef.value?.clearValidate?.('baseUrl'));
};

/** 切换类型要重新拉厂商列表，原来选的厂商可能不支持新类型 */
const onTypeChange = () => {
  testResult.value = null;
  if (form.type === 'Rerank' && form.source === 'local') {
    form.source = 'remote';
  }

  return loadProviders().then(() => {
    if (form.provider && !providers.value.some((item) => item.value === form.provider)) {
      form.provider = '';
      form.baseUrl = '';
    }
  });
};

const fillFormFromRow = (row: ModelsVO) => {
  form.id = row.id;
  form.name = row.name ?? '';
  form.displayName = row.displayName ?? '';
  form.type = row.type ?? 'KnowledgeQA';
  form.source = row.source ?? 'remote';
  form.description = row.description ?? '';
  isBuiltin.value = row.isBuiltin === true;

  const params = row.parameters ?? {};
  form.provider = params.provider ?? '';
  form.baseUrl = params.baseUrl ?? '';
  form.interfaceType = params.interfaceType ?? '';
  form.parameterSize = params.parameterSize ?? '';
  form.supportsVision = params.supportsVision === true;
  form.maxConcurrency = params.maxConcurrency ?? undefined;
  form.appId = params.appId ?? '';
  form.customHeaders = recordToRows(params.customHeaders);
  form.extraConfig = recordToRows(params.extraConfig);

  const embedding = params.embeddingParameters ?? {};
  form.dimension = embedding.dimension ?? undefined;
  form.truncatePromptTokens = embedding.truncatePromptTokens ?? undefined;
  form.supportsDimensionOverride = embedding.supportsDimensionOverride === true;

  apiKeyConfigured.value = !!row.credentials?.api_key?.configured;
  appSecretConfigured.value = !!row.credentials?.app_secret?.configured;
};

/**
 * 表单字段 -> 提交用的 parameters。
 * includeSecrets 只在「新增」和「测试未保存凭证」时为 true：
 * 新增接口会加密落库 apiKey / appSecret，更新接口则会忽略它们。
 */
const buildParameters = (includeSecrets: boolean) => {
  const parameters: ModelsDTO['parameters'] = {
    baseUrl: form.baseUrl || undefined,
    interfaceType: form.interfaceType || undefined,
    parameterSize: form.parameterSize || undefined,
    provider: form.provider || undefined,
    supportsVision: form.type === 'KnowledgeQA' || form.type === 'VLLM' ? form.supportsVision : undefined,
    maxConcurrency: form.maxConcurrency ?? undefined,
    appId: form.appId || undefined,
    customHeaders: rowsToRecord(form.customHeaders),
    extraConfig: rowsToRecord(form.extraConfig)
  };

  if (form.type === 'Embedding') {
    parameters.embeddingParameters = {
      dimension: form.dimension ?? undefined,
      truncatePromptTokens: form.truncatePromptTokens ?? undefined,
      supportsDimensionOverride: form.supportsDimensionOverride
    };
  }

  if (includeSecrets) {
    if (form.apiKey) parameters.apiKey = form.apiKey;
    if (form.appSecret) parameters.appSecret = form.appSecret;
  }

  return parameters;
};

const loadDetail = (id: string) =>
  API.Models.single(id)
    .then((res) => {
      if (res.data) fillFormFromRow(res.data);
    })
    .catch((error) => {
      console.error('[Models] load detail failed:', error);
    });

const initDrawer = () => {
  resetForm();
  loading.value = true;

  const request =
    props.mode === 'edit' && props.editId
      ? loadDetail(props.editId).then(() => loadProviders())
      : loadProviders().then(() => {
          if (props.mode === 'edit') return;
          form.provider = providers.value[0]?.value ?? '';
          onProviderChange();
        });

  return request.finally(() => {
    loading.value = false;
    return nextTick(() => saveFormRef.value?.clearValidate?.());
  });
};

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) initDrawer();
  }
);

/**
 * 更新接口不处理凭证，编辑时填了新密钥必须再走一次凭证接口，否则会被静默丢弃。
 * 返回 false 表示密钥没存上，此时基本信息已保存，应保留抽屉让用户重试。
 */
const saveSecretsIfFilled = async () => {
  if (!form.id) return true;
  if (!form.apiKey && !form.appSecret) return true;

  try {
    await API.Models.updateCredentials({
      modelId: form.id,
      apiKey: form.apiKey || undefined,
      appSecret: form.appSecret || undefined
    });
    if (form.apiKey) {
      apiKeyConfigured.value = true;
      form.apiKey = '';
    }
    if (form.appSecret) {
      appSecretConfigured.value = true;
      form.appSecret = '';
    }
    return true;
  } catch (error) {
    console.error('[Models] save credential failed:', error);
    return false;
  }
};

const handleSave = async () => {
  try {
    await saveFormRef.value?.validate?.();
  } catch {
    return;
  }

  saving.value = true;

  const payload: ModelsDTO = {
    id: form.id,
    name: form.name,
    displayName: form.displayName || undefined,
    type: form.type,
    source: form.source,
    description: form.description || undefined,
    parameters: buildParameters(props.mode !== 'edit')
  };

  try {
    if (props.mode === 'edit') {
      await API.Models.update(payload);

      if (!(await saveSecretsIfFilled())) {
        // 基本信息已落库，先刷新列表，抽屉留着让用户重试密钥
        emit('success');
        return;
      }
    } else {
      await API.Models.insert(payload);
    }

    proxy?.$modal?.msgSuccess(
      props.mode === 'edit' ? t('page.normal.confirmInfo.updateSuccess', '修改成功') : t('page.normal.confirmInfo.addSuccess', '新增成功')
    );
    emit('success');
    drawerVisible.value = false;
  } catch (error) {
    console.error('[Models] save failed:', error);
  } finally {
    saving.value = false;
  }
};

const handleTest = () => {
  if (!form.id) return;

  testing.value = true;
  testResult.value = null;

  const payload: ModelTestRequestDTO = {
    modelId: form.id,
    modelName: form.name,
    baseUrl: form.baseUrl,
    provider: form.provider || undefined,
    interfaceType: form.interfaceType || undefined,
    source: form.source || undefined,
    customHeaders: rowsToRecord(form.customHeaders),
    extraConfig: rowsToRecord(form.extraConfig)
  };

  if (form.apiKey) payload.apiKey = form.apiKey;
  if (form.appSecret) payload.appSecret = form.appSecret;

  if (form.type === 'Embedding') {
    payload.dimension = form.dimension ?? undefined;
    payload.supportsDimensionOverride = form.supportsDimensionOverride;
  }

  API.Models.testByModelType(form.type, payload)
    .then((res) => {
      // 后端测试失败同样返回 code=200，成败要看 data.available
      testResult.value = res.data ?? {
        available: false,
        message: t('page.models.test.emptyResult', '未返回测试结果')
      };

      // Embedding 测试成功会回传真实维度，直接回填省得手工核对
      if (form.type === 'Embedding' && res.data?.available && res.data.dimension) {
        form.dimension = res.data.dimension;
      }
    })
    .catch((error) => {
      console.error('[Models] test failed:', error);
      testResult.value = {
        available: false,
        message: t('page.models.test.requestFail', '请求失败，请检查网络或后端服务')
      };
    })
    .finally(() => {
      testing.value = false;
    });
};

/** 编辑模式下单独更新凭证（更新接口不处理凭证） */
const handleUpdateSecret = (field: ModelCredentialField) => {
  const value = field === 'api_key' ? form.apiKey : form.appSecret;
  if (!form.id || !value) {
    proxy?.$modal?.msgWarning(t('page.models.tips.credentialRequired', '请先输入新的密钥'));
    return;
  }

  credentialBusy.value = true;
  API.Models.updateCredentials({
    modelId: form.id,
    apiKey: field === 'api_key' ? value : undefined,
    appSecret: field === 'app_secret' ? value : undefined
  })
    .then(() => {
      if (field === 'api_key') {
        apiKeyConfigured.value = true;
        form.apiKey = '';
      } else {
        appSecretConfigured.value = true;
        form.appSecret = '';
      }
      testResult.value = null;
      proxy?.$modal?.msgSuccess(t('page.models.form.credentialUpdated', '密钥更新成功'));
      emit('success');
    })
    .catch((error) => {
      console.error('[Models] update credential failed:', error);
    })
    .finally(() => {
      credentialBusy.value = false;
    });
};

const handleRemoveSecret = (field: ModelCredentialField) => {
  if (!form.id) return;

  proxy?.$modal
    ?.confirm(t('page.models.form.credentialRemoveConfirm', '清除后该模型将无法调用，确认清除密钥吗？'))
    .then(() => {
      credentialBusy.value = true;
      return API.Models.deleteCredentialField(form.id!, field);
    })
    .then(() => {
      if (field === 'api_key') {
        apiKeyConfigured.value = false;
      } else {
        appSecretConfigured.value = false;
      }
      testResult.value = null;
      proxy?.$modal?.msgSuccess(t('page.models.form.credentialRemoved', '密钥已清除'));
      emit('success');
    })
    .catch(() => {
      // 用户取消或请求失败，request 拦截器已提示，这里无需重复报错
    })
    .finally(() => {
      credentialBusy.value = false;
    });
};

const addKeyValueRow = (rows: KeyValueRow[]) => rows.push({ key: '', value: '' });
const removeKeyValueRow = (rows: KeyValueRow[], index: number) => rows.splice(index, 1);
</script>

<template>
  <KjscRtlDrawer v-model="drawerVisible" :title="drawerTitle" size="800px" append-to-body>
    <el-form ref="saveFormRef" v-loading="loading" :model="form" :rules="rules" label-position="top" :validate-on-rule-change="false">
      <el-form-item :label="$t('page.models.form.type', '模型类型')" prop="type">
        <el-radio-group v-model="form.type" :disabled="props.mode === 'edit'" @change="onTypeChange">
          <el-radio-button v-for="item in MODEL_TYPE_OPTIONS" :key="item.value" :value="item.value">
            {{ $t(item.labelKey, item.label) }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="$t('page.models.form.source', '模型来源')" prop="source">
        <el-radio-group v-model="form.source" :disabled="props.mode === 'edit'">
          <el-radio-button
            v-for="item in MODEL_SOURCE_OPTIONS"
            :key="item.value"
            :value="item.value"
            :disabled="props.mode === 'edit' || (form.type === 'Rerank' && item.value === 'local')"
          >
            {{ $t(item.labelKey, item.label) }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-alert
        v-if="form.type === 'Rerank'"
        type="primary"
        show-icon
        :closable="false"
        :title="$t('form.alert.ollama.rerank', 'Ollama 不支持 ReRank 模型，请使用远程接口配置')"
      />

      <el-divider />

      <h4 v-if="form.source !== 'local'" class="section-title">{{ $t('page.models.form.section.provider', '接入配置') }}</h4>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.provider', '服务商')" prop="provider">
        <el-select v-model="form.provider" class="full-width" @change="onProviderChange">
          <el-option
            v-for="item in providers"
            class="provider-option"
            :class="{ 'provider-option__selected': form.provider === item.value }"
            :key="item.value"
            :label="item.label"
            :value="item.value!"
          >
            <div class="provider-option-title" :class="{ 'provider-option-title__selected': form.provider === item.value }">{{ item.label }}</div>
            <div class="provider-option-description">{{ item.description }}</div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('page.models.form.name', '模型名称')" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="
            $t(
              'page.models.form.namePlaceholder',
              { example: MODEL_TYPE_OPTIONS.find((item: (typeof MODEL_TYPE_OPTIONS)[number]) => item.value === form.type)?.example?.name || '' },
              '请输入模型名称'
            )
          "
          maxlength="100"
        />
      </el-form-item>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.displayName', '显示名称（可选）')" prop="displayName">
        <el-input v-model="form.displayName" :placeholder="$t('page.models.form.displayNamePlaceholder', '例如：客户问答模型')" maxlength="100" />
      </el-form-item>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.baseUrl', 'Base URL')" prop="baseUrl">
        <el-input v-model="form.baseUrl" :placeholder="$t('page.models.form.baseUrlPlaceholder', '请输入 Base URL')" />
      </el-form-item>

      <!-- 新增模式：凭证随 parameters 一起提交 -->
      <el-form-item v-if="form.source !== 'local' && props.mode !== 'edit'" :label="$t('page.models.form.apiKey', 'API Key（可选）')" prop="apiKey">
        <el-input
          v-model="form.apiKey"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('page.models.form.apiKeyPlaceholder', '请输入 API Key')"
        />
      </el-form-item>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.customHeaders', '自定义请求头')">
        <div class="kv-editor">
          <div v-for="(row, index) in form.customHeaders" :key="`header-${index}`" class="kv-row">
            <el-input v-model="row.key" :placeholder="$t('page.models.form.headerNamePlaceholder', 'Header 名称')" />
            <el-input v-model="row.value" :placeholder="$t('page.models.form.headerValuePlaceholder', 'Header 值')" />
            <el-button link type="danger" icon="Remove" @click="removeKeyValueRow(form.customHeaders, index)" />
          </div>
          <el-button link type="primary" icon="Plus" @click="addKeyValueRow(form.customHeaders)">
            {{ $t('page.models.form.headerAdd', '添加请求头') }}
          </el-button>
        </div>
      </el-form-item>

      <h4 v-if="form.source !== 'local' && ['KnowledgeQA', 'Embedding', 'VLLM'].includes(form.type)" class="section-title">
        {{ $t('page.models.form.section.advanced', '高级选项') }}
      </h4>

      <el-form-item v-if="form.type === 'Embedding'" :label="$t('page.models.form.dimension', '向量维度')" prop="dimension">
        <el-input-number
          v-model="form.dimension"
          controls-position="right"
          align="left"
          disabled
          :placeholder="$t('page.models.form.dimensionPlaceholder', '例如：1536')"
        />
      </el-form-item>

      <el-form-item
        v-if="form.type === 'Embedding'"
        :label="$t('page.models.form.supportsDimensionOverride', '自定义输出维度')"
        prop="supportsDimensionOverride"
      >
        <el-switch v-model="form.supportsDimensionOverride" />
        <span class="form-desc form-desc--inline">
          {{ $t('page.models.form.supportsDimensionOverrideDesc', '仅在确认该模型支持 dimensions 参数时开启；默认只使用检测到的实际维度。') }}
        </span>
      </el-form-item>

      <el-form-item v-if="form.type === 'KnowledgeQA'" :label="$t('page.models.form.supportsVision', '支持视觉/多模态')" prop="supportsVision">
        <el-switch v-model="form.supportsVision" />
        <span class="form-desc form-desc--inline">
          {{ $t('page.models.form.supportsVisionDesc', '模型是否支持图片等多模态输入') }}
        </span>
      </el-form-item>

      <!-- TODO: 思考模式参数格式 -->

      <el-form-item
        v-if="['KnowledgeQA', 'Embedding', 'VLLM'].includes(form.type)"
        :label="$t('page.models.form.maxConcurrency', '后台并发上限')"
        prop="maxConcurrency"
      >
        <el-input-number
          v-model="form.maxConcurrency"
          :min="0"
          :max="4096"
          controls-position="right"
          align="left"
          :placeholder="$t('page.models.form.maxConcurrencyPlaceholder', '0 表示使用全局默认')"
        />
      </el-form-item>

      <!-- ################################################## -->
      <!-- ################################################## -->
      <!-- ################################################## -->
      <!-- <el-divider /><el-divider /><el-divider />
      <h4 class="section-title">{{ $t('page.models.form.section.basic', '基本信息') }}</h4>

      <el-alert
        v-if="isBuiltin"
        class="builtin-alert"
        type="info"
        show-icon
        :closable="false"
        :title="$t('page.models.form.builtinHint', '内置模型可修改配置与凭证')"
      />

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.description', '描述')" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('page.models.form.descriptionPlaceholder', '请输入描述（可选）')"
          maxlength="500"
        />
      </el-form-item>

      <h4 v-if="form.source !== 'local'" class="section-title">{{ $t('page.models.form.section.provider', '接入配置') }}</h4>

      <el-form-item v-else-if="form.source !== 'local'" :label="$t('page.models.form.apiKey', 'API Key')">
        <div class="credential-box">
          <div class="credential-status">
            <el-tag :type="apiKeyConfigured ? 'success' : 'info'">
              {{
                apiKeyConfigured ? $t('page.models.table.credentialConfigured', '已配置') : $t('page.models.table.credentialUnconfigured', '未配置')
              }}
            </el-tag>
            <span class="form-desc form-desc--inline">
              {{ $t('page.models.form.credentialHidden', '出于安全考虑不显示已保存的密钥') }}
            </span>
          </div>

          <el-input
            v-model="form.apiKey"
            class="credential-input"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="$t('page.models.form.apiKeyReplacePlaceholder', '输入新的 API Key，点击「更新密钥」或直接保存均可生效')"
          />

          <div class="credential-actions">
            <el-button size="small" type="primary" :loading="credentialBusy" @click="handleUpdateSecret('api_key')">
              {{ $t('page.models.form.credentialUpdate', '更新密钥') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="!apiKeyConfigured"
              :loading="credentialBusy"
              @click="handleRemoveSecret('api_key')"
            >
              {{ $t('page.models.form.credentialRemove', '清除密钥') }}
            </el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.appId', 'App ID')" prop="appId">
        <el-input v-model="form.appId" :placeholder="$t('page.models.form.appIdPlaceholder', '部分厂商（如 WeKnoraCloud）需要填写')" />
      </el-form-item>

      <el-form-item v-if="form.source !== 'local' && props.mode !== 'edit'" :label="$t('page.models.form.appSecret', 'App Secret')" prop="appSecret">
        <el-input
          v-model="form.appSecret"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('page.models.form.appSecretPlaceholder', '需要第二段密钥时填写（可选）')"
        />
      </el-form-item>

      <el-form-item v-else-if="form.source !== 'local'" :label="$t('page.models.form.appSecret', 'App Secret')">
        <div class="credential-box">
          <div class="credential-status">
            <el-tag :type="appSecretConfigured ? 'success' : 'info'">
              {{
                appSecretConfigured
                  ? $t('page.models.table.credentialConfigured', '已配置')
                  : $t('page.models.table.credentialUnconfigured', '未配置')
              }}
            </el-tag>
          </div>

          <el-input
            v-model="form.appSecret"
            class="credential-input"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="$t('page.models.form.appSecretReplacePlaceholder', '输入新的 App Secret')"
          />

          <div class="credential-actions">
            <el-button size="small" type="primary" :loading="credentialBusy" @click="handleUpdateSecret('app_secret')">
              {{ $t('page.models.form.credentialUpdate', '更新密钥') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="!appSecretConfigured"
              :loading="credentialBusy"
              @click="handleRemoveSecret('app_secret')"
            >
              {{ $t('page.models.form.credentialRemove', '清除密钥') }}
            </el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.interfaceType', '接口类型')" prop="interfaceType">
        <el-input v-model="form.interfaceType" :placeholder="$t('page.models.form.interfaceTypePlaceholder', '例如 openai（可选）')" />
      </el-form-item>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.parameterSize', '参数规模')" prop="parameterSize">
        <el-input v-model="form.parameterSize" :placeholder="$t('page.models.form.parameterSizePlaceholder', '例如 7B / 13B（可选）')" />
      </el-form-item>

      <template v-if="form.type === 'Embedding'">
        <h4 class="section-title">{{ $t('page.models.form.section.embedding', '嵌入参数') }}</h4>

        <el-form-item :label="$t('page.models.form.dimension', '向量维度')" prop="dimension">
          <el-input-number v-model="form.dimension" :min="0" :max="8192" controls-position="right" />
          <span class="form-desc">
            {{ $t('page.models.form.dimensionDesc', '测试连接成功后会自动回填厂商返回的真实维度') }}
          </span>
        </el-form-item>

        <el-form-item :label="$t('page.models.form.truncatePromptTokens', '截断提示词 token 数')" prop="truncatePromptTokens">
          <el-input-number v-model="form.truncatePromptTokens" :min="0" :max="32768" controls-position="right" />
        </el-form-item>
      </template>

      <el-form-item v-if="form.source !== 'local'" :label="$t('page.models.form.extraConfig', '额外配置')">
        <div class="kv-editor">
          <div v-for="(row, index) in form.extraConfig" :key="`extra-${index}`" class="kv-row">
            <el-input v-model="row.key" :placeholder="$t('page.models.form.kvKeyPlaceholder', '字段名')" />
            <el-input v-model="row.value" :placeholder="$t('page.models.form.kvValuePlaceholder', '字段值')" />
            <el-button link type="danger" @click="removeKeyValueRow(form.extraConfig, index)">
              {{ $t('page.normal.delete', '删除') }}
            </el-button>
          </div>
          <el-button link type="primary" @click="addKeyValueRow(form.extraConfig)">
            {{ $t('page.models.form.kvAdd', '添加一行') }}
          </el-button>
        </div>
      </el-form-item> -->

      <div v-if="testResult" class="test-result" :class="testResult.available ? 'is-success' : 'is-error'">
        <span class="test-result__title">
          {{ testResult.available ? $t('page.models.test.success', '测试成功') : $t('page.models.test.fail', '测试失败') }}
        </span>
        <span class="test-result__text">{{ testResult.message || '-' }}</span>
      </div>
    </el-form>

    <template #footer>
      <div class="manage-dialog-footer">
        <el-button
          :loading="testing"
          :disabled="!form.id"
          :title="!form.id ? $t('page.models.test.saveFirst', '请先保存后再测试连接') : ''"
          @click="handleTest"
        >
          {{ $t('page.models.test.button', '测试连接') }}
        </el-button>
        <el-button @click="drawerVisible = false">{{ $t('page.normal.cancel', '取消') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('page.normal.save', '保存') }}
        </el-button>
      </div>
    </template>
  </KjscRtlDrawer>
</template>

<style lang="scss" scoped>
:deep(.el-input-number) {
  width: 100%;
}

.section-title {
  margin: 0 0 12px;
  padding-left: 8px;
  font-size: 14px;
  font-weight: 600;
  border-left: 4px solid var(--el-color-primary);
}

.provider-option {
  height: auto;
  line-height: normal;
  padding: 8px 12px;

  &__selected {
    background-color: var(--el-color-primary-light-9);
  }
}

.provider-option-title {
  padding-bottom: 4px;
}

.provider-option-description {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.builtin-alert {
  margin-bottom: 12px;
}

.full-width {
  width: 100%;
}

.form-desc {
  display: block;
  width: 100%;
  color: #77838f;
  font-size: 12px;
  line-height: 20px;

  &--inline {
    display: inline;
    width: auto;
    margin-left: 8px;
  }
}

.credential-box {
  width: 100%;
}

.credential-status {
  display: flex;
  align-items: center;
}

.credential-input {
  margin-top: 8px;
}

.credential-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.kv-editor {
  width: 100%;
}

.kv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.test-result {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 20px;

  &__title {
    font-weight: 600;
    margin-right: 8px;
  }

  &__text {
    word-break: break-all;
  }

  &.is-success {
    background-color: #f0f9eb;
    color: #529b2e;
  }

  &.is-error {
    background-color: #fef0f0;
    color: #c45656;
  }
}
</style>
