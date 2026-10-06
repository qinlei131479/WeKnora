<template>
  <SettingDrawer
    :visible="visible"
    :title="t('mcpServiceDialog.viewTitle')"
    class="mcp-drawer builtin-mcp-readonly"
    icon="tools"
    hide-footer
    width="680px"
    :min-width="560"
    :max-width="920"
    storage-key="setting-drawer:width:mcp-builtin-readonly"
    @update:visible="(v: boolean) => emit('update:visible', v)"
  >
    <!-- 头部图标：按 transport 区分，stdio 用 code，与列表卡片同款视觉 -->
    <template #headerIcon>
      <t-icon :name="transportIcon" />
    </template>

    <!-- 副标题：transport 名 + 启用状态，与编辑抽屉同款 -->
    <template #subtitle>
      <span>{{ transportLabel }}</span>
      <span
        class="subtitle-tag"
        :class="service?.enabled ? 'subtitle-tag--ok' : 'subtitle-tag--muted'"
      >
        {{ service?.enabled ? t('mcpSettings.enabled', '已启用') : t('mcpSettings.disabled', '已禁用') }}
      </span>
    </template>

    <!-- 只读字段全集：分节与编辑抽屉（连接配置 + 工具与用途）保持一致 -->
    <div class="mcp-readonly-fields">
      <!-- Section 1 — 基本信息（对齐编辑抽屉 Section 1） -->
      <section class="setting-drawer__section mcp-settings-group">
        <h4 class="setting-drawer__section-title">{{ t('mcpServiceDialog.basicSection') }}</h4>

        <div class="form-item">
          <label class="form-label required">{{ t('mcpServiceDialog.name') }}</label>
          <div class="readonly-value">{{ service?.name || '—' }}</div>
        </div>

        <div class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.enableService') }}</label>
          <div class="vision-toggle">
            <t-switch :value="service?.enabled ?? true" disabled />
            <span class="form-desc form-desc--inline">
              {{ t('mcpServiceDialog.enableServiceDesc') }}
            </span>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.description') }}</label>
          <div class="readonly-value readonly-value--muted">
            {{ service?.description || '—' }}
          </div>
        </div>
      </section>

      <!-- Section 2 — 连接配置（对齐编辑抽屉 Section 2） -->
      <section class="setting-drawer__section mcp-settings-group">
        <h4 class="setting-drawer__section-title">{{ t('mcpServiceDialog.connectionSection') }}</h4>

        <div class="form-item">
          <label class="form-label required">{{ t('mcpServiceDialog.transportType') }}</label>
          <!-- 同款 pill segmented；只读锁定，当前传输项高亮 -->
          <div class="source-options" role="radiogroup" aria-readonly="true">
            <button
              type="button"
              class="source-option"
              :class="{ 'is-active': service?.transport_type !== 'stdio' && service?.transport_type !== 'http-streamable' }"
              disabled
            >
              <t-icon name="cast" class="source-option__icon" />
              <span class="source-option__label">SSE</span>
            </button>
            <button
              type="button"
              class="source-option"
              :class="{ 'is-active': service?.transport_type === 'http-streamable' }"
              disabled
            >
              <t-icon name="link" class="source-option__icon" />
              <span class="source-option__label">HTTP Streamable</span>
            </button>
            <button
              v-if="service?.transport_type === 'stdio'"
              type="button"
              class="source-option is-active"
              disabled
            >
              <t-icon name="code" class="source-option__icon" />
              <span class="source-option__label">Stdio</span>
            </button>
          </div>
        </div>

        <div v-if="service?.transport_type === 'stdio'" class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.stdioLaunch') }}</label>
          <div class="stdio-launch">{{ stdioLaunchText }}</div>
        </div>

        <div v-else class="form-item">
          <label class="form-label required">{{ t('mcpServiceDialog.serviceUrl') }}</label>
          <div class="readonly-value readonly-value--mono">{{ service?.url || '—' }}</div>
        </div>
      </section>

      <!-- Section 3 — 认证配置（对齐编辑抽屉 Section 3，只读标签） -->
      <section class="setting-drawer__section mcp-settings-group">
        <h4 class="setting-drawer__section-title">{{ t('mcpServiceDialog.authConfig') }}</h4>

        <div class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.authType') }}</label>
          <div class="readonly-value">
            <t-tag variant="light" :theme="authTagTheme">{{ authTypeLabel }}</t-tag>
            <t-tag
              v-if="authTypeLabel && service?.auth_config?.api_key_header"
              variant="outline"
            >
              {{ service.auth_config.api_key_header }}
            </t-tag>
          </div>
        </div>
      </section>

      <!-- Section 4 — 高级配置（对齐编辑抽屉 Section 4） -->
      <section class="setting-drawer__section mcp-settings-group">
        <h4 class="setting-drawer__section-title">{{ t('mcpServiceDialog.advancedConfig') }}</h4>

        <div class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.timeoutSec') }}</label>
          <div class="readonly-value">{{ advancedTimeout ?? 30 }}</div>
        </div>
        <div class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.retryCount') }}</label>
          <div class="readonly-value">{{ advancedRetryCount ?? 3 }}</div>
        </div>
        <div class="form-item">
          <label class="form-label">{{ t('mcpServiceDialog.retryDelaySec') }}</label>
          <div class="readonly-value">{{ advancedRetryDelay ?? 1 }}</div>
        </div>
      </section>

      <!-- Section 5 — 服务用途（对齐编辑抽屉 step 1 的 usage_instructions） -->
      <section class="setting-drawer__section mcp-settings-group">
        <h4 class="setting-drawer__section-title">{{ t('mcpMetadata.usage') }}</h4>
        <div class="form-item">
          <p class="readonly-value readonly-value--muted usage-text">
            {{ usageInstructions || t('mcpMetadata.notSynced') }}
          </p>
        </div>
      </section>

      <!-- Section 6 — Tools 清单（工具调用情况，复用上游面板并锁定策略开关） -->
      <McpMetadataPanel
        v-if="service?.id"
        :key="service.id"
        :service-id="service.id"
        :persist="persist"
        readonly
        @busy="emit('busy', $event)"
      />
    </div>

    <template #footer-left>
      <t-button variant="outline" @click="emit('update:visible', false)">
        {{ t('common.close') }}
      </t-button>
    </template>
  </SettingDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingDrawer from '@/components/settings/SettingDrawer.vue'
