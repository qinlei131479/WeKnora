<template>
  <KJSCDialogV2
    v-model="dialogVisible"
    :title="$t('page.data.vectorStores.detail.title', '向量库引擎详情')"
    width="800px"
    append-to-body
    show-close-btn
    :close-btn-text="$t('page.normal.close', '关闭')"
    :show-subit-btn="false"
  >
    <section class="vector-store-detail-wrap">
      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><Info /></el-icon>
          {{ $t('page.data.vectorStores.detail.section.basic', '基本信息') }}
        </div>
        <div class="detail-section__body">
          <div class="detail-grid">
            <div class="detail-item detail-item--full">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.id', 'ID') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.id) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.name', '名称') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.name) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.engineType', '引擎类型') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.engineType) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.tenantId', '工作空间（租户）ID') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.tenantId) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.tenantName', '工作空间（租户）') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.tenantName) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.createdAt', '创建时间') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item__label">{{ $t('page.data.vectorStores.detail.updatedAt', '更新时间') }}</span>
              <span class="detail-item__value">{{ formatValue(detail.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><FileJson /></el-icon>
          {{ $t('page.data.vectorStores.detail.connectionConfig', '连接配置') }}
        </div>
        <div class="detail-section__body">
          <div class="code-block">
            <el-button size="small" class="code-block__copy" @click="copyText(detail.connectionConfig)">
              {{ $t('page.normal.copy', '复制') }}
            </el-button>
            <pre class="code-block__pre">{{ formatJson(detail.connectionConfig) }}</pre>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section__title">
          <el-icon color="var(--el-color-primary)"><FileJson /></el-icon>
          {{ $t('page.data.vectorStores.detail.indexConfig', '索引配置') }}
        </div>
        <div class="detail-section__body">
          <div class="code-block">
            <el-button size="small" class="code-block__copy" @click="copyText(detail.indexConfig)">
              {{ $t('page.normal.copy', '复制') }}
            </el-button>
            <pre class="code-block__pre">{{ formatJson(detail.indexConfig) }}</pre>
          </div>
        </div>
      </div>
    </section>
  </KJSCDialogV2>
</template>

<script setup lang="ts">
import type { VectorStoresVO } from '@/types';
import { FileJson, Info } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance();
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  row: VectorStoresVO;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const detail = computed(() => props.row || ({} as VectorStoresVO));

const formatValue = (value: unknown): string => {
  return value === undefined || value === null || value === '' ? '-' : String(value);
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
.vector-store-detail-wrap {
  max-height: 65vh;
  overflow-y: auto;
  padding-bottom: 8px;

  .detail-section {
    border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    overflow: hidden;

    &__title {
      display: flex;
      gap: 0.25em;
      align-items: center;
      padding: 0.75em;
      border-bottom: var(--el-border-width) var(--el-border-style) var(--el-border-color);
      background-color: var(--el-menu-hover-bg-color);
      font-weight: bold;
    }

    &__body {
      padding: 16px;
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 24px;
  }

  .detail-item {
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
      color: var(--el-text-color-primary);
      word-break: break-all;
    }
  }

  .code-block {
    position: relative;
    max-height: 240px;
    overflow: auto;
    border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-radius: 8px;
    background: #fbfcfd;

    &__pre {
      margin: 0;
      padding: 0.75em 5em 0.75em 0.75em;
    }

    &__copy {
      position: absolute;
      top: 5px;
      right: 5px;
      z-index: 1;
    }
  }

  .detail-section:not(:last-child) {
    margin-bottom: 16px;
  }
}
</style>
