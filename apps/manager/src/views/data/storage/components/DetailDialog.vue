<template>
  <KJSCDialogV2
    v-model="dialogVisible"
    :title="$t('page.data.storage.detail.title', '存储引擎详情')"
    width="900px"
    append-to-body
    show-close-btn
    :close-btn-text="$t('page.normal.close', '关闭')"
    :show-subit-btn="false"
  >
    <section class="storage-detail-wrap">
      <div class="detail-section">
        <div class="detail-section__title">{{ $t('page.data.storage.detail.section.basic', '基本信息') }}</div>
        <div class="detail-section__body">
          <div class="detail-grid">
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.id', 'ID') }}</span>
              <span class="detail-item__value">{{ formatValue(form.id) }}</span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.name', '名称') }}</span>
              <span class="detail-item__value">{{ formatValue(form.name) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.provider', '提供商') }}</span>
              <span class="detail-item__value">{{ formatValue(form.provider) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.source', '来源') }}</span>
              <span class="detail-item__value">{{ formatValue(form.source) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.tenantId', '工作空间（租户）ID') }}</span>
              <span class="detail-item__value">{{ formatValue(form.tenantId) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.tenantName', '工作空间（租户）') }}</span>
              <span class="detail-item__value">{{ formatValue(form.tenantName) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.status', '状态') }}</span>
              <span class="detail-item__value">
                <el-tag v-if="form.status === 'active'" type="primary">
                  {{ $t('page.data.storage.table.status_active', '活动') }}
                </el-tag>
                <el-tag v-else-if="form.status === 'disabled'" type="danger">
                  {{ $t('page.data.storage.table.status_disabled', '禁用') }}
                </el-tag>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.isDefault', '是否默认') }}</span>
              <span class="detail-item__value">
                <el-tag v-if="form.isDefault === true" type="success">
                  {{ $t('page.data.storage.table.isDefault_true', '默认') }}
                </el-tag>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.createdAt', '创建时间') }}</span>
              <span class="detail-item__value">{{ formatValue(form.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.storage.detail.updatedAt', '更新时间') }}</span>
              <span class="detail-item__value">{{ formatValue(form.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">{{ $t('page.data.storage.detail.config', '配置') }}</div>
        <div class="detail-section__body">
          <div class="code-block">
            <el-button size="small" class="code-block__copy" @click="copyText(form.config)">
              {{ $t('page.normal.copy', '复制') }}
            </el-button>
            <pre class="code-block__pre">{{ formatJson(form.config) }}</pre>
          </div>
        </div>
      </div>
    </section>
  </KJSCDialogV2>
</template>

<script setup lang="ts">
import KJSCDialogV2 from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import type { StorageBackendsVO } from '@/types';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance();
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  row: StorageBackendsVO;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const form = computed(() => props.row);

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
};

const formatJson = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';

  try {
    const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsedValue, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const copyWithTextarea = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  if (typeof textarea.setSelectionRange === 'function') {
    textarea.setSelectionRange(0, textarea.value.length);
  }

  try {
    if (document.execCommand('copy')) {
      proxy.$modal.msgSuccess(t('page.normal.copySuccess', '复制成功'));
    } else {
      proxy.$modal.msgError(t('page.normal.copyFailed', '复制失败'));
    }
  } catch {
    proxy.$modal.msgError(t('page.normal.copyFailed', '复制失败'));
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyText = (value: unknown) => {
  const text = formatJson(value);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => proxy.$modal.msgSuccess(t('page.normal.copySuccess', '复制成功')))
      .catch(() => copyWithTextarea(text));
    return;
  }

  copyWithTextarea(text);
};
</script>

<style lang="scss" scoped>
.storage-detail-wrap {
  max-height: 65vh;
  overflow-y: auto;
  padding-bottom: 8px;

  .detail-section {
    border: var(--border);
    border-radius: var(--el-border-radius-base);
    overflow: hidden;

    &__title {
      padding: 0.75em;
      font-weight: bold;
      background-color: var(--el-menu-hover-bg-color);
      border-bottom: var(--border);
    }

    &__body {
      padding: 16px;
    }

    .detail {
      &-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 24px;
      }

      &-item {
        display: flex;
        gap: 12px;

        &--full {
          grid-column: 1 / -1;
        }

        &__label {
          flex-shrink: 0;
          width: 120px;
          color: var(--el-text-color-secondary);
        }

        &__value {
          flex: 1;
          min-width: 0;
          word-break: break-all;
          color: var(--el-text-color-primary);
        }
      }
    }

    .code-block {
      position: relative;
      max-height: 320px;
      overflow: auto;
      background: #fbfcfd;
      border: var(--border);
      border-radius: 8px;

      &__pre {
        margin: 0;
        padding: 0.75em 5em 0.75em 0.75em;
        white-space: pre-wrap;
        word-break: break-all;
      }

      &__copy {
        position: absolute;
        top: 5px;
        right: 5px;
        z-index: 1;
      }
    }
  }

  .detail-section:not(:last-child) {
    margin-bottom: 16px;
  }
}
</style>
