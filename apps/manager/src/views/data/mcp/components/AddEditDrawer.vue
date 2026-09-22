<script setup lang="ts">
import modal from '@/plugins/modal';
import type { FormInstance, FormRules } from 'element-plus/es/components/form';
import { t } from '@/i18n';
import { ElMessage } from 'element-plus';
import { ChevronDown, ChevronRight, X, CircleCheck, CircleX } from 'lucide-vue-next';
import McpTestResultBody from './McpTestResultBody.vue';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { isEmpty } from '@/utils/common.js';
import type { McpServicesDTO, McpServicesVO, McpTestResultVO } from '@/types';
import { API } from '@/api';

interface FormEntity extends Partial<McpServicesDTO> {
  custom_headers: { key: string; value: string }[];
  authType: string;
  oauthScopesText: string;
  api_key_header: string;
  api_key: string;
  authConfigToken?: string;
  auth_server_metadata_url?: string;
  advancedConfig_timeout: number;
  advancedConfig_retry_count: number;
  advancedConfig_retry_delay: number;
}

/** 表单使用的认证配置，接口中以 JSON 字符串传输 */
interface McpAuthConfig {
  auth_type?: string;
  api_key?: string;
  api_key_header?: string;
  scopes?: string[];
  token?: string;
  auth_server_metadata_url?: string;
}

/** 表单使用的高级配置，接口中以 JSON 字符串传输 */
interface McpAdvancedConfig {
  timeout?: number;
  retry_count?: number;
  retry_delay?: number;
}

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const open = ref<boolean>(false)
let mode = '';
const title = ref<string>("page.mcp.addTitle")
const saveFormRef = ref<FormInstance>();
function createDefaultForm(): FormEntity {
  return {
    custom_headers: [],
    authType: '',
    oauthScopesText: '',
    api_key_header: '',
    api_key: '',
    advancedConfig_timeout: 0,
    advancedConfig_retry_count: 0,
    advancedConfig_retry_delay: 0
  };
}

const form = ref<FormEntity>(createDefaultForm());
const rules: FormRules<FormEntity> = {};

const submitDisabled = computed(() => isEmpty(form.value.name));

/** 重置操作表单 */
function reset() {
  form.value = createDefaultForm()
  saveFormRef.value?.resetFields()
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  form.value.transportType = 'http-streamable'
  title.value = "page.mcp.addTitle"
  open.value = true
  mode = 'add';
}

/** 修改按钮操作 */
function handleUpdate(id: string) {
  reset()
  title.value = "page.mcp.updateTitle"
  mode = 'update'
  return API.McpServices.single(id).then(res => {
    if (res?.code === 200) {
      form.value = serverDataToFormData(res.data || {})
      open.value = true
    }
  })
}

