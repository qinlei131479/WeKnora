<template>
  <t-dialog
    :visible="open"
    attach="body"
    placement="center"
    class="skill-install-flow-modal"
    dialog-class-name="skill-install-flow-modal"
    :header="false"
    :width="840"
    :close-btn="canClose"
    :close-on-overlay-click="canClose"
    :close-on-esc-keydown="canClose"
    :footer="false"
    :destroy-on-close="true"
    @close="handleClose"
  >
    <div class="install-flow-shell">
      <header class="install-flow-header">
        <div class="install-flow-icon"><PackageOpen :size="19" /></div>
        <div>
          <h2>{{ modalTitle }}</h2>
          <p>{{ modalDescription }}</p>
        </div>
      </header>

      <ol class="install-flow-steps" :aria-label="t('ext.skills.install.stepsAria')">
        <li
          v-for="(label, index) in stepLabels"
          :key="label"
          :class="{ active: currentStep === index, completed: currentStep > index }"
          :aria-current="currentStep === index ? 'step' : undefined"
        >
          <span class="step-dot">{{ currentStep > index ? '✓' : index + 1 }}</span>
          <span class="step-label">{{ label }}</span>
        </li>
      </ol>

      <main
        class="install-flow-body"
        :class="{ 'remote-selection-body': phase === 'selecting' && flow?.kind === 'remote' }"
      >
        <section v-if="phase === 'selecting'" class="flow-section">
          <slot v-if="flow?.kind === 'remote'" name="selection" />
          <template v-else>
            <div class="selection-toolbar">
              <span>{{ t('ext.skills.install.pickToLoad') }}</span>
              <div>
                <t-button variant="text" size="small" @click="selectAllAvailable">{{ t('ext.skills.selectAll') }}</t-button>
                <t-button variant="text" size="small" @click="selectedSlugs = []">{{ t('ext.skills.clear') }}</t-button>
              </div>
            </div>
            <div class="flow-item-list selection-list">
              <label
                v-for="skill in suiteSkills"
                :key="skill.slug"
                class="selection-item"
                :class="{ installed: isInstalled(skill.slug) }"
              >
                <t-checkbox
                  :checked="selectedSlugs.includes(skill.slug)"
                  :disabled="isInstalled(skill.slug)"
                  @change="(checked) => toggleSelection(skill.slug, checked)"
                />
                <span class="flow-item-content">
                  <strong>{{ skill.name }}</strong>
                  <small>{{ skill.description || skill.slug }}</small>
                </span>
                <span v-if="isInstalled(skill.slug)" class="status-badge neutral">{{ t('ext.skills.install.installed') }}</span>
              </label>
            </div>
          </template>
        </section>

        <section v-else-if="phase === 'preparing'" class="flow-section" aria-live="polite">
          <div class="flow-loading-state" :class="{ failed: flowError }">
            <div class="loading-state-icon">
              <XCircle v-if="flowError" :size="20" />
              <LoaderCircle v-else :size="20" class="spin" />
            </div>
            <strong>
              {{
                flowError
                  ? t('ext.skills.install.loadFailed')
                  : t('ext.skills.install.loadingCount', { count: progressItems.length })
              }}
            </strong>
            <span>
              {{
                flowError ||
                t('ext.skills.install.loadingHint', { count: loadingSourceCount })
              }}
            </span>
          </div>
        </section>

        <section v-else-if="phase === 'reviewing'" class="flow-section">
          <div class="review-heading">
            <strong>{{ t('ext.skills.install.confirmTitle') }}</strong>
            <span>{{ t('ext.skills.install.confirmHint', { count: readyItems.length }) }}</span>
          </div>
          <div class="review-list">
            <div
              v-for="item in reviewItems"
              :key="`${item.draft_id}:${item.slug}`"
              class="review-item"
              :class="{ failed: item.success === false }"
            >
              <span class="review-title">
                <strong>{{ item.name || item.slug }}</strong>
                <small>{{ item.description || item.error || t('ext.noDescription') }}</small>
              </span>
              <span v-if="item.success === false" class="status-badge error">{{ t('ext.skills.install.parseFailed') }}</span>
              <button
                type="button"
                class="review-remove-button"
                :aria-label="t('ext.skills.install.removeAria', { name: item.name || item.slug })"
                @click="removeReviewItem(item)"
              >
                <XIcon :size="15" />
              </button>
              <div v-if="item.warnings?.length" class="review-warning" role="alert">
                {{ item.warnings.join('；') }}
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="phase === 'installing'" class="flow-section" aria-live="polite">
          <div class="flow-loading-state">
            <div class="loading-state-icon">
              <LoaderCircle :size="20" class="spin" />
            </div>
            <strong>{{ t('ext.skills.install.installingCount', { count: installItems.length }) }}</strong>
            <span>{{ t('ext.skills.install.installingTo', { target: installTargetLabel }) }}</span>
          </div>
        </section>

        <section v-else class="flow-section" aria-live="polite">
          <div class="result-heading">
            <strong>{{ resultTitle }}</strong>
            <span
              >{{ t('ext.skills.install.resultCount', { success: successfulInstallCount, fail: failedInstallItems.length }) }}</span
            >
          </div>
          <StatusItemList :items="installItems" />
          <div v-if="flowError" class="flow-alert" role="alert">{{ flowError }}</div>
        </section>
      </main>

      <footer class="install-flow-footer">
        <slot v-if="phase === 'selecting' && flow?.kind === 'remote'" name="selection-footer" />
        <template v-else>
          <span class="footer-summary">{{ footerSummary }}</span>
          <div class="footer-actions">
            <template v-if="phase === 'selecting'">
              <t-button variant="outline" @click="handleClose">{{ t('ext.skills.install.cancel') }}</t-button>
              <t-button theme="primary" :disabled="selectedSlugs.length === 0" @click="prepareSuite">
                {{ t('ext.skills.install.loadSelected') }}
              </t-button>
            </template>
            <template v-else-if="phase === 'preparing'">
              <t-button v-if="flowError" @click="handleClose">{{ t('ext.skills.install.close') }}</t-button>
              <t-button v-else loading disabled>{{ t('ext.skills.install.loading') }}</t-button>
            </template>
            <template v-else-if="phase === 'reviewing'">
              <t-button variant="outline" @click="handleClose">{{ t('ext.skills.install.cancel') }}</t-button>
              <t-button theme="primary" :disabled="readyItems.length === 0" @click="installDrafts">
                {{ t('ext.skills.install.confirmInstall', { count: readyItems.length, target: installTargetLabel }) }}
              </t-button>
            </template>
            <template v-else-if="phase === 'installing'">
              <t-button theme="primary" loading disabled>{{ t('ext.skills.install.installing') }}</t-button>
            </template>
            <template v-else>
              <t-button v-if="failedInstallItems.length" @click="retryFailedItems">
                {{ t('ext.skills.install.retryFailed') }}
              </t-button>
              <t-button theme="primary" @click="finishFlow">{{ t('ext.skills.install.finish') }}</t-button>
            </template>
          </div>
        </template>
      </footer>
    </div>
  </t-dialog>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CheckCircle2,
  Circle,
  LoaderCircle,
  PackageOpen,
  X as XIcon,
  XCircle
} from 'lucide-vue-next'
import { skillApi } from '@/api/chat-work/skill'

