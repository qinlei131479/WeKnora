<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import KJSCDialogV2 from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import { API } from '@/api';
import type {
  WebSearchParameters,
  WebSearchProviderConfigFieldVO,
  WebSearchProviderTypeVO,
  WebSearchProvidersDTO,
  WebSearchProvidersVO,
  WebSearchTestResult
} from '@/types/api/data/webSearchProviders';

const { proxy } = getCurrentInstance() as any;
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  mode: 'add' | 'edit';
  editId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

/** 弹窗开关：读 props、写 emit，配合父组件的 v-model:visible */
const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const isEdit = computed(() => props.mode === 'edit');

const dialogTitle = computed(() =>
  isEdit.value
    ? t('page.data.webSearch.form.title.edit', '编辑网络搜索配置')
    : t('page.data.webSearch.form.title.add', '新增网络搜索配置')
);

const saveFormRef = ref();
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const credentialBusy = ref(false);

/** GET /types 返回的提供商元数据，决定表单显示哪些字段 */
const providerTypes = ref<WebSearchProviderTypeVO[]>([]);

/** 测试连接结果，展示在表单底部 */
const testResult = ref<WebSearchTestResult | null>(null);

/** 凭证是否已配置。后端不返回明文密钥，只返回 configured 标记 */
const apiKeyConfigured = ref(false);

const form = reactive({
  id: undefined as string | undefined,
  name: '',
  provider: '',
  description: '',
  isDefault: false,
  apiKey: '',
  engineId: '',
  baseUrl: '',
  proxyUrl: '',
  extraConfig: {} as Record<string, string>
});

const selectedProviderType = computed(() =>
  providerTypes.value.find((item: WebSearchProviderTypeVO) => item.id === form.provider)
);

/** 必填或可选，只要该提供商支持密钥就展示输入项 */
const showApiKeyField = computed(() => {
  const type = selectedProviderType.value;
  return !!type && (!!type.requiresApiKey || !!type.supportsOptionalApiKey);
});

const apiKeyLabel = computed(() =>
  selectedProviderType.value?.requiresApiKey
    ? t('page.data.webSearch.form.apiKey', 'API Key')
    : t('page.data.webSearch.form.apiKeyOptional', 'API Key（可选）')
);

/**
 * 编辑模式可以直接用库里已存的凭证测试；
 * 新增模式必须先把必填项填完，否则请求发过去必然失败，白跑一趟。
 */
const canTest = computed(() => {
  const type = selectedProviderType.value;
  if (!type) return false;
  if (isEdit.value) return true;
  if (type.requiresApiKey && !form.apiKey) return false;
  if (type.requiresEngineId && !form.engineId) return false;
  if (type.requiresBaseUrl && !form.baseUrl) return false;

  const missingConfigField = type.configFields?.some(
    (field: WebSearchProviderConfigFieldVO) => field.required && field.key && !form.extraConfig[field.key]
  );
  return !missingConfigField;
});

/** API Key 只在「新增 + 该提供商强制要求」时参与必填校验 */
const rules = computed(() => ({
  name: [{ required: true, message: t('page.data.webSearch.form.namePlaceholder', '请输入配置名称'), trigger: 'blur' }],
  provider: [
    { required: true, message: t('page.data.webSearch.form.providerPlaceholder', '请选择提供商'), trigger: 'change' }
  ],
  apiKey: [
    {
      required: !isEdit.value && !!selectedProviderType.value?.requiresApiKey,
      message: t('page.data.webSearch.form.apiKeyPlaceholder', '请输入 API Key'),
      trigger: 'blur'
    }
  ],
  engineId: [
    {
      required: !!selectedProviderType.value?.requiresEngineId,
      message: t('page.data.webSearch.form.engineIdPlaceholder', '请输入 Engine ID'),
      trigger: 'blur'
    }
  ],
  baseUrl: [
    {
      required: !!selectedProviderType.value?.requiresBaseUrl,
      message: t('page.data.webSearch.form.baseUrlPlaceholder', '请输入 Base URL'),
      trigger: 'blur'
    }
  ]
}));

const resetForm = () => {
  form.id = undefined;
  form.name = '';
  form.provider = '';
  form.description = '';
  form.isDefault = false;
  form.apiKey = '';
  form.engineId = '';
  form.baseUrl = '';
  form.proxyUrl = '';
  form.extraConfig = {};
  apiKeyConfigured.value = false;
  testResult.value = null;
  saveFormRef.value?.clearValidate?.();
};

/** 把 configFields 声明的默认值补进 extraConfig，已有值优先保留 */
const applyProviderDefaults = () => {
  const fields = selectedProviderType.value?.configFields ?? [];
  const next: Record<string, string> = {};

  fields.forEach((field: WebSearchProviderConfigFieldVO) => {
    if (!field.key) return;
    next[field.key] = form.extraConfig[field.key] ?? field.defaultValue ?? '';
  });

  form.extraConfig = next;
};