function serverDataToFormData(data: McpServicesVO): FormEntity {
  const formData: FormEntity = { ...createDefaultForm(), ...data };
  formData.custom_headers = []
  if (formData.headers) {
    try {
      formData.custom_headers = JSON.parse(formData.headers);
    } catch (error) {
      console.log('解析headers失败', formData.headers, error)
    }
  }
  if (formData.authConfig) {
    let authConfigSouce: any = formData.authConfig;
    let authConfig: McpAuthConfig = {};
    if (typeof authConfigSouce == 'string') {
      try {
        authConfig = JSON.parse(authConfigSouce);
      } catch (error) {
        console.log('解析authConfig失败', authConfigSouce, error)
      }
    } else {
      authConfig = authConfigSouce;
    }
    if (authConfig.auth_type) {
      formData.authType = authConfig.auth_type;
    }
    if (authConfig.api_key) {
      formData.api_key = authConfig.api_key;
    }
    if (authConfig.api_key_header) {
      formData.api_key_header = authConfig.api_key_header;
    }
    if (authConfig.scopes) {
      let scopes: any = authConfig.scopes;
      if (typeof scopes == 'string') {
        try {
          scopes = JSON.parse(scopes);
        } catch (error) {
          console.log('解析scopes失败', scopes, error)
          scopes = scopes.split(' ');
        }
      }
      formData.oauthScopesText = scopes.join(' ');
    } else {
      formData.oauthScopesText = '';
    }
    if (authConfig.token) {
      formData.authConfigToken = authConfig.token;
    }
    if (authConfig.auth_server_metadata_url) {
      formData.auth_server_metadata_url = authConfig.auth_server_metadata_url;
    }
  }
  formData.advancedConfig_timeout = 30;
  formData.advancedConfig_retry_count = 3;
  formData.advancedConfig_retry_delay = 1;
  if (formData.advancedConfig) {
    let advancedConfigSource: any = formData.advancedConfig;
    let advancedConfig: McpAdvancedConfig = {};
    if (typeof advancedConfigSource == 'string') {
      try {
        advancedConfig = JSON.parse(advancedConfigSource);
      } catch (error) {
        console.log('解析advancedConfig失败', advancedConfigSource, error)
      }
    } else {
      advancedConfig = advancedConfigSource;
    }
    if (advancedConfig.timeout) {
      formData.advancedConfig_timeout = +advancedConfig.timeout || 30;
    }
    if (advancedConfig.retry_count) {
      formData.advancedConfig_retry_count = +advancedConfig.retry_count || 3;
    }
    if (advancedConfig.retry_delay) {
      formData.advancedConfig_retry_delay = +advancedConfig.retry_delay || 0;
    }
  }
  return formData
}
function formDataToServerData(formData: FormEntity): McpServicesDTO {
  const {
    custom_headers, authType, oauthScopesText,
    api_key_header, api_key, authConfigToken,
    auth_server_metadata_url,
    advancedConfig_timeout, advancedConfig_retry_count, advancedConfig_retry_delay
  } = formData;
  // 只提交 DTO 字段，避免回传详情中的 deletedAt 和表单辅助字段。
  const serverData: McpServicesDTO = {
    id: formData.id ?? '',
    tenantId: formData.tenantId,
    name: formData.name,
    description: formData.description,
    enabled: formData.enabled,
    transportType: formData.transportType,
    url: formData.url,
    headers: JSON.stringify(custom_headers),
    stdioConfig: formData.stdioConfig,
    envVars: formData.envVars,
    createdAt: formData.createdAt,
    updatedAt: formData.updatedAt,
    isBuiltin: formData.isBuiltin
  };
  const authConfig: McpAuthConfig = {
    auth_type: authType,
    api_key,
    api_key_header,
    scopes: oauthScopesText.split(' ')
  }
  if (authConfigToken) {
    authConfig.token = authConfigToken;
  }
  if (auth_server_metadata_url) {
    authConfig.auth_server_metadata_url = auth_server_metadata_url;
  }
  serverData.authConfig = JSON.stringify(authConfig);
  const advancedConfig: McpAdvancedConfig = {
    timeout: advancedConfig_timeout,
    retry_count: advancedConfig_retry_count,
    retry_delay: advancedConfig_retry_delay,
  }
  serverData.advancedConfig = JSON.stringify(advancedConfig);
  return serverData
}

function doUpdate() {
  if (!form.value.id) return;
  const params = formDataToServerData(form.value);
  return API.McpServices.update(params).then((res) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.updateSuccess', '修改成功'))
      emit('success')
      open.value = false
    }
  })
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return API.McpServices.insert(params).then((res) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.addSuccess', '新增成功'))
      emit('success')
      open.value = false
    }
  })
}

/** 提交按钮 */
function submitForm() {
  saveFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (mode === 'update') {
        doUpdate()
      } else {
        doAdd()
      }
    }
  })
}
function closeDialog() {
  open.value = false
}

// 从 JSON 导入 MCP 服务配置
const codeImportOpen = ref(false)
const codeImportText = ref('')
const codeImportError = ref('')
const codeImportPlaceholder = `{
  "mcpServers": {
    "my-server": {
      "url": "https://example.com/sse"
    }
  }
}`

function applyServerConfig(name: string, cfg: Record<string, unknown>) {
  if (cfg.command) {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.stdioUnsupported')
    return false
  }
  const url = typeof cfg.url === 'string' ? cfg.url.trim() : ''
  if (!url) {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.missingUrl')
    return false
  }

  const rawType = String(cfg.type ?? cfg.transport ?? '').toLowerCase()
  let transport: 'sse' | 'http-streamable'
  if (rawType === 'sse') {
    transport = 'sse'
  } else if (['http', 'http-streamable', 'streamable-http', 'streamablehttp', 'streamable_http'].includes(rawType)) {
    transport = 'http-streamable'
  } else {
    transport = /\/sse\/?($|\?)/i.test(url) ? 'sse' : 'http-streamable'
  }

  let authType: '' | 'api_key' = ''
  let apiKey = ''
  let apiKeyHeader = ''
  const custom_headers: { key: string; value: string }[] = []
  const headers = (cfg.headers && typeof cfg.headers === 'object')
    ? (cfg.headers as Record<string, unknown>)
    : {}
  for (const [key, val] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    const strVal = typeof val === 'string' ? val : String(val ?? '')
    if (lowerKey === 'authorization' || ['x-api-key', 'api-key', 'apikey'].includes(lowerKey)) {
      authType = 'api_key'
      apiKey = strVal.trim()
      apiKeyHeader = lowerKey === 'x-api-key' ? '' : key
    } else {
      custom_headers.push({ key, value: strVal })
    }
  }

  const formData = form;
  formData.value.name = name || formData.value.name
  formData.value.url = url
  if (typeof cfg.description === 'string') formData.value.description = cfg.description

  const formValue: FormEntity = formData.value
  formValue.transportType = transport
  formValue.custom_headers = custom_headers
  formValue.authType = authType
  formValue.oauthScopesText = ''
  formValue.api_key_header = apiKeyHeader
  formValue.api_key = apiKey
  return true
}

