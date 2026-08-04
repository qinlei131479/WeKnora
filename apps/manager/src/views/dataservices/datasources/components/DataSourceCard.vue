<template>
  <el-card shadow="hover" class="source-card">
    <div class="card-topline">
      <div class="tag-line">
        <el-tag effect="light" type="primary" round>{{ categoryLabel }}</el-tag>
        <el-tag type="info" effect="plain" round>{{ typeLabel }}</el-tag>
      </div>
      <el-tag :type="active ? 'primary2' : 'info'" effect="light" round>{{ active ? '● 活跃' : '● 空闲' }}</el-tag>
    </div>

    <div class="title-row">
      <div class="source-name" :title="source.name || ''" v-html="getHighlightedText(source.name || '--')"></div>
      <div class="title-actions">
        <el-button text circle :icon="PencilLine" title="编辑" aria-label="编辑" @click="emit('edit', source)" />
        <el-button text circle :icon="Trash2" title="删除" aria-label="删除" @click="emit('delete', source)" />
      </div>
    </div>

    <div class="source-meta">
      <div class="meta-row">
        <div class="meta-item meta-item--wide">
          <span>Host:</span>
          <strong :title="source.host || ''" v-html="getHighlightedText(source.host || '--')"></strong>
        </div>
        <div class="meta-item">
          <span>Port:</span>
          <strong>{{ source.port ?? '--' }}</strong>
        </div>
      </div>
      <div class="meta-row">
        <div class="meta-item meta-item--wide">
          <span>数据库_Tipic:</span>
          <strong :title="source.dsName || ''" v-html="getHighlightedText(source.dsName || '--')"></strong>
        </div>
        <div class="meta-item">
          <span>表格树:</span>
          <strong>{{ source.tableCount ?? 0 }}张</strong>
        </div>
      </div>
    </div>

    <div class="card-status">
      <div class="last-tested">最近检测: {{ lastTestedTime }}</div>
      <div class="card-footer">
        <el-button
          class="health-button"
          :class="`is-${connectivityClass}`"
          :type="connectivityButtonType"
          plain
          :loading="testing"
          @click="emit('test', source)"
        >
          ● 功能通路：{{ connectivityLabel }}
        </el-button>
        <el-button class="schema-button" text :loading="schemaLoading" @click="emit('schema', source)">
          表配置与描述({{ source.tableCount ?? 0 }})
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { PencilLine, Trash2 } from 'lucide-vue-next';
import type { DatasourceVO } from '@/types';
import { parseTime } from '@/utils/ruoyi';

const props = defineProps<{
  source: DatasourceVO;
  categoryLabel: string;
  testing: boolean;
  schemaLoading: boolean;
  keyword: string;
  active: boolean;
}>();

const emit = defineEmits<{
  edit: [source: DatasourceVO];
  test: [source: DatasourceVO];
  schema: [source: DatasourceVO];
  delete: [source: DatasourceVO];
}>();

const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => entityMap[char]);

const getHighlightedText = (value?: string | null) => {
  const text = value ?? '';
  const keyword = props.keyword.trim();
  if (!keyword) return escapeHtml(text);

  const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let html = '';
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    html += escapeHtml(text.slice(lastIndex, index));
    html += `<mark class="keyword-highlight">${escapeHtml(match[0])}</mark>`;
    lastIndex = index + match[0].length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
};

const typeLabel = computed(() => (props.source.dsType === 1 ? 'MySQL' : 'PostgreSQL'));
const isConnected = computed(() => props.source.status === 0);
const connectivityClass = computed(() => (isConnected.value ? 'normal' : 'error'));
const connectivityLabel = computed(() => (isConnected.value ? '正常' : '异常'));
const connectivityButtonType = computed(() => (isConnected.value ? 'success' : 'danger'));
const lastTestedTime = computed(() => {
  if (!props.source.healthyTime) return '--';
  const date = parseTime(props.source.healthyTime, '{y}-{m}-{d}');
  const now = new Date();
  const today = parseTime(now, '{y}-{m}-{d}');
  if (date === today) return parseTime(props.source.healthyTime, '{h}:{i}') || '--';
  const year = parseTime(props.source.healthyTime, '{y}');
  const currentYear = parseTime(now, '{y}');
  return parseTime(props.source.healthyTime, year === currentYear ? '{m}-{d} {h}:{i}' : '{y}-{m}-{d} {h}:{i}') || '--';
});
</script>

<style lang="scss" scoped>
.source-card {
  min-width: 0;
  overflow: hidden;
  border-width: 0;
  border-radius: 24px;
  background: var(--el-color-white);

  :deep(.el-card__body) {
    display: flex;
    box-sizing: border-box;
    min-width: 0;
    flex-direction: column;
    padding: 20px 24px 24px !important;
  }
}

.card-topline,
.title-row,
.meta-row,
.card-footer {
  display: flex;
  min-width: 0;
  align-items: center;
}

.card-topline,
.title-row,
.card-footer {
  justify-content: space-between;
}

.card-topline {
  gap: 12px;
}

.tag-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.title-row {
  gap: 12px;
  margin-top: 16px;
}

.source-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #2b2f33;
  font-size: 18px;
  font-weight: bold;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;

  :deep(.el-button) {
    width: 28px;
    height: 28px;
    margin-left: 0;
    padding: 0;
    color: #77838f;
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}

.source-meta {
  display: flex;
  min-width: 0;
  margin-top: 16px;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ebf3f5;
  border-radius: 16px;
  background: rgba(235, 243, 245, 0.6);
}

.meta-row {
  gap: 20px;
}

.meta-item {
  display: flex;
  min-width: 0;
  flex: none;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &--wide {
    flex: 1;
  }

  span {
    flex: none;
    color: #77838f;
    font-size: 12px;
    font-weight: 400;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: #2b2f33;
    font-size: 13px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-status {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e1e6ec;
}

.last-tested {
  color: #77838f;
  font-size: 12px;
}

.card-footer {
  gap: 12px;
  margin-top: 8px;

  :deep(.el-button) {
    margin-left: 0;
  }
}

.health-button {
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 400;

  &.is-normal {
    background-color: var(--el-color-success-light-9);
    border-color: var(--el-color-success);
    color: var(--el-color-success);
  }

  &.is-error {
    background-color: var(--el-color-danger-light-9);
    border-color: var(--el-color-danger);
    color: var(--el-color-danger);
  }
}

.schema-button {
  min-width: 0;
  padding: 0;
  color: #2b2f33;
  font-size: 13px;
  font-weight: bold;

  :deep(span) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:deep(.keyword-highlight) {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
  font-weight: inherit;
}
</style>