import McpMetadataPanel from './McpMetadataPanel.vue'
import type { MCPService } from '@/api/mcp-service'

interface Props {
  visible: boolean
  service: MCPService | null
  /** 与编辑链路一致：harness（工作台 MCP 页）或 app-core（设置/工具箱） */
  persist?: 'app-core' | 'harness'
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'busy', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), { persist: 'app-core' })
const emit = defineEmits<Emits>()
const { t } = useI18n()

const transportIcon = computed(() => {
  if (props.service?.transport_type === 'http-streamable') return 'link'
  if (props.service?.transport_type === 'stdio') return 'code'
  return 'cast'
})

const transportLabel = computed(() => {
  if (props.service?.transport_type === 'http-streamable') return 'HTTP Streamable'
  if (props.service?.transport_type === 'stdio') return 'Stdio'
  return 'SSE'
})

const stdioLaunchText = computed(() => {
  const command = props.service?.stdio_config?.command || ''
  const args = (props.service?.stdio_config?.args || []).filter(Boolean)
  return [command, ...args].filter(Boolean).join(' ')
})

const authTypeLabel = computed(() => {
  const type = props.service?.auth_config?.auth_type
  if (type === 'api_key' || type === 'bearer') return t('mcpServiceDialog.authTypeApiKey')
  if (type === 'oauth') return t('mcpServiceDialog.authTypeOAuth')
  return t('mcpServiceDialog.authTypeNone')
})

const authTagTheme = computed(() => {
  const type = props.service?.auth_config?.auth_type
  if (type === 'oauth') return 'primary'
  if (type === 'api_key' || type === 'bearer') return 'warning'
  return 'default'
})

const advancedTimeout = computed(() => props.service?.advanced_config?.timeout)
const advancedRetryCount = computed(() => props.service?.advanced_config?.retry_count)
const advancedRetryDelay = computed(() => props.service?.advanced_config?.retry_delay)

const usageInstructions = computed(() =>
  (props.service?.usage_instructions || '').trim(),
)
</script>

<style scoped lang="less">
.mcp-readonly-fields {
  display: flex;
  flex-direction: column;
}

// ---- 与编辑抽屉同款 form 布局 ----
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  display: block;
  font-size: var(--app-text-md);
  font-weight: 500;
  color: var(--td-text-color-primary);
  line-height: 1.4;

  &.required::before {
    content: '*';
    color: var(--td-error-color);
    margin-right: 4px;
    font-weight: 500;
    line-height: 1;
  }
}

.readonly-value {
  font-size: var(--app-text-md);
  color: var(--td-text-color-primary);
  line-height: 1.5;
  word-break: break-word;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  &--muted {
    color: var(--td-text-color-secondary);
  }

  &--mono {
    font-family: var(--td-font-family-mono);
    font-size: var(--app-text-sm);
  }
}

.usage-text {
  margin: 0;
  white-space: pre-wrap;
}

.stdio-launch {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer, #f3f3f3);
  color: var(--td-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 20px;
  word-break: break-all;
}

.vision-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-desc {
  margin: 0;
  font-size: var(--app-text-sm);
  line-height: 1.5;
  color: var(--td-text-color-placeholder);

  &--inline {
    margin: 0;
  }
}

// ---- 与编辑抽屉同款 pill segmented（只读态） ----
.source-options {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  background: var(--td-bg-color-component);
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--app-radius-md);
}

.source-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--app-radius-sm);
  cursor: not-allowed;
  font-family: inherit;
  font-size: var(--app-text-md);
  color: var(--td-text-color-secondary);
  line-height: 1;

  &.is-active {
    background: var(--td-bg-color-container);
    border-color: var(--td-brand-color);
    color: var(--td-brand-color);
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }
}

.source-option__icon {
  font-size: var(--app-text-base);
  flex-shrink: 0;
}

.source-option__label {
  white-space: nowrap;
}

.subtitle-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  margin-left: 6px;
  height: 16px;
  font-size: var(--app-text-2xs);
  font-weight: 500;
  border-radius: 3px;

  &--ok {
    color: var(--td-success-color);
    background: var(--td-success-color-light);
  }

  &--muted {
    color: var(--td-text-color-placeholder);
    background: var(--td-bg-color-component);
  }
}
</style>

<style lang="less">
.mcp-drawer .setting-drawer__body .setting-drawer__section.mcp-settings-group {
  padding: 12px 0 16px;
  border: 0;
  border-bottom: 1px solid var(--td-component-stroke);
  gap: 12px;
  min-width: 0;
  box-sizing: border-box;

  .setting-drawer__section-title { margin: 0; }
  &:last-child { border-bottom: 0; padding-bottom: 0; }
}
</style>