const props = defineProps({
  open: { type: Boolean, default: false },
  flow: { type: Object, default: null }
})

const emit = defineEmits(['close', 'completed'])
const { t } = useI18n()

const stepLabels = computed(() => [
  t('ext.skills.install.stepSelect'),
  t('ext.skills.install.stepLoad'),
  t('ext.skills.install.stepPlace'),
  t('ext.skills.install.stepDone')
])
const phase = ref('selecting')
const selectedSlugs = ref([])
const progressItems = ref([])
const drafts = ref([])
const reviewItems = ref([])
const installItems = ref([])
const flowError = ref('')

const StatusItemList = defineComponent({
  props: { items: { type: Array, default: () => [] } },
  setup(listProps) {
    const { t: translate } = useI18n()
    const iconFor = (status) => {
      if (status === 'success') return CheckCircle2
      if (status === 'failed') return XCircle
      if (status === 'active') return LoaderCircle
      return Circle
    }
    const labelFor = (status) =>
      ({
        waiting: translate('ext.skills.install.waiting'),
        active: translate('ext.skills.install.active'),
        success: translate('ext.skills.install.success'),
        failed: translate('ext.skills.install.failed')
      })[status] || status
    return () =>
      h(
        'div',
        { class: 'flow-item-list status-list' },
        listProps.items.map((item) =>
          h(
            'div',
            { class: ['status-item', item.status], key: `${item.source || ''}:${item.slug}` },
            [
              h(iconFor(item.status), { size: 17, class: item.status === 'active' ? 'spin' : '' }),
              h('span', { class: 'flow-item-content' }, [
                h('strong', item.name || item.slug),
                h('small', item.error || item.description || item.slug)
              ]),
              h('span', { class: ['status-badge', item.status] }, labelFor(item.status))
            ]
          )
        )
      )
  }
})

