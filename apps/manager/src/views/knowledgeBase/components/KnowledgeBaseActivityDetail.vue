<template>
  <div class="section-content kb-activity-settings">
    <div class="section-body kb-activity-body">
      <div v-if="error" class="kb-activity-branch kb-activity-branch--error">
        <el-alert theme="error" :message="error">
          <template #operation>
            <el-button size="small" @click="reload">{{ t('component.knowledgeEditor.activity.retry') }}</el-button>
          </template>
        </el-alert>
      </div>

      <div class="audit-scroll-area narrow-scrollbar kb-activity-branch">
        <div class="data-table-shell audit-table-shell">
          <el-table row-key="id" :data="entries" :loading="loading">
            <template #empty>
              <div class="kb-activity-empty">
                <el-empty :description="emptyDescription" />
              </div>
            </template>
            <el-table-column prop="createdAt" :label="t('component.knowledgeEditor.activity.columns.time')" width="116">
              <template #default="scope">
                <div class="audit-time">
                  <span class="audit-time-date">{{ formatDatePart(scope.row.createdAt) }}</span>
                  <span class="audit-time-clock">{{ formatTimePart(scope.row.createdAt) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="action" :label="$t('component.knowledgeEditor.activity.columns.action')" width="120">
              <template #default="scope">
                <el-tag :type="actionTheme(scope.row.action)" size="small">
                  {{ actionLabel2(scope.row.action) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target" :label="t('component.knowledgeEditor.activity.columns.target')" min-width="180">
              <template #default="scope">
                <div class="audit-target">
                  <span v-if="targetSubject(scope.row)" class="audit-target-key">{{ targetSubject(scope.row) }}</span>
                  <span v-if="targetDiff(scope.row)" class="audit-target-diff">{{ targetDiff(scope.row) }}</span>
                  <span v-else-if="!targetSubject(scope.row)" class="audit-target-empty">—</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="actor" :label="t('component.knowledgeEditor.activity.columns.actor')" width="120">
              <template #default="scope">
                <div class="audit-actor">
                  <span class="audit-actor-name">{{ actorLabel(scope.row) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="outcome" :label="t('component.knowledgeEditor.activity.columns.outcome')" width="200">
              <template #default="{ row }">
                <el-tag :theme="outcomeTheme(row.outcome)" size="small" effect="light">
                  {{ outcomeLabel(row.outcome) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="getList" />
        <div class="place"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t, te, tm, locale } from '@/i18n';
import { AUDIT_ACTION_I18N_ROOTS } from '@/i18n/auditActionRegistry';
import { auditActionLabel } from '@/i18n/auditActionLabel';
import { getKnowledgeBaseActivityListApi } from '@/api/data/knowledgeBase';
import { KnowledgeBaseActivityEntity } from '@/types';

type AuditOutcome = 'accepted' | 'success' | 'failed' | 'partial' | 'canceled' | 'denied';

const props = defineProps<{
  kbId: string;
}>();

const loading = ref(false);
const total = ref<number>(0);
const entries = ref<KnowledgeBaseActivityEntity[]>([]);
const error = ref('');
const pageParams = ref({
  pageNum: 1,
  pageSize: 10
});

function getList() {
  loading.value = true;
  getKnowledgeBaseActivityListApi(props.kbId, pageParams.value).then(
    (res) => {
      loading.value = false;
      entries.value = (res.rows || []).map(parseEntity);
      total.value = +res.total || 0;
    },
    () => {
      loading.value = false;
    }
  );
}

function parseEntity(entity: KnowledgeBaseActivityEntity) {
  return entity;
}

function reload() {
  getList();
}

getList();

const emptyDescription = computed(() => t('component.knowledgeEditor.activity.empty'));

function details(entry: KnowledgeBaseActivityEntity): Record<string, unknown> {
  if (!entry.details) return {};
  if (typeof entry.details === 'object') return entry.details;
  try {
    return JSON.parse(entry.details) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function actionLabel2(action: string): string {
  console.log('actionLabel2', action);
  return auditActionLabel({ tm }, AUDIT_ACTION_I18N_ROOTS.kbActivity, action);
}

function outcomeLabel(value: AuditOutcome): string {
  const key = `component.knowledgeEditor.activity.outcomes.${value}`;
  return te(key) ? t(key) : value;
}

function outcomeTheme(value: AuditOutcome): 'success' | 'danger' | 'warning' | 'primary' | 'default' {
  if (value === 'accepted') return 'primary';
  if (value === 'success') return 'success';
  if (value === 'failed' || value === 'denied') return 'danger';
  if (value === 'partial' || value === 'canceled') return 'warning';
  return 'default';
}

function actionTheme(action: string): 'success' | 'warning' | 'danger' | 'primary' | 'default' {
  if (action.includes('failed') || action.includes('denied')) return 'danger';
  if (action.includes('deleted') || action.includes('removed') || action.includes('canceled')) return 'warning';
  if (action.includes('completed') || action.includes('created') || action.includes('added')) return 'success';
  if (action.includes('started') || action.includes('updated') || action.includes('changed')) return 'primary';
  return 'default';
}

function targetLabel(value: string): string {
  const bag = tm('component.knowledgeEditor.activity.targets') as unknown;
  const key = value || 'knowledge_base';
  if (bag !== null && typeof bag === 'object' && typeof (bag as Record<string, string>)[key] === 'string') {
    return (bag as Record<string, string>)[key];
  }
  return value || t('component.knowledgeEditor.activity.knowledgeBase');
}

function targetSubject(entry: KnowledgeBaseActivityEntity): string {
  const value = details(entry);
  const label = String(value.title || value.name || '').trim();
  const count = Number(value.count ?? 0);
  if (label && count > 1) {
    return t('component.knowledgeEditor.activity.titleWithCount', { title: label, count });
  }
  if (label) return label;
  // Aggregate / clone / share events carry no human-readable name — fall back
  // to the localized object-type label so the column always has a meaningful
  // primary subject instead of being blank or showing a raw identifier.
  return targetLabel(entry.targetType!);
}

function targetDiff(entry: KnowledgeBaseActivityEntity): string {
  const value = details(entry);
  // Data source: the connector type is more identifying than a row count.
  if (entry.targetType === 'data_source' && value.type) {
    return String(value.type);
  }
  // Share: surface the granted permission rather than the opaque share id.
  if (entry.targetType === 'knowledge_base_share' && value.permission) {
    const key = `component.knowledgeEditor.activity.detailValues.${String(value.permission)}`;
    return te(key) ? t(key) : String(value.permission);
  }
  if (entry.action && entry.action.startsWith('faq.import_')) {
    if (entry.action === 'faq.import_started' && value.total !== undefined && value.total !== null) {
      return t('component.knowledgeEditor.activity.countItems', { count: Number(value.total) });
    }
    if (entry.action !== 'faq.import_started' && value.total !== undefined && value.total !== null) {
      const success = Number(value.count ?? 0);
      const failed = Number(value.failed ?? 0);
      const skipped = Number(value.skipped ?? 0);
      return t('component.knowledgeEditor.activity.importSummary', { success, failed, skipped });
    }
  }
  // Aggregate events: show volume only when the primary subject has no title.
  const count = value.count !== undefined && value.count !== null ? Number(value.count) : Number(value.total ?? 0);
  if (count > 0 && !String(value.title || value.name || '').trim()) {
    return t('component.knowledgeEditor.activity.countItems', { count });
  }
  // Deliberately no raw targetId here — identifiers live in the detail drawer.
  return '';
}

function actorLabel(entry: KnowledgeBaseActivityEntity): string {
  if (!entry.actorUserId) return t('component.knowledgeEditor.activity.systemActor');
  return entry.actorUserId.slice(0, 8);
}

function formatDatePart(value: string): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale.value || 'zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTimePart(value: string): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale.value || 'zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date(value));
  } catch {
    return '';
  }
}
</script>

<style scoped lang="scss">
// @import '@/components/css/suggested-questions.less';
.kb-activity-settings {
  height: 100%;
}
.section-content {
  width: 100%;

  .section-header {
    margin-bottom: 16px;
  }

  .kb-activity-title-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    max-width: 100%;
  }

  .section-title {
    margin: 0;
    font-family: var(--el-font-family);
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    margin: 0;
    font-family: var(--el-font-family);
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    line-height: 22px;
  }

  .kb-activity-filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 20px;
  }
}

.kb-activity-body {
  // min-height: 280px;
  height: 100%;
}

.kb-activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
}

.kb-activity-clear-filters {
  padding: 0;
  border: none;
  background: none;
  color: var(--el-color-primary);
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.kb-activity-col-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;

  &--center {
    justify-content: center;
    width: 100%;
  }
}

.kb-activity-filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
  }

  &.active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light, rgba(0, 82, 217, 0.08));
  }
}