const handleCodeImport = () => {
  codeImportError.value = ''
  const raw = codeImportText.value.trim()
  if (!raw) {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.empty')
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.invalidJson')
    return
  }
  if (!parsed || typeof parsed !== 'object') {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
    return
  }

  const obj = parsed as Record<string, unknown>
  let name = ''
  let cfg: Record<string, unknown> | null = null
  let multiple = false

  const servers = obj.mcpServers
  if (servers && typeof servers === 'object') {
    const entries = Object.entries(servers as Record<string, unknown>)
    if (entries.length === 0) {
      codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
      return
    }
    multiple = entries.length > 1
    name = entries[0][0]
    cfg = entries[0][1] as Record<string, unknown>
  } else if (obj.url || obj.command) {
    cfg = obj
  } else {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
    return
  }

  if (!cfg || typeof cfg !== 'object') {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
    return
  }

  if (!applyServerConfig(name, cfg)) return

  saveFormRef.value?.clearValidate()
  if (multiple) {
    modal.msg(
      t('page.mcp.mcpServiceDialog.codeImport.toasts.multipleServers', { name }) as string,
    )
  } else {
    modal.msgSuccess(t('page.mcp.mcpServiceDialog.codeImport.toasts.filled') as string)
  }
}

const addCustomHeader = () => {
  form.value.custom_headers.push({ key: '', value: '' })
}
const removeCustomHeader = (idx: number) => {
  form.value.custom_headers.splice(idx, 1)
}

const authTypeOptions = computed(() => [
  { value: '', disabled: false, label: t('page.mcp.mcpServiceDialog.authTypeNone', '无 / 自定义 Header') },
  { value: 'api_key', disabled: false, label: t('page.mcp.mcpServiceDialog.authTypeApiKey', 'API Key / Token') },
  { value: 'oauth', disabled: true, label: t('page.mcp.mcpServiceDialog.authTypeOAuth', 'OAuth 2.0（首次连接授权）') },
])

// 连接测试及结果展示
const testing = ref(false)
const lastTestOk = ref<boolean | null>(null)
const testResult = ref<McpTestResultVO | null>(null)
const testResultSection = ref<HTMLElement | null>(null)