const suiteSkills = computed(() => props.flow?.suite?.skills || [])
const installedSet = computed(
  () => new Set((props.flow?.installedSlugs || []).map((slug) => String(slug).toLowerCase()))
)
const currentStep = computed(
  () => ({ selecting: 0, preparing: 1, reviewing: 2, installing: 3, result: 3 })[phase.value]
)
const canClose = computed(
  () => phase.value !== 'installing' && (phase.value !== 'preparing' || Boolean(flowError.value))
)
const readyItems = computed(() => reviewItems.value.filter((item) => item.success !== false))
const loadingSourceCount = computed(
  () => new Set(progressItems.value.map((item) => item.source).filter(Boolean)).size
)
// 技能安装不再区分个人/共享目标，统一安装为租户全局共享。
const installTargetLabel = computed(() => t('ext.skills.install.scopeGlobal'))
const failedInstallItems = computed(() =>
  installItems.value.filter((item) => item.status === 'failed')
)
const successfulInstallCount = computed(
  () => installItems.value.filter((item) => item.status === 'success').length
)
const resultTitle = computed(() => {
  if (!failedInstallItems.value.length) return t('ext.skills.install.allDone')
  if (successfulInstallCount.value) return t('ext.skills.install.partialDone')
  return t('ext.skills.install.allFailed')
})
const modalTitle = computed(() =>
  props.flow?.kind === 'suite'
    ? t('ext.skills.install.installNamed', { name: props.flow.suite.name })
    : props.flow?.title || t('ext.skills.install.installSkill')
)
const modalDescription = computed(() => {
  if (props.flow?.kind === 'suite')
    return `${props.flow.suite.provider} · ${props.flow.suite.description}`
  return props.flow?.description || t('ext.skills.install.defaultDesc')
})
const footerSummary = computed(() => {
  if (phase.value === 'selecting') {
    return t('ext.skills.install.willLoad', { count: selectedSlugs.value.length })
  }
  if (phase.value === 'preparing') {
    return flowError.value
      ? t('ext.skills.install.cleanedDrafts')
      : t('ext.skills.install.finishingLoad')
  }
  if (phase.value === 'reviewing') {
    return t('ext.skills.install.readySummary', {
      count: readyItems.value.length,
      target: installTargetLabel.value
    })
  }
  if (phase.value === 'installing') return t('ext.skills.install.noRollback')
  return t('ext.skills.install.resultCount', {
    success: successfulInstallCount.value,
    fail: failedInstallItems.value.length
  })
})

const isInstalled = (slug) => installedSet.value.has(String(slug).toLowerCase())
const selectAllAvailable = () => {
  selectedSlugs.value = suiteSkills.value
    .filter((skill) => !isInstalled(skill.slug))
    .map((skill) => skill.slug)
}
const toggleSelection = (slug, checked) => {
  selectedSlugs.value = checked
    ? [...new Set([...selectedSlugs.value, slug])]
    : selectedSlugs.value.filter((item) => item !== slug)
}

const removeReviewItem = (item) => {
  reviewItems.value = reviewItems.value.filter(
    (candidate) => candidate.draft_id !== item.draft_id || candidate.slug !== item.slug
  )
}

const initializeProgressItems = (requests) => {
  progressItems.value = requests.flatMap((request) =>
    request.skills.map((slug) => ({
      slug,
      name: request.skillDetails?.find((item) => item.slug === slug)?.name || slug,
      description: request.skillDetails?.find((item) => item.slug === slug)?.description || '',
      source: request.source,
      status: 'waiting'
    }))
  )
}

const prepareRequests = async (requests) => {
  phase.value = 'preparing'
  flowError.value = ''
  drafts.value = []
  initializeProgressItems(requests)

  try {
    for (const request of requests) {
      const result = await skillApi.prepareRemoteSkills({
        source: request.source,
        skills: request.skills
      })
      if (result?.data?.draft_id) drafts.value.push(result.data)
    }
    if (!drafts.value.length) throw new Error(t('ext.skills.install.noInstallable'))

    openReview(drafts.value)
  } catch (error) {
    await discardDrafts()
    flowError.value = error?.response
      ? t('ext.skills.install.loadSkillFailed')
      : error.message || t('ext.skills.install.loadSkillFailed')
  }
}