/** 切换提供商时清掉上一个提供商的专属字段，避免把 Google 的 engineId 带到 Bing */
const onProviderChange = () => {
  form.apiKey = '';
  form.engineId = '';
  form.baseUrl = '';
  form.proxyUrl = '';
  form.extraConfig = {};
  testResult.value = null;
  applyProviderDefaults();
  nextTick(() => saveFormRef.value?.clearValidate?.());
};

/** 后端存的 parameters 是 JSON 字符串，读出来要 parse 回对象 */
const fillFormFromRow = (row: WebSearchProvidersVO) => {
  form.id = row.id;
  form.name = row.name ?? '';
  form.provider = row.provider ?? '';
  form.description = row.description ?? '';
  form.isDefault = row.isDefault ?? false;

  let params: WebSearchParameters = {};
  if (row.parameters) {
    try {
      params = JSON.parse(row.parameters);
    } catch (error) {
      console.error('[WebSearch] parameters parse failed:', error);
    }
  }

  form.engineId = params.engine_id ?? '';
  form.baseUrl = params.base_url ?? '';
  form.proxyUrl = params.proxy_url ?? '';
  form.extraConfig = params.extra_config ?? {};
  apiKeyConfigured.value = !!row.credentials?.api_key?.configured;

  applyProviderDefaults();
};

/**
 * 表单字段 -> 后端 parameters 字符串。
 * includeApiKey 只在「新增」和「测试未保存凭证」时为 true：
 * 新增接口会读取并加密 parameters.api_key，而更新接口会忽略它。
 */
const buildParameters = (includeApiKey: boolean) => {
  const payload: WebSearchParameters = {
    engine_id: form.engineId || undefined,
    base_url: form.baseUrl || undefined,
    proxy_url: form.proxyUrl || undefined,
    extra_config: form.extraConfig
  };

  if (includeApiKey && form.apiKey) {
    payload.api_key = form.apiKey;
  }

  return JSON.stringify(payload);
};

const loadProviderTypes = () => {
  return API.WebSearchProviders.types()
    .then((res) => {
      providerTypes.value = res.data ?? [];
    })
    .catch((error) => {
      console.error('[WebSearch] load provider types failed:', error);
      providerTypes.value = [];
    });
};

const loadDetail = (id: string) => {
  return API.WebSearchProviders.single(id)
    .then((res) => {
      if (res.data) fillFormFromRow(res.data);
    })
    .catch((error) => {
      console.error('[WebSearch] load detail failed:', error);
    });
};

const initDialog = async () => {
  resetForm();
  loading.value = true;

  try {
    await loadProviderTypes();

    if (isEdit.value && props.editId) {
      await loadDetail(props.editId);
      return;
    }

    // 新增时默认选中第一个提供商，省得用户多点一次
    if (!form.provider && providerTypes.value.length > 0) {
      form.provider = providerTypes.value[0].id ?? '';
      applyProviderDefaults();
    }
  } finally {
    loading.value = false;
    await nextTick();
    saveFormRef.value?.clearValidate?.();
  }
};

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) initDialog();
  }
);

const handleSave = async () => {
  try {
    await saveFormRef.value?.validate?.();
  } catch {
    return;
  }

  saving.value = true;

  const payload: WebSearchProvidersDTO = {
    id: form.id,
    name: form.name,
    provider: form.provider,
    description: form.description,
    isDefault: form.isDefault,
    // 新增时把 api_key 一并塞进 parameters（后端会加密落库）；
    // 更新时不传，后端会保留库里原有的 api_key
    parameters: buildParameters(!isEdit.value)
  };

  const request = isEdit.value ? API.WebSearchProviders.update(payload) : API.WebSearchProviders.insert(payload);

  request
    .then(() => {
      proxy?.$modal?.msgSuccess(
        isEdit.value
          ? t('page.normal.confirmInfo.updateSuccess', '修改成功')
          : t('page.normal.confirmInfo.addSuccess', '新增成功')
      );
      emit('success');
      dialogVisible.value = false;
    })
    .catch((error) => {
      console.error('[WebSearch] save failed:', error);
    })
    .finally(() => {
      saving.value = false;
    });
};

const handleTest = () => {
  testing.value = true;
  testResult.value = null;

  const request =
    isEdit.value && form.id
      ? API.WebSearchProviders.testById(form.id)
      : API.WebSearchProviders.testRaw({
          provider: form.provider,
          parameters: buildParameters(true)
        });

  request
    .then((res) => {
      // 后端测试失败同样返回 code=200，成败要看 data.success
      testResult.value = res.data ?? {
        success: false,
        error: t('page.data.webSearch.test.emptyResult', '未返回测试结果')
      };
    })
    .catch((error) => {
      console.error('[WebSearch] test failed:', error);
      testResult.value = {
        success: false,
        error: t('page.data.webSearch.test.requestFail', '请求失败，请检查网络或后端服务')
      };
    })
    .finally(() => {
      testing.value = false;
    });
};

