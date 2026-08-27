<template>
  <div class="section-content kb-activity-settings">
    <!-- <div class="section-header">
      <div class="kb-activity-title-row">
        <h3 class="section-title">{{ t('component.knowledgeEditor.activity.title') }}</h3>
        <el-button
          type="button"
          class="suggested-questions-refresh"
          :disabled="loading"
          :title="t('component.knowledgeEditor.activity.refresh')"
          :aria-label="t('component.knowledgeEditor.activity.refresh')"
          @click="reload"
        >
          <el-icon :name="loading ? 'loading' : 'refresh'" :class="{ 'sq-refresh-spin': loading }" />
        </el-button>
      </div>
      <p class="section-desc">{{ t('component.knowledgeEditor.activity.description') }}</p>
      <p v-if="hasActiveFilters" class="kb-activity-filter-bar">
        <span>{{ filterSummaryText }}</span>
        <button type="button" class="kb-activity-clear-filters" @click="clearFilters">
          {{ t('component.knowledgeEditor.activity.clearFilters') }}
        </button>
      </p>
    </div> -->

    <div class="section-body kb-activity-body">
      <div v-if="error" class="kb-activity-branch kb-activity-branch--error">
        <el-alert theme="error" :message="error">
          <template #operation>
            <el-button size="small" @click="reload">{{ t('component.knowledgeEditor.activity.retry') }}</el-button>
          </template>
        </el-alert>
      </div>

      <div ref="scrollRoot" class="audit-scroll-area narrow-scrollbar kb-activity-branch">
        <div class="data-table-shell audit-table-shell">
          <el-table row-key="id" :data="entries" :loading="loading" @row-click="openDetail">
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
            <!-- 
            <template #outcome-title>
              <div class="kb-activity-col-header kb-activity-col-header--center">
                <span>{{ t('component.knowledgeEditor.activity.columns.outcome') }}</span>
                <el-popover
                  v-model:visible="outcomeFilterOpen"
                  trigger="click"
                  placement="bottom-right"
                  destroy-on-close
                  :overlay-style="{ padding: 0 }"
                  ::popper-style="{ padding: 0 }"
                >
                  <template #reference>
                    <div class="kb-activity-filter-menu">
                      <div class="kb-activity-filter-options">
                        <button
                          v-for="item in outcomeFilterList"
                          :key="item.value || '__all__'"
                          type="button"
                          class="kb-activity-filter-option"
                          :class="{ active: (outcome ?? '') === item.value }"
                          @click="selectOutcomeFilter(item.value)"
                        >
                          <span class="kb-activity-filter-option-label">{{ item.label }}</span>
                          <el-icon v-if="(outcome ?? '') === item.value" name="check" class="kb-activity-filter-option-check" size="14px" />
                        </button>
                      </div>
                    </div>
                  </template>
                  <button
                    type="button"
                    class="kb-activity-filter-trigger"
                    :class="{ active: Boolean(outcome) }"
                    :aria-label="t('component.knowledgeEditor.activity.columns.outcome')"
                    @click.stop
                  >
                    <el-icon name="filter" size="14px" />
                  </button>
                </el-popover>
              </div>
            </template>
            <template #empty>
              <div class="kb-activity-empty">
                <el-empty :description="emptyDescription" />
              </div>
            </template>
            <template #createdAt="{ row }">
              <div class="audit-time">
                <span class="audit-time-date">{{ formatDatePart(row.createdAt) }}</span>
                <span class="audit-time-clock">{{ formatTimePart(row.createdAt) }}</span>
              </div>
            </template>
            <template #action="{ row }">
              <el-tag :theme="actionTheme(row.action)" size="small" variant="light-outline">
                {{ actionLabel(row.action) }}
              </el-tag>
            </template>
            <template #target="{ row }">
              <div class="audit-target">
                <span v-if="targetSubject(row)" class="audit-target-key">{{ targetSubject(row) }}</span>
                <span v-if="targetDiff(row)" class="audit-target-diff">{{ targetDiff(row) }}</span>
                <span v-else-if="!targetSubject(row)" class="audit-target-empty">—</span>
              </div>
            </template>
            <template #actor="{ row }">
              <div class="audit-actor">
                <span class="audit-actor-name">{{ actorLabel(row) }}</span>
              </div>
            </template>
            <template #outcome="{ row }">
              <el-tag :theme="outcomeTheme(row.outcome)" size="small" effect="light">
                {{ outcomeLabel(row.outcome) }}
              </el-tag>
            </template> -->
          </el-table>
        </div>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="getList" />
        <div class="place"></div>
      </div>
    </div>

    <SettingDrawer
      v-model:visible="detailVisible"
      class="kb-activity-detail-drawer"
      :title="detailTitle"
      :description="detailDescription"
      icon="file-paste"
      width="640px"
      :min-width="480"
      :max-width="960"
      storage-key="setting-drawer:width:kb-activity-detail"
      hide-footer
    >
      <template v-if="selectedEntry">
        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">
            {{ t('component.knowledgeEditor.activity.drawer.sectionSummary') }}
          </h4>
          <dl class="audit-detail-fields">
            <div v-for="field in summaryFields(selectedEntry)" :key="field.key" class="audit-detail-field">
              <dt>{{ field.label }}</dt>
              <dd :title="field.value">{{ field.value }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="identifierFields(selectedEntry).length > 0" class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">
            {{ t('component.knowledgeEditor.activity.drawer.sectionIdentifiers') }}
          </h4>
          <dl class="audit-detail-fields">
            <div v-for="field in identifierFields(selectedEntry)" :key="field.key" class="audit-detail-field">
              <dt>{{ field.label }}</dt>
              <dd class="mono" :title="field.value">{{ field.value }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="taskFields(selectedEntry).length > 0" class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">
            {{ t('component.knowledgeEditor.activity.drawer.sectionTask') }}
          </h4>
          <dl class="audit-detail-fields">
            <div v-for="field in taskFields(selectedEntry)" :key="field.key" class="audit-detail-field">
              <dt>{{ field.label }}</dt>
              <dd :class="{ mono: field.key.endsWith('_id') }" :title="field.value">{{ field.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">
            {{ t('component.knowledgeEditor.activity.expanded.details') }}
          </h4>
          <pre class="audit-detail-json mono">{{ detailsJSON(selectedEntry) }}</pre>
        </section>
      </template>
    </SettingDrawer>
  </div>
</template>

<script setup lang="ts">
// import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n';
import SettingDrawer from '@/components/business/settings/SettingDrawer.vue';
import { AUDIT_ACTION_I18N_ROOTS } from '@/i18n/auditActionRegistry';
import { auditActionLabel } from '@/i18n/auditActionLabel';
import { getKnowledgeBaseActivityListApi } from '@/api/data/knowledgeBase';
import { KnowledgeBaseActivityEntity } from '@/types';
// import { listKnowledgeBaseActivity, type KnowledgeBaseActivityEntity } from '@/api/knowledge-base'
// import type { AuditOutcome } from '@/api/tenant/audit-log'
// import { useAuthStore } from '@/stores/auth'

type AuditOutcome = 'accepted' | 'success' | 'failed' | 'partial' | 'canceled' | 'denied';

interface DetailField {
  key: string;
  label: string;
  value: string;
}

const props = defineProps<{
  kbId: string;
}>();

const { t, te, tm, locale } = useI18n();
// const authStore = useAuthStore()

const loading = ref(false);
const total = ref<number>(0);
const entries = ref<KnowledgeBaseActivityEntity[]>([]) as { value: KnowledgeBaseActivityEntity[] };
const error = ref('');
const pageParams = ref({
  pageNum: 1,
  pageSize: 10
}) as { value: { pageNum: number; pageSize: number } };

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
  // cursor.value = 0;
  // hasMore.value = true;
  // fetchPage(true);
  getList();
}

getList();

// const cursor = ref(0);
// const hasMore = ref(true);
const outcome = ref<AuditOutcome | undefined>();
const action = ref<string | undefined>();
// const loadedOnce = ref(false);
// const pageSize = 30;
// const scrollRoot = ref<HTMLElement | null>(null);
// const loadSentinel = ref<HTMLElement | null>(null);
const detailVisible = ref(false);
const selectedEntry = ref<KnowledgeBaseActivityEntity | null>(null);
const actionFilterOpen = ref(false);
const outcomeFilterOpen = ref(false);
// let scrollObserver: IntersectionObserver | null = null;

const outcomeOptions = computed(() =>
  (['accepted', 'success', 'failed', 'partial', 'canceled', 'denied'] as AuditOutcome[]).map((value) => ({
    value,
    label: outcomeLabel(value)
  }))
) as unknown as { value: { value: AuditOutcome; label: string }[] };

// Column-header filter lists. Both host a leading "全部" entry (value '')
// so picking it clears the server-side filter for that dimension.
const outcomeFilterList = computed(() => [{ label: t('component.knowledgeEditor.activity.allOutcomes'), value: '' }, ...outcomeOptions.value]);

const actionFilterList = computed(() => {
  const bag = tm('component.knowledgeEditor.activity.actions') as unknown;
  const list =
    bag !== null && typeof bag === 'object'
      ? Object.keys(bag as Record<string, string>).map((key) => ({
          label: (bag as Record<string, string>)[key],
          value: key
        }))
      : [];
  return [{ label: t('component.knowledgeEditor.activity.allActions'), value: '' }, ...list];
});

const columns = computed(() => [
  { colKey: 'createdAt', title: t('component.knowledgeEditor.activity.columns.time'), width: 116 },
  {
    colKey: 'action',
    title: 'action-title',
    width: 132
  },
  { colKey: 'target', title: t('component.knowledgeEditor.activity.columns.target'), minWidth: 180 },
  { colKey: 'actor', title: t('component.knowledgeEditor.activity.columns.actor'), width: 120 },
  {
    colKey: 'outcome',
    title: 'outcome-title',
    width: 108,
    align: 'center' as const
  }
]);

const hasActiveFilters = computed(() => Boolean(action.value || outcome.value));

const filterSummaryText = computed(() => {
  const parts: string[] = [];
  if (action.value) {
    parts.push(`${t('component.knowledgeEditor.activity.columns.action')}：${actionLabel(action.value)}`);
  }
  if (outcome.value) {
    parts.push(`${t('component.knowledgeEditor.activity.columns.outcome')}：${outcomeLabel(outcome.value)}`);
  }
  return parts.join('；');
});

function selectActionFilter(value: string) {
  actionFilterOpen.value = false;
  const next = value || undefined;
  if (action.value === next) return;
  action.value = next;
  if (props.active) reload();
}

function selectOutcomeFilter(value: string) {
  outcomeFilterOpen.value = false;
  const next = (value || undefined) as AuditOutcome | undefined;
  if (outcome.value === next) return;
  outcome.value = next;
  if (props.active) reload();
}

const emptyDescription = computed(() =>
  hasActiveFilters.value ? t('component.knowledgeEditor.activity.emptyFiltered') : t('component.knowledgeEditor.activity.empty')
);

function clearFilters() {
  actionFilterOpen.value = false;
  outcomeFilterOpen.value = false;
  action.value = undefined;
  outcome.value = undefined;
  if (props.active) reload();
}

const detailTitle = computed(() => (selectedEntry.value ? actionLabel(selectedEntry.value.action) : ''));

const detailDescription = computed(() => (selectedEntry.value ? formatDateTime(selectedEntry.value.createdAt) : ''));

function details(entry: KnowledgeBaseActivityEntity): Record<string, unknown> {
  if (!entry.details) return {};
  if (typeof entry.details === 'object') return entry.details;
  try {
    return JSON.parse(entry.details) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function actionLabel(action: string): string {
  return auditActionLabel({ tm }, AUDIT_ACTION_I18N_ROOTS.kbActivity, action);
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

const taskDetailKeys = [
  'task_id',
  'trigger',
  'processing_status',
  'source_kb_id',
  'target_kb_id',
  'sync_log_id',
  'mode',
  'attempt',
  'count',
  'total',
  'processed',
  'failed',
  'skipped',
  'failure_stage'
] as const;

function taskFields(entry: KnowledgeBaseActivityEntity): DetailField[] {
  const value = details(entry);
  return taskDetailKeys.flatMap((key) => {
    const raw = value[key];
    if (raw === undefined || raw === null || raw === '') return [];
    const labelKey = `component.knowledgeEditor.activity.detailFields.${key}`;
    const valueKey = `component.knowledgeEditor.activity.detailValues.${String(raw)}`;
    return [
      {
        key,
        label: te(labelKey) ? t(labelKey) : key,
        value: te(valueKey) ? t(valueKey) : String(raw)
      }
    ];
  });
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
  // const me = authStore.user;
  // if (me?.id === entry.actorUserId) {
  //   return me.username?.trim() || me.email?.trim() || entry.actorUserId.slice(0, 8);
  // }
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

function formatDateTime(value: string): string {
  const date = formatDatePart(value);
  const time = formatTimePart(value);
  return time ? `${date} ${time}` : date;
}

function summaryFields(entry: KnowledgeBaseActivityEntity): DetailField[] {
  const fields: DetailField[] = [
    {
      key: 'time',
      label: t('component.knowledgeEditor.activity.columns.time'),
      value: formatDateTime(entry.createdAt!)
    },
    {
      key: 'actor',
      label: t('component.knowledgeEditor.activity.columns.actor'),
      value: actorLabel(entry)
    },
    {
      key: 'action',
      label: t('component.knowledgeEditor.activity.columns.action'),
      value: actionLabel(entry.action!)
    },
    {
      key: 'outcome',
      label: t('component.knowledgeEditor.activity.columns.outcome'),
      value: outcomeLabel(entry.outcome! as AuditOutcome)
    }
  ];

  const subject = targetSubject(entry);
  if (subject) {
    fields.push({
      key: 'target',
      label: t('component.knowledgeEditor.activity.columns.target'),
      value: subject
    });
  }

  const diff = targetDiff(entry);
  if (diff && diff !== subject) {
    fields.push({
      key: 'targetDiff',
      label: t('component.knowledgeEditor.activity.drawer.targetChange'),
      value: diff
    });
  }

  return fields;
}

function identifierFields(entry: KnowledgeBaseActivityEntity): DetailField[] {
  const fields: DetailField[] = [];
  if (entry.targetType) {
    fields.push({
      key: 'targetType',
      label: t('component.knowledgeEditor.activity.expanded.targetType'),
      value: targetLabel(entry.targetType)
    });
  }
  if (entry.targetId) {
    fields.push({
      key: 'targetId',
      label: t('component.knowledgeEditor.activity.expanded.targetId'),
      value: entry.targetId
    });
  }
  if (entry.actorUserId) {
    fields.push({
      key: 'actorId',
      label: t('component.knowledgeEditor.activity.expanded.actorId'),
      value: entry.actorUserId
    });
  }
  return fields;
}

function detailsJSON(entry: KnowledgeBaseActivityEntity): string {
  const value = details(entry);
  if (!Object.keys(value).length) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function openDetail(context: { row: KnowledgeBaseActivityEntity }) {
  selectedEntry.value = context.row;
  detailVisible.value = true;
}

// async function fetchPage(reset = false) {
//   if (!props.kbId || loading.value || (!reset && !hasMore.value)) return;
//   loading.value = true;
//   error.value = '';
//   if (reset) {
//     entries.value = [];
//   }
//   try {
//     const response = await getKnowledgeBaseAuditLogListApi(props.kbId, {
//       limit: pageSize,
//       after_id: reset ? undefined : cursor.value || undefined,
//       outcome: outcome.value,
//       action: action.value
//     });
//     const page = response.rows || [];
//     entries.value = reset ? page : [...entries.value, ...page];
//     cursor.value = response.next_cursor || 0;
//     hasMore.value = !!response.next_cursor && page.length > 0;
//     loadedOnce.value = true;
//   } catch (err: any) {
//     error.value = err?.message || t('component.knowledgeEditor.activity.loadFailed');
//   } finally {
//     loading.value = false;
//   }
// }

// function detachInfiniteScroll() {
//   scrollObserver?.disconnect();
//   scrollObserver = null;
// }

// function attachInfiniteScroll() {
//   detachInfiniteScroll();
//   const root = scrollRoot.value;
//   const sentinel = loadSentinel.value;
//   if (!root || !sentinel || error.value) return;

//   scrollObserver = new IntersectionObserver(
//     (hits) => {
//       const hitBottom = hits.some((item) => item.isIntersecting);
//       if (!hitBottom || !hasMore.value || loading.value) return;
//       void fetchPage(false);
//     },
//     { root, rootMargin: '100px 0px', threshold: 0 }
//   );
//   scrollObserver.observe(sentinel);
// }

// watch(
//   () => props.active,
//   (active: boolean) => {
//     if (active && !loadedOnce.value) reload();
//     if (!active) detachInfiniteScroll();
//   },
//   { immediate: true }
// );

// watch(
//   () => props.kbId,
//   () => {
//     loadedOnce.value = false;
//     entries.value = [];
//     if (props.active) reload();
//   }
// );

// watch(
//   [() => props.active, () => entries.value.length, () => error.value, hasMore],
//   async ([active]: any) => {
//     if (!active) {
//       detachInfiniteScroll();
//       return;
//     }
//     await nextTick();
//     attachInfiniteScroll();
//   },
//   { flush: 'post' }
// );

// onUnmounted(() => detachInfiniteScroll());
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