const openReview = (draftPayloads) => {
  drafts.value = draftPayloads.filter((draft) => draft?.draft_id)
  reviewItems.value = drafts.value.flatMap((draft) =>
    (draft.items || []).map((item) => ({
      ...item,
      source: draft.source,
      source_type: draft.source_type,
      draft_id: draft.draft_id
    }))
  )
  phase.value = 'reviewing'
}

const prepareSuite = () => {
  const details = suiteSkills.value.filter((skill) => selectedSlugs.value.includes(skill.slug))
  prepareRequests([
    { source: props.flow.suite.source, skills: selectedSlugs.value, skillDetails: details }
  ])
}

const installDrafts = async () => {
  phase.value = 'installing'
  flowError.value = ''
  installItems.value = readyItems.value.map((item) => ({ ...item, status: 'waiting' }))
  try {
    for (const draft of drafts.value) {
      const slugs = readyItems.value
        .filter((item) => item.draft_id === draft.draft_id)
        .map((item) => item.slug)
      if (!slugs.length) {
        await skillApi.discardSkillInstallDraft(draft.draft_id)
        forgetDraft(draft.draft_id)
        continue
      }

      const result = await skillApi.confirmSkillInstallDraft(draft.draft_id, slugs)
      const results = result?.data || []
      applyInstallResults(results, draft.source)
      if (!results.some((item) => item.success)) {
        await skillApi.discardSkillInstallDraft(draft.draft_id)
      }
      forgetDraft(draft.draft_id)
    }
  } catch (error) {
    await discardDrafts()
    flowError.value = error?.response
      ? t('ext.skills.install.installFailed')
      : error.message || t('ext.skills.install.installFailed')
    installItems.value
      .filter((item) => item.status === 'waiting')
      .forEach((item) => Object.assign(item, { status: 'failed', error: flowError.value }))
  } finally {
    phase.value = 'result'
  }
}

const applyInstallResults = (results, source) => {
  results.forEach((result) => {
    const item = installItems.value.find(
      (candidate) =>
        candidate.slug === (result.requested_slug || result.slug) && candidate.source === source
    )
    if (!item) return
    Object.assign(item, {
      status: result.success ? 'success' : 'failed',
      error: result.error || ''
    })
  })
}

const forgetDraft = (draftId) => {
  drafts.value = drafts.value.filter((draft) => draft.draft_id !== draftId)
}

const discardDrafts = async () => {
  const draftIds = drafts.value.map((draft) => draft.draft_id)
  drafts.value = []
  await Promise.allSettled(draftIds.map((draftId) => skillApi.discardSkillInstallDraft(draftId)))
}

const handleClose = async () => {
  if (!canClose.value) return
  if (phase.value === 'result') {
    finishFlow()
    return
  }
  if (phase.value === 'reviewing') await discardDrafts()
  emit('close')
}

const retryFailedItems = () => {
  const requestsBySource = new Map()
  failedInstallItems.value.forEach((item) => {
    if (item.source_type !== 'remote' || !item.source) return
    if (!requestsBySource.has(item.source)) requestsBySource.set(item.source, [])
    requestsBySource.get(item.source).push(item.slug)
  })
  const requests = [...requestsBySource].map(([source, skills]) => ({ source, skills }))
  if (!requests.length) {
    flowError.value = t('ext.skills.install.reuploadFailed')
    return
  }
  prepareRequests(requests)
}

const finishFlow = () => {
  emit('completed', {
    success: successfulInstallCount.value,
    failed: failedInstallItems.value.length
  })
  emit('close')
}

watch(
  () => [props.open, props.flow],
  async ([open]) => {
    if (!open || !props.flow) return
    flowError.value = ''
    drafts.value = []
    reviewItems.value = []
    installItems.value = []

    if (props.flow.kind === 'suite') {
      phase.value = 'selecting'
      selectAllAvailable()
      return
    }
    if (props.flow.kind === 'remote' && !props.flow.requests?.length) {
      phase.value = 'selecting'
      return
    }
    if (props.flow.kind === 'draft') {
      openReview(props.flow.drafts || [])
      return
    }
    await nextTick()
    prepareRequests(props.flow.requests || [])
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.install-flow-shell {
  display: flex;
  flex-direction: column;
  max-height: min(82vh, 760px);
}

.install-flow-header {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding-right: 28px;

  > div:last-child {
    min-width: 0;
  }

  h2 {
    margin: 0;
    color: var(--gray-900);
    font-size: 18px;
    font-weight: 650;
    line-height: 25px;
  }

  p {
    margin: 3px 0 0;
    color: var(--gray-500);
    font-size: 12px;
    line-height: 18px;
  }
}

.install-flow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--gray-100);
  color: var(--gray-700);
}