/** 编辑模式下单独更新 api_key（更新接口不处理凭证） */
const handleUpdateApiKey = () => {
  if (!form.id || !form.apiKey) {
    proxy?.$modal?.msgWarning(t('page.data.webSearch.tips.credentialRequired', '请先输入新的 API Key'));
    return;
  }

  credentialBusy.value = true;
  API.WebSearchProviders.updateOrQueryCredentials({ id: form.id, apiKey: form.apiKey })
    .then(() => {
      apiKeyConfigured.value = true;
      form.apiKey = '';
      testResult.value = null;
      proxy?.$modal?.msgSuccess(t('page.data.webSearch.form.credentialUpdated', 'API Key 更新成功'));
      emit('success');
    })
    .catch((error) => {
      console.error('[WebSearch] update credential failed:', error);
    })
    .finally(() => {
      credentialBusy.value = false;
    });
};

const handleRemoveApiKey = () => {
  if (!form.id) return;

  proxy?.$modal
    ?.confirm(t('page.data.webSearch.form.credentialRemoveConfirm', '清除后该提供商将无法调用，确认清除 API Key 吗？'))
    .then(() => {
      credentialBusy.value = true;
      return API.WebSearchProviders.deleteCredentialField(form.id!, 'api_key');
    })
    .then(() => {
      apiKeyConfigured.value = false;
      testResult.value = null;
      proxy?.$modal?.msgSuccess(t('page.data.webSearch.form.credentialRemoved', 'API Key 已清除'));
      emit('success');
    })
    .catch(() => {
      // 用户取消或请求失败，request 拦截器已提示，这里无需重复报错
    })
    .finally(() => {
      credentialBusy.value = false;
    });
};
</script>