.kb-activity-filter-menu {
  min-width: 160px;
  max-width: 280px;
  max-height: min(360px, 60vh);
  display: flex;
  flex-direction: column;
  padding: 6px;
  overflow: hidden;
}

.kb-activity-filter-options {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  scrollbar-width: thin;
}

.kb-activity-filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: var(--el-fill-color-lighter);
  }

  &.active {
    background: var(--el-color-primary-light, rgba(0, 82, 217, 0.08));
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.kb-activity-filter-option-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-activity-filter-option-check {
  flex: 0 0 auto;
  color: var(--el-color-primary);
}

.kb-activity-branch {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.kb-activity-branch--error {
  justify-content: center;
  align-items: center;
  min-height: 240px;
}

.audit-scroll-area {
  overflow-x: hidden;
  overflow-y: visible;
}

.audit-load-sentinel {
  height: 1px;
  width: 100%;
  pointer-events: none;
}

.audit-loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.audit-end-hint {
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-disabled);
  padding: 8px 0 14px;
  margin: 0;
}

.audit-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;

  .audit-time-date {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }

  .audit-time-clock {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }
}

.audit-actor {
  min-width: 0;

  .audit-actor-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.audit-target {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.35;
  min-width: 0;
  padding: 2px 0;

  .audit-target-key {
    font-size: 13px;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  .audit-target-diff {
    font-size: 12px;
    color: var(--el-text-color-regular);
    font-family: Consolas, Monaco, monospace;
    word-break: break-all;
    line-height: 1.4;
  }

  .audit-target-empty {
    color: var(--el-text-color-placeholder);
  }
}

.data-table-shell {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);

  &:deep(thead th) {
    font-weight: 600;
    font-size: 13px;
  }

  &:deep(.t-table td),
  &:deep(.t-table th) {
    padding-top: 12px;
    padding-bottom: 12px;
  }
}

.audit-table-shell {
  &:deep(.t-table td),
  &:deep(.t-table th) {
    vertical-align: middle;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  &:deep(thead th) {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: var(--el-fill-color-lighter) !important;
    box-shadow: inset 0 -1px 0 var(--el-border-color);
  }

  &:deep(.t-table tbody tr) {
    cursor: pointer;
  }

  &:deep(.t-table tbody tr:hover > td) {
    background-color: var(--el-fill-color-light);
  }
}

.audit-detail-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.audit-detail-field {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
  margin: 0;

  dt {
    margin: 0;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    line-height: 1.45;
    white-space: nowrap;
  }

  dd {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.55;
    word-break: break-all;
  }
}

.audit-detail-json {
  margin: 0;
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: min(420px, 50vh);
  overflow: auto;
}

.mono {
  font-family: Consolas, Monaco, 'Courier New', monospace;
}

.narrow-scrollbar {
  scrollbar-width: thin;
}
</style>