.install-flow-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 20px 0 16px;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    display: grid;
    grid-template-rows: 22px 18px;
    justify-items: center;
    gap: 4px;
    color: var(--gray-400);
    font-size: 12px;

    &::before {
      position: absolute;
      top: 11px;
      right: 50%;
      left: -50%;
      z-index: 0;
      height: 1px;
      background: var(--gray-150);
      content: '';
    }

    &:first-child::before {
      display: none;
    }

    .step-dot {
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid var(--gray-200);
      border-radius: 50%;
      background: var(--gray-0);
    }

    &.active,
    &.completed {
      color: var(--gray-800);
      font-weight: 600;

      .step-dot {
        border-color: var(--gray-500);
        background: var(--gray-50);
      }
    }

    &.completed::before {
      background: var(--gray-300);
    }
  }
}

.install-flow-body {
  min-height: 180px;
  max-height: min(52vh, 480px);
  flex: 0 1 auto;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-25);

  &.remote-selection-body {
    min-height: 0;
    max-height: none;
    overflow: hidden;
  }
}

.flow-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selection-toolbar,
.install-flow-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.selection-toolbar {
  color: var(--gray-700);
  font-size: 13px;
  font-weight: 600;

  :deep(.t-button--variant-text) {
    color: var(--gray-600);

    &:hover {
      color: var(--gray-900);
    }
  }
}

.flow-item-list,
.review-list,
:deep(.status-list) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-item,
:deep(.status-item) {
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
}

.selection-list {
  overflow: hidden;
  gap: 0;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);

  .selection-item {
    min-height: 60px;
    border: 0;
    border-bottom: 1px solid var(--gray-100);
    border-radius: 0;

    &:last-child {
      border-bottom: 0;
    }
  }
}

.selection-item,
:deep(.status-item) {
  display: flex;
  align-items: center;
  min-height: 54px;
  padding: 10px 12px;
  gap: 10px;
}

.selection-item {
  cursor: pointer;

  &.installed {
    color: var(--gray-400);
    cursor: not-allowed;
    background: var(--gray-50);
  }
}

.flow-item-content,
.review-title,
:deep(.status-item .flow-item-content) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;

  strong {
    color: var(--gray-900);
    font-size: 13px;
    line-height: 20px;
  }

  small {
    overflow: hidden;
    color: var(--gray-500);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:deep(.status-item) {
  color: var(--gray-400);

  > svg {
    flex: 0 0 auto;
  }

  &.active {
    color: var(--gray-700);
  }

  &.success {
    color: var(--color-success-700);
  }

  &.failed {
    color: var(--color-error-700);
  }
}

:deep(.status-badge) {
  flex-shrink: 0;
  margin-left: auto;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 11px;
  line-height: 18px;

  &.active,
  &.info {
    background: var(--gray-100);
    color: var(--gray-700);
  }

  &.success {
    background: var(--color-success-50);
    color: var(--color-success-700);
  }

  &.failed,
  &.error {
    background: var(--color-error-50);
    color: var(--color-error-700);
  }
}

.flow-loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 148px;
  padding: 16px;
  flex-direction: column;
  gap: 6px;
  color: var(--gray-600);
  text-align: center;

  .loading-state-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-bottom: 4px;
    border-radius: 50%;
    background: var(--gray-100);
  }

  strong {
    color: var(--gray-800);
    font-size: 14px;
    line-height: 20px;
  }

  span {
    color: var(--gray-500);
    font-size: 12px;
    line-height: 18px;
  }

  &.failed {
    color: var(--color-error-700);

    .loading-state-icon {
      background: var(--color-error-50);
    }
  }
}

.review-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--gray-800);

  strong {
    font-size: 13px;
  }

  span {
    color: var(--gray-500);
    font-size: 12px;
  }
}

.review-list {
  overflow: hidden;
  gap: 0;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
}

.review-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-height: 56px;
  padding: 10px 12px;
  gap: 12px;
  border-bottom: 1px solid var(--gray-100);

  &:last-child {
    border-bottom: 0;
  }

  &.failed {
    background: var(--color-error-50);
  }
}

.review-warning {
  width: 100%;
  color: var(--color-warning-900);
  font-size: 12px;
}