<template>
  <KJSCDialogV2
    v-model="dialogVisible"
    :title="dialogTitle"
    width="760px"
    append-to-body
    custom-class="web-search-form-dialog"
    :show-close-btn="false"
    :show-subit-btn="false"
  >
    <el-form
      ref="saveFormRef"
      v-loading="loading"
      :model="form"
      :rules="rules"
      label-position="top"
      class="web-search-form"
      :validate-on-rule-change="false"
    >
      <h4 class="section-title">{{ $t('page.data.webSearch.form.section.basic', '基本信息') }}</h4>

      <el-form-item :label="$t('page.data.webSearch.form.name', '名称')" prop="name">
        <el-input
          v-model="form.name"
          :placeholder="$t('page.data.webSearch.form.namePlaceholder', '请输入配置名称')"
          maxlength="100"
        />
      </el-form-item>

      <el-form-item :label="$t('page.data.webSearch.form.description', '描述')" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('page.data.webSearch.form.descriptionPlaceholder', '请输入描述（可选）')"
          maxlength="500"
        />
      </el-form-item>

      <el-form-item :label="$t('page.data.webSearch.form.isDefault', '设为默认')" prop="isDefault">
        <el-switch v-model="form.isDefault" />
        <span class="form-desc form-desc--inline">
          {{ $t('page.data.webSearch.form.isDefaultDesc', '未指定搜索引擎的智能体将使用默认项') }}
        </span>
      </el-form-item>

      <h4 class="section-title">{{ $t('page.data.webSearch.form.section.provider', '提供商配置') }}</h4>

      <el-form-item :label="$t('page.data.webSearch.form.provider', '提供商')" prop="provider">
        <el-select
          v-model="form.provider"
          class="full-width"
          :placeholder="$t('page.data.webSearch.form.providerPlaceholder', '请选择提供商')"
          :disabled="isEdit"
          @change="onProviderChange"
        >
          <el-option v-for="item in providerTypes" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
        <span v-if="isEdit" class="form-desc">
          {{ $t('page.data.webSearch.form.providerLocked', '提供商类型创建后不可修改') }}
        </span>
        <span v-else-if="selectedProviderType?.description" class="form-desc">
          {{ selectedProviderType.description }}
        </span>
      </el-form-item>

      <el-form-item
        v-if="selectedProviderType?.docsUrl"
        :label="$t('page.data.webSearch.form.docsUrl', '官方文档')"
      >
        <el-link :href="selectedProviderType.docsUrl" target="_blank" type="primary">
          {{ selectedProviderType.docsUrl }}
        </el-link>
      </el-form-item>

      <!-- 新增模式：api_key 随 parameters 一起提交 -->
      <el-form-item v-if="showApiKeyField && !isEdit" :label="apiKeyLabel" prop="apiKey">
        <el-input
          v-model="form.apiKey"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="$t('page.data.webSearch.form.apiKeyPlaceholder', '请输入 API Key')"
        />
      </el-form-item>

      <!-- 编辑模式：凭证走独立接口，只展示状态，不回显明文 -->
      <el-form-item v-else-if="showApiKeyField" :label="apiKeyLabel">
        <div class="credential-box">
          <div class="credential-status">
            <el-tag :type="apiKeyConfigured ? 'success' : 'info'">
              {{
                apiKeyConfigured
                  ? $t('page.data.webSearch.table.credentialConfigured', '已配置')
                  : $t('page.data.webSearch.table.credentialUnconfigured', '未配置')
              }}
            </el-tag>
            <span class="form-desc form-desc--inline">
              {{ $t('page.data.webSearch.form.credentialHidden', '出于安全考虑不显示已保存的密钥') }}
            </span>
          </div>

          <el-input
            v-model="form.apiKey"
            class="credential-input"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="$t('page.data.webSearch.form.apiKeyReplacePlaceholder', '输入新的 API Key 后点击「更新密钥」')"
          />

          <div class="credential-actions">
            <el-button size="small" type="primary" :loading="credentialBusy" @click="handleUpdateApiKey">
              {{ $t('page.data.webSearch.form.credentialUpdate', '更新密钥') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="!apiKeyConfigured"
              :loading="credentialBusy"
              @click="handleRemoveApiKey"
            >
              {{ $t('page.data.webSearch.form.credentialRemove', '清除密钥') }}
            </el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item
        v-if="selectedProviderType?.requiresEngineId"
        :label="$t('page.data.webSearch.form.engineId', 'Engine ID')"
        prop="engineId"
      >
        <el-input
          v-model="form.engineId"
          :placeholder="$t('page.data.webSearch.form.engineIdPlaceholder', '例如 Google CSE 的搜索引擎 ID')"
        />
      </el-form-item>

      <el-form-item
        v-if="selectedProviderType?.requiresBaseUrl"
        :label="$t('page.data.webSearch.form.baseUrl', 'Base URL')"
        prop="baseUrl"
      >
        <el-input
          v-model="form.baseUrl"
          :placeholder="$t('page.data.webSearch.form.baseUrlPlaceholder', '例如 https://searx.example.com')"
        />
      </el-form-item>

      <el-form-item
        v-if="selectedProviderType?.supportsProxy"
        :label="$t('page.data.webSearch.form.proxyUrl', '代理 URL')"
        prop="proxyUrl"
      >
        <el-input
          v-model="form.proxyUrl"
          :placeholder="$t('page.data.webSearch.form.proxyUrlPlaceholder', '需要走代理时填写（可选）')"
        />
      </el-form-item>

      <!-- configFields 由后端下发，字段数量和类型都不固定，只能循环渲染 -->
      <template v-if="selectedProviderType?.configFields?.length">
        <el-form-item v-for="field in selectedProviderType.configFields" :key="field.key" :label="field.label">
          <el-select
            v-if="field.type === 'select'"
            v-model="form.extraConfig[field.key!]"
            class="full-width"
            clearable
            :placeholder="$t('page.normal.selectPlaceholder', '请选择')"
          >
            <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value!" />
          </el-select>
          <el-input v-else v-model="form.extraConfig[field.key!]" :placeholder="field.description" />
          <span v-if="field.description" class="form-desc">{{ field.description }}</span>
        </el-form-item>
      </template>

      <div v-if="testResult" class="test-result" :class="testResult.success ? 'is-success' : 'is-error'">
        <span class="test-result__title">
          {{
            testResult.success
              ? $t('page.data.webSearch.test.success', '测试成功')
              : $t('page.data.webSearch.test.fail', '测试失败')
          }}
        </span>
        <span class="test-result__text">{{ testResult.message || testResult.error || '-' }}</span>
      </div>
    </el-form>

    <template #prefixFooter>
      <div class="dialog-footer">
        <el-button :loading="testing" :disabled="!canTest" @click="handleTest">
          {{ $t('page.data.webSearch.test.button', '测试连接') }}
        </el-button>
        <el-button @click="dialogVisible = false">{{ $t('page.normal.cancel', '取消') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('page.normal.save', '保存') }}
        </el-button>
      </div>
    </template>
  </KJSCDialogV2>
</template>

<style lang="scss" scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #2b2f33;
}

.section-title:not(:first-child) {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ececec;
}

.full-width {
  width: 100%;
}

.form-desc {
  display: block;
  width: 100%;
  color: #77838f;
  font-size: 12px;
  line-height: 18px;

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

.dialog-footer {
  display: inline-flex;
  gap: 16px;
}
</style>