function scrollToTestResult() {
  void nextTick(() => {
    testResultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

watch(
  () => [form.value.transportType, form.value.url],
  () => {
    lastTestOk.value = null
    testResult.value = null
  },
)

function handleTestConnection() {
  if (!form.value.id) return
  testing.value = true
  ElMessage.info({
    message: t('page.mcp.toasts.testing', { name: form.value.name || '' }),
    duration: 0,
    showClose: false,
  })
  return API.McpServices.test(form.value.id)
    .then((result) => {
      ElMessage.closeAll()
      const safe: McpTestResultVO = result?.data ?? {
        success: false,
        message: t('page.mcp.toasts.noResponse') as string,
      }
      lastTestOk.value = safe.success === true
      testResult.value = safe
      const discoveredDescription = typeof safe.description === 'string' ? safe.description.trim() : ''
      if (safe.success === true && discoveredDescription) {
        form.value.description = discoveredDescription
      }
      scrollToTestResult()
    })
    .catch((error) => {
      ElMessage.closeAll()
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        (t('page.mcp.toasts.testFailed') as string)
      console.error('Failed to test MCP service:', error)
      lastTestOk.value = false
      testResult.value = { success: false, message: errorMessage }
      scrollToTestResult()
    })
    .finally(() => {
      testing.value = false
    })
}

defineExpose({
  openAdd: handleAdd,
  openEdit: handleUpdate
});
</script>

<template>
  <KjscRtlDrawer :title="$t(title)" v-model="open" size="800px"
    custom-class="mcp-form-dialog" close-on-click-modal>
    <el-form :model="form" :rules="rules" ref="saveFormRef" label-position="top" class="user-form" >
      <section class="setting-drawer__section code-import">
        <el-button type="primary" link class="code-import__toggle" @click="codeImportOpen = !codeImportOpen">
          <el-icon class="code-import__icon">
            <ChevronDown v-if="codeImportOpen" />
            <ChevronRight v-else />
          </el-icon>
          <span>{{ t('page.mcp.mcpServiceDialog.codeImport.toggle') }}</span>
        </el-button>
        <div v-if="codeImportOpen" class="code-import__body">
          <p class="form-desc">{{ t('page.mcp.mcpServiceDialog.codeImport.hint') }}</p>
          <p v-if="mode === 'edit'" class="form-desc code-import__warn">
            {{ t('page.mcp.mcpServiceDialog.codeImport.editOverwriteHint') }}
          </p>
          <el-input type="textarea" v-model="codeImportText" :autosize="{ minRows: 5, maxRows: 14 }"
            :placeholder="codeImportPlaceholder" class="code-import__textarea" />
          <p v-if="codeImportError" class="code-import__error">{{ codeImportError }}</p>
          <div class="code-import__actions">
            <el-button type="primary" @click="handleCodeImport">
              {{ t('page.mcp.mcpServiceDialog.codeImport.parse') }}
            </el-button>
          </div>
        </div>
      </section>

      <section class="setting-drawer__section">
        <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.basicSection', '基本信息') }}</h4>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.name')" prop="name">
          <el-input v-model="form.name" :placeholder="t('page.mcp.mcpServiceDialog.namePlaceholder')" maxlength="999"
            :show-word-limit="false" />
        </el-form-item>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.description')" prop="description">
          <el-input v-model="form.description" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }"
            :placeholder="t('page.mcp.mcpServiceDialog.descriptionPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.enableService')" prop="enabled">
          <el-switch v-model="form.enabled" />
          <span class="form-desc form-desc--inline">
            {{ t('page.mcp.mcpServiceDialog.enableServiceDesc', '关闭后该服务不会被调用') }}
          </span>
        </el-form-item>
      </section>

      <section class="setting-drawer__section">
        <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.connectionSection', '连接配置') }}</h4>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.transportType')" prop="transportType">
          <el-radio-group v-model="form.transportType">
            <el-radio-button value="http-streamable">Streamable HTTP</el-radio-button>
            <el-radio-button value="sse">SSE</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.serviceUrl')" prop="url">
          <el-input v-model="form.url" :placeholder="t('page.mcp.mcpServiceDialog.serviceUrlPlaceholder')"
            maxlength="9999" :show-word-limit="false" />
        </el-form-item>
        <el-form-item prop="custom_headers">
          <template #label>
            <div>
              <div>
                <div>{{ t('page.mcp.mcpServiceDialog.customHeaders.label') }}</div>
                <div>
                  <el-button text size="small" @click="addCustomHeader">
                    <el-icon>
                      <Plus />
                    </el-icon>
                    {{ t('page.mcp.mcpServiceDialog.customHeaders.add') }}
                  </el-button>
                </div>
              </div>
              <p class="form-desc custom-headers-desc">{{ t('page.mcp.mcpServiceDialog.customHeaders.desc') }}</p>
            </div>
          </template>
          <div v-if="form.custom_headers.length > 0" class="custom-headers-list">
            <div v-for="(item, idx) in form.custom_headers" :key="idx" class="custom-header-row">
              <el-input v-model="item.key" :placeholder="t('page.mcp.mcpServiceDialog.customHeaders.keyPlaceholder')"
                class="custom-header-key" />
              <el-input v-model="item.value" :placeholder="t('page.mcp.mcpServiceDialog.customHeaders.valuePlaceholder')"
                class="custom-header-value" />
              <el-button text size="small" class="custom-header-remove" :aria-label="t('common.delete')"
                @click="removeCustomHeader(idx)">
                <el-icon>
                  <X />
                </el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
      </section>

      <section class="setting-drawer__section">
        <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.authConfig') }}</h4>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.authType')" prop="authType">
          <el-radio-group v-model="form.authType">
            <el-radio-button v-for="(item, idx) in authTypeOptions" :key="idx" :value="item.value"
              :disabled="item.disabled">{{ item.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.authType === 'api_key'">
          <el-form-item :label="t('page.mcp.mcpServiceDialog.apiKeyHeader', '请求头名称')" prop="api_key_header">
            <el-input v-model="form.api_key_header" placeholder="X-API-Key" />
            <p class="form-desc">{{ t('page.mcp.mcpServiceDialog.apiKeyHeaderDesc', '留空默认 X-API-Key。Bearer 方式请填 Authorization，并在下方密钥值中写 “Bearer<token>”；需要裸 token 时填 Authorization 并直接填入 token。') }}</p>
          </el-form-item>

          <el-form-item :label="t('page.mcp.mcpServiceDialog.credentialValue', '密钥值 / Token')" prop="api_key">
            <el-input v-model="form.api_key" type="password" show-password autocomplete="new-password"
              :placeholder="t('page.mcp.mcpServiceDialog.optional')" prefix-icon="Lock" />
          </el-form-item>
        </template>
      </section>

      <section class="setting-drawer__section">
        <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.advancedConfig') }}</h4>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.timeoutSec')" prop="advancedConfig_timeout">
          <el-input-number v-model="form.advancedConfig_timeout" :min="1" :max="300" placeholder="30">
            <template #suffix>
              <span class="number-input__unit">{{ t('page.mcp.mcpServiceDialog.unitSecond', '秒') }}</span>
            </template>
          </el-input-number>
        </el-form-item>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.retryCount')" prop="advancedConfig_retry_count">
          <el-input-number v-model="form.advancedConfig_retry_count" :min="1" :max="3" placeholder="3">
            <template #suffix>
              <span class="number-input__unit">{{ t('page.mcp.mcpServiceDialog.unitTimes', '次') }}</span>
            </template>
          </el-input-number>
        </el-form-item>
        <el-form-item :label="t('page.mcp.mcpServiceDialog.retryDelaySec')" prop="advancedConfig_retry_delay">
          <el-input-number v-model="form.advancedConfig_retry_delay" :min="0" :max="60" placeholder="1">
            <template #suffix>
              <span class="number-input__unit">{{ t('page.mcp.mcpServiceDialog.unitSecond', '秒') }}</span>
            </template>
          </el-input-number>
        </el-form-item>
      </section>

      <section v-if="testResult" ref="testResultSection" class="setting-drawer__section">
        <div class="test-result-header">
          <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.testResultTitle', '测试结果') }}</h4>
          <el-button text shape="square" size="small" class="test-result-close" @click="testResult = null">
            <template #icon><el-icon>
                <X />
              </el-icon></template>
          </el-button>
        </div>
        <McpTestResultBody :result="testResult" :service-id="form.id" />
      </section>
    </el-form>
    <template #footer>
      <div class="manage-dialog-footer">
        <el-button class="test-btn" :disabled="!form.id" @click="handleTestConnection">
          <template v-if="!testing && typeof lastTestOk === 'boolean'" #icon>
            <el-icon v-if="!testing && lastTestOk === true" class="status-icon available">
              <CircleCheck />
            </el-icon>
            <el-icon v-else-if="!testing && lastTestOk === false" class="status-icon unavailable">
              <CircleX />
            </el-icon>
          </template>{{ t('form.button.test', '测试连接') }}
        </el-button>
        <el-button class="close-btn" @click="closeDialog">
          {{ t('form.button.close', '取消') }}
        </el-button>
        <el-button type="primary" class="submit-btn" :disabled="submitDisabled" @click="submitForm">
          {{ t('form.button.submit', '保存') }}
        </el-button>
      </div>
    </template>
  </KjscRtlDrawer>
</template>

<style scoped lang="scss">
.el-input-number {
  width: 100%;
}

// ---- 从代码导入 ----
.code-import {
  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-color-primary);

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  &__body {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__warn {
    color: var(--el-color-warning);
  }

  &__textarea :deep(textarea) {
    font-family: monospace;
    font-size: 12px;
  }

  &__error {
    margin: 0;
    font-size: 12px;
    color: var(--el-color-danger);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}

// 自定义请求头
.custom-headers-desc {
  margin: 4px 0 8px;
}

.custom-headers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-header-key {
  flex: 0 0 38%;
}

.custom-header-value {
  flex: 1;
  min-width: 0;
}

.custom-header-remove {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);

  &:hover,
  &:focus-visible {
    color: var(--el-color-danger);
  }
}

.setting-drawer__section {
  .setting-drawer__section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.test-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .setting-drawer__section-title {
    margin-bottom: 0;
  }

  .test-result-close {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
  }
}

// 测试按钮的状态图标
.status-icon {
  font-size: 16px;
  flex-shrink: 0;

  &.available {
    color: var(--el-color-success);
  }

  &.unavailable {
    color: var(--el-color-danger);
  }
}
</style>