.review-remove-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--gray-400);
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease;

  &:hover {
    background: var(--gray-100);
    color: var(--gray-800);
  }

  &:focus-visible {
    outline: 2px solid var(--gray-500);
    outline-offset: 1px;
  }
}

.install-target-section,
.share-config-section {
  padding-top: 4px;

  h3 {
    margin: 0 0 9px;
    color: var(--gray-700);
    font-size: 13px;
    font-weight: 600;
  }
}

.install-target-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.install-target-option {
  display: flex;
  width: 100%;
  min-height: 88px;
  padding: 12px;
  flex-direction: column;
  gap: 5px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
  color: var(--gray-500);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;

  &:hover {
    border-color: var(--gray-300);
    background: var(--gray-25);
  }

  &.selected {
    border-color: var(--main-500);
    background: var(--main-30);
  }

  &:focus-visible {
    outline: 2px solid var(--main-400);
    outline-offset: 1px;
  }

  > span:last-child {
    font-size: 12px;
    line-height: 18px;
  }
}

.install-target-title {
  color: var(--gray-800);
  font-size: 13px;
  font-weight: 600;

  b {
    margin-left: 4px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--main-100);
    color: var(--main-800);
    font-size: 10px;
    font-weight: 600;
  }
}

.personal-install-note {
  padding: 9px 11px;
  border: 1px solid var(--main-100);
  border-radius: 6px;
  background: var(--main-30);
  color: var(--main-800);
  font-size: 12px;
  line-height: 18px;
}

.flow-alert {
  padding: 9px 11px;
  border: 1px solid var(--color-error-200);
  border-radius: 6px;
  background: var(--color-error-50);
  color: var(--color-error-700);
  font-size: 12px;
}

.install-flow-footer {
  padding-top: 14px;
}

.footer-summary {
  color: var(--gray-500);
  font-size: 12px;
}

.footer-actions {
  display: flex;
  gap: 8px;

  :deep(.t-button--variant-outline) {
    background: var(--gray-0);
  }
}

.spin {
  animation: flow-spin 1s linear infinite;
}

@keyframes flow-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin {
    animation-duration: 2.4s;
  }
}

@media (max-width: 600px) {
  .install-flow-shell {
    min-height: calc(100vh - 48px);
    max-height: none;
  }

  .install-flow-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .footer-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .install-target-options {
    grid-template-columns: 1fr;
  }
}
</style>

<style lang="less">
.skill-install-flow-modal {
  --page-padding: 22px;
  --main-800: #027218;
  --main-700: #038626;
  --main-600: #049b38;
  --main-500: #07c05f;
  --main-color: #07c05f;
  --gray-2000: #0c0d0d;
  --gray-1000: #151616;
  --gray-900: #1e1f1f;
  --gray-800: #323333;
  --gray-700: #4c4d4d;
  --gray-600: #697070;
  --gray-500: #979999;
  --gray-400: #bdbfbf;
  --gray-300: #d7d9d9;
  --gray-200: #e4e6e6;
  --gray-150: #eef0f0;
  --gray-100: #eff2f2;
  --gray-50: #f5f7f7;
  --gray-25: #f8fafa;
  --gray-10: #fbfcfc;
  --gray-0: #ffffff;

  .t-button.t-button--variant-outline {
    background: var(--gray-0);
  }
}

html[theme-mode='dark'] .skill-install-flow-modal {
  --main-color: var(--td-brand-color, #06b04d);
  --gray-2000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-1000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-900: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-800: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-700: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-600: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-500: var(--td-text-color-placeholder, rgba(255, 255, 255, 0.35));
  --gray-400: var(--td-text-color-placeholder, rgba(255, 255, 255, 0.35));
  --gray-300: var(--td-component-border, #5e5e5e);
  --gray-200: var(--td-component-border, #5e5e5e);
  --gray-150: rgba(255, 255, 255, 0.06);
  --gray-100: rgba(255, 255, 255, 0.06);
  --gray-50: rgba(255, 255, 255, 0.06);
  --gray-25: var(--td-bg-color-page, #181818);
  --gray-10: var(--td-bg-color-page, #181818);
  --gray-0: var(--td-bg-color-container, #242424);
}

body:has(.skill-install-flow-modal) {
  overflow-x: hidden;
}

@media (max-width: 600px) {
  .skill-install-flow-modal {
    top: 0;
    width: 100% !important;
    max-width: none;
    margin: 0;
    padding: 0;

    .t-dialog {
      min-height: 100vh;
      border-radius: 0;
    }
  }
}
</style>
