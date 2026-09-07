<template>
  <div class="skill-cards-page extension-page-root">
    <PageShoulder :search-placeholder="t('knowledgeList.extensions.skills.searchPlaceholder')" v-model:search="searchQuery">
      <template #actions>
        <template v-if="!isBatchDeleteMode">
          <t-button
            @click="isBatchDeleteMode = true"
            :disabled="loading || importing || filteredDeletableSkills.length === 0"
            class="lucide-icon-btn"
          >
            <span>{{ t('knowledgeList.extensions.skills.batchManage') }}</span>
          </t-button>
          <t-button
            @click="handleOpenRemoteInstall"
            :disabled="loading || importing"
            class="lucide-icon-btn"
          >
            <Computer :size="14" />
            <span>{{ t('knowledgeList.extensions.skills.remoteInstall') }}</span>
          </t-button>
          <input
            ref="skillFileInput"
            type="file"
            accept=".zip,.md"
            style="display: none"
            :disabled="loading || importing"
            @change="onSkillFileChange"
          />
          <t-button
            theme="primary"
            :loading="importing"
            :disabled="loading || importing"
            class="lucide-icon-btn"
            @click="skillFileInput?.click()"
          >
            <Upload :size="14" />
            <span>{{ t('knowledgeList.extensions.skills.upload') }}</span>
          </t-button>
        </template>
        <template v-else>
          <t-button size="small" variant="text" @click="handleBatchSelectAll">{{ t('knowledgeList.extensions.skills.selectAll') }}</t-button>
          <t-button size="small" variant="text" @click="handleBatchSelectInvert">{{ t('knowledgeList.extensions.skills.invert') }}</t-button>
          <t-button size="small" variant="text" @click="handleBatchSelectNone">{{ t('knowledgeList.extensions.skills.clear') }}</t-button>
          <t-button
            theme="danger"
            :disabled="selectedCardSlugs.length === 0"
            :loading="loading"
            @click="handleBatchDelete"
          >
            {{ t('knowledgeList.extensions.skills.batchDelete', { count: selectedCardSlugs.length }) }}
          </t-button>
          <t-button :disabled="loading" @click="exitBatchDeleteMode">{{ t('knowledgeList.extensions.skills.exitManage') }}</t-button>
        </template>
      </template>
    </PageShoulder>

    <div
      v-if="visibleSkillGroups.length === 0"
      class="extension-page-body extension-card-grid-empty-state skill-empty-state"
    >
      <div class="skill-empty-card">
        <div class="skill-empty-icon">
          <WandSparkles :size="22" />
        </div>
        <div class="skill-empty-title">
          {{ searchQuery ? t('knowledgeList.extensions.skills.emptySearchTitle') : t('knowledgeList.extensions.skills.emptyTitle') }}
        </div>
        <div class="skill-empty-desc">
          {{
            searchQuery
              ? t('knowledgeList.extensions.skills.emptySearchDesc')
              : t('knowledgeList.extensions.skills.emptyDesc')
          }}
        </div>
      </div>
    </div>

    <div v-else class="extension-page-body">
      <template v-for="group in visibleSkillGroups" :key="group.key">
        <div
          class="extension-section-header is-toggle"
          role="button"
          tabindex="0"
          @click="toggleSkillSection(group.key)"
          @keydown.enter.prevent="toggleSkillSection(group.key)"
          @keydown.space.prevent="toggleSkillSection(group.key)"
        >
          <span>{{ group.title }}</span>
          <span class="section-count">{{ group.skills.length }}</span>
          <ChevronRight v-if="isSkillSectionCollapsed(group.key)" :size="14" class="section-toggle" />
          <ChevronDown v-else :size="14" class="section-toggle" />
        </div>
        <ExtensionCardGrid v-show="!isSkillSectionCollapsed(group.key)" :min-width="240" :gap="12">
          <div
            v-for="skill in group.skills"
            :key="`${group.key}:${skill.slug || skill.id}`"
            class="card-wrapper"
            :class="{
              selected: !skill.isSuite && selectedCardSlugs.includes(skill.slug),
              'batch-mode': isBatchDeleteMode && !skill.isSuite
            }"
          >
            <SkillSuiteCard
              v-if="skill.isSuite"
              :suite="skill"
              :installed-slugs="[...installedPersonalSkillKeys]"
              @open="openRecommendedSuite"
            />
            <template v-else>
              <t-checkbox
                v-if="
                  isBatchDeleteMode &&
                  canManageSkill(skill) &&
                  skill.sourceType !== 'builtin' &&
                  skill.sourceScope !== 'personal'
                "
                :checked="selectedCardSlugs.includes(skill.slug)"
                @change="handleToggleCardSelect(skill.slug)"
                class="card-select-checkbox"
              />
              <InfoCard
                variant="default"
                layout="kb"
                :title="formatExtensionCardTitle(skill.name)"
                :subtitle="skill.slug"
                :description="skill.description || t('knowledgeList.extensions.noDescription')"
                :tags="skillCardTags(skill)"
                :default-icon="getSkillIcon(skill.slug)"
                @click="handleCardClick(skill)"
                :class="{ 'card-clickable-select': isBatchDeleteMode }"
              >
                <template #actions>
                  <button
                    v-if="skill.sourceScope !== 'personal'"
                    type="button"
                    class="skill-enabled-action"
                    :class="{ enabled: skill.enabled !== false }"
                    :disabled="!canManageSkill(skill) || isSkillToggling(skill.slug)"
                    :aria-label="skill.enabled === false ? t('knowledgeList.extensions.skills.enable') : t('knowledgeList.extensions.skills.disable')"
                    @click.stop="handleToggleSkillEnabled(skill)"
                  >
                    <Plus v-if="skill.enabled === false" :size="15" class="action-icon" />
                    <template v-else>
                      <Check :size="15" class="action-icon action-icon-check" />
                      <Minus :size="15" class="action-icon action-icon-minus" />
                    </template>
                  </button>
                </template>
              </InfoCard>
            </template>
          </div>
        </ExtensionCardGrid>
      </template>
    </div>

    <t-dialog
      v-model:visible="skillPreviewVisible"
      attach="body"
      placement="center"
      class="skill-preview-modal"
      :header="false"
      :footer="false"
      :width="680"
      :closable="false"
      :close-btn="false"
      :destroy-on-close="true"
      @close="closeSkillPreview"
    >
      <div v-if="previewSkill" class="skill-preview-panel">
        <div class="skill-preview-header">
          <div class="skill-preview-title-area">
            <div class="skill-preview-icon">
              <component :is="getSkillIcon(previewSkill.slug)" :size="18" />
            </div>
            <div class="skill-preview-title-text">
              <div class="skill-preview-title">
                {{ formatExtensionCardTitle(previewSkill.name) }}
              </div>
              <div class="skill-preview-meta">
                <span>{{
                  sourceTypeLabel(previewSkill.sourceType || previewSkill.source_type)
                }}</span>
                <t-tag v-if="previewSkill.enabled === false" size="small" variant="light-outline" theme="warning" class="wk-chip">
                  {{ t('knowledgeList.extensions.skills.disabled') }}
                </t-tag>
              </div>
            </div>
          </div>
          <div class="skill-preview-actions">
            <t-switch
              v-if="previewSkill.sourceScope !== 'personal'"
              :model-value="previewSkill.enabled !== false"
              :disabled="!canManageSkill(previewSkill) || isSkillToggling(previewSkill.slug)"
              :loading="isSkillToggling(previewSkill.slug)"
              size="small"
              @change="handlePreviewToggle"
            />
          </div>
        </div>

        <div class="skill-preview-body">
          <div v-if="skillPreviewLoading" class="skill-preview-loading">
            <t-loading />
          </div>
          <MarkdownPreview
            v-else-if="skillPreviewMarkdown"
            :content="skillPreviewMarkdown"
            :compact="true"
          />
          <t-empty v-else :description="skillPreviewError || t('knowledgeList.extensions.skills.noSkillMd')" />
        </div>

        <div class="skill-preview-footer">
          <div class="skill-preview-footer-left">
            <t-button
              v-if="canDeletePreviewSkill"
              theme="danger"
              :loading="deletingPreviewSkill"
              @click="confirmDeletePreviewSkill"
            >
              {{ t('knowledgeList.extensions.skills.uninstall') }}
            </t-button>
          </div>
          <div class="skill-preview-footer-right">
            <t-button @click="closeSkillPreview">{{ t('knowledgeList.extensions.close') }}</t-button>
            <t-button
              v-if="previewSkill.sourceScope !== 'personal'"
              theme="primary"
              class="lucide-icon-btn"
              @click="goToPreviewSkillManagement"
            >
              <span>{{ t('knowledgeList.extensions.skills.manage') }}</span>
            </t-button>
          </div>
        </div>
      </div>
    </t-dialog>

    <SkillInstallFlowModal
      :open="installFlowOpen"
      :flow="installFlow"
      @close="closeInstallFlow"
      @completed="handleInstallFlowCompleted"
    >
      <template #selection>
        <div class="remote-install-panel">
          <t-tabs v-model="activeTab" class="install-tabs">
            <!-- Tab 1: 按仓库拉取 -->
            <t-tab-panel value="repo" :label="t('knowledgeList.extensions.skills.pullTab')">
              <div class="tab-content-wrapper">
                <t-form layout="vertical" class="remote-install-form">
                  <div class="repo-input-row">
                    <div class="repo-input-field">
                      <t-input
                        v-model="remoteInstallForm.source"
                        :placeholder="t('knowledgeList.extensions.skills.repoPlaceholder')"
                      >
                        <template #suffix>
                          <t-dropdown
                            trigger="click"
                            placement="bottom-right"
                            :popup-props="{ overlayClassName: 'history-dropdown-menu' }"
                          >
                            <div class="history-trigger-wrapper">
                              <t-tooltip :content="t('knowledgeList.extensions.skills.repoHistory')">
                                <History
                                  :size="14"
                                  class="history-icon-trigger"
                                  :class="{ 'has-history': repoHistory.length > 0 }"
                                />
                              </t-tooltip>
                            </div>
                            <template #dropdown>
                            <t-dropdown-menu>
                              <t-dropdown-item v-if="repoHistory.length === 0" disabled>
                                <span class="history-empty-text">{{ t('knowledgeList.extensions.skills.noHistory') }}</span>
                              </t-dropdown-item>
                              <template v-else>
                                <t-dropdown-item
                                  v-for="item in repoHistory"
                                  :key="item"
                                  :value="item"
                                  @click="handleSelectHistory({ key: item })"
                                >
                                  <div class="history-item-menu-row">
                                    <span class="history-item-text" :title="item">{{
                                      item
                                    }}</span>
                                    <span
                                      class="history-item-del-btn"
                                      @click.stop="deleteHistoryItem(item)"
                                    >
                                      <Trash2 :size="12" />
                                    </span>
                                  </div>
                                </t-dropdown-item>
                                <t-dropdown-item
                                  value="clear-all-history"
                                  divider
                                  class="clear-history-menu-item"
                                  @click="handleSelectHistory({ key: 'clear-all-history' })"
                                >
                                  <div class="clear-history-btn-content">
                                    <Trash2 :size="12" class="clear-icon" />
                                    <span>{{ t('knowledgeList.extensions.skills.clearHistory') }}</span>
                                  </div>
                                </t-dropdown-item>
                              </template>
                            </t-dropdown-menu>
                            </template>
                          </t-dropdown>
                        </template>
                      </t-input>
                    </div>
                    <t-button
                      theme="primary"
                      :loading="listingRemoteSkills"
                      @click="handleListRemoteSkills"
                    >
                      {{ t('knowledgeList.extensions.skills.pullSkills') }}
                    </t-button>
                  </div>
                  <div class="repo-hint-text">
                    {{ t('knowledgeList.extensions.skills.repoHintBefore') }}
                    <a href="https://skills.sh/" target="_blank" rel="noopener noreferrer"
                      >skills.sh</a
                    >
                    {{ t('knowledgeList.extensions.skills.repoHintAfterLink') }}
                    <a href="https://modelscope.cn/skills" target="_blank" rel="noopener noreferrer">{{
                      t('knowledgeList.extensions.skills.repoHintMarket')
                    }}</a>
                    {{ t('knowledgeList.extensions.skills.repoHintAfterMarket') }}
                  </div>

                  <!-- 仓库技能多选列表 -->
                  <div v-if="remoteSkillOptions.length" class="skills-list-section">
                    <template v-if="hasSingleRepoSkill">
                      <div class="single-remote-skill-card">
                        <div class="single-remote-skill-name">{{ singleRepoSkill.name }}</div>
                        <div class="single-remote-skill-meta">
                          {{ singleRepoSkill.description || t('knowledgeList.extensions.noDescription') }}
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="list-operations-bar">
                        <div class="op-buttons">
                          <t-button size="small" variant="text" @click="handleRepoSelectAll"
                            >{{ t('knowledgeList.extensions.skills.selectAll') }}</t-button
                          >
                          <t-button size="small" variant="text" @click="handleRepoSelectInvert"
                            >{{ t('knowledgeList.extensions.skills.invert') }}</t-button
                          >
                          <t-button size="small" variant="text" @click="handleRepoSelectNone"
                            >{{ t('knowledgeList.extensions.skills.clear') }}</t-button
                          >
                        </div>
                        <t-input
                          v-model="repoFilterKeyword"
                          :placeholder="t('knowledgeList.extensions.skills.localFilter')"
                          size="small"
                          style="width: 180px"
                          clearable
                        />
                      </div>
                      <div class="skills-list-viewport">
                        <div class="remote-skills-list-container">
                          <div
                            v-for="item in filteredRepoSkills"
                            :key="item.name"
                            class="remote-skill-row"
                            :class="{ selected: selectedRepoSkills.includes(item.name) }"
                            role="checkbox"
                            tabindex="0"
                            :aria-checked="selectedRepoSkills.includes(item.name)"
                            @click="toggleRepoSkillFromRow(item.name)"
                            @keydown.enter.prevent="toggleRepoSkillFromRow(item.name)"
                            @keydown.space.prevent="toggleRepoSkillFromRow(item.name)"
                          >
                            <t-checkbox
                              class="remote-row-checkbox"
                              :checked="selectedRepoSkills.includes(item.name)"
                              :tabindex="-1"
                              aria-hidden="true"
                            />
                            <div class="remote-skill-row-content">
                              <span class="skill-item-name">{{ item.name }}</span>
                              <span class="skill-item-desc">{{
                                item.description || t('knowledgeList.extensions.noDescription')
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </t-form>
              </div>
            </t-tab-panel>

            <!-- Tab 2: 全局搜索发现 -->
            <t-tab-panel value="search" :label="t('knowledgeList.extensions.skills.searchTab')">
              <div class="tab-content-wrapper">
                <t-form layout="vertical" class="remote-install-form">
                  <div class="repo-input-row">
                    <div class="repo-input-field">
                      <t-input
                        v-model="searchKeyword"
                        :placeholder="t('knowledgeList.extensions.skills.searchPlaceholderRemote')"
                        @enter="handleSearchRemoteSkills"
                      />
                    </div>
                    <t-button
                      theme="primary"
                      :loading="searchingRemoteSkills"
                      @click="handleSearchRemoteSkills"
                    >
                      {{ t('knowledgeList.extensions.skills.findSkills') }}
                    </t-button>
                  </div>
                  <div class="repo-hint-text">
                    {{ t('knowledgeList.extensions.skills.searchHint') }}
                  </div>

                  <!-- 搜索结果列表 -->
                  <div v-if="searchedSkills.length" class="skills-list-section">
                    <template v-if="hasSingleSearchedSkill">
                      <div class="single-remote-skill-card">
                        <div class="single-remote-skill-header">
                          <div class="single-remote-skill-name">
                            {{ singleSearchedSkill.name }}
                          </div>
                          <t-tag v-if="singleSearchedSkill.installs" size="small" variant="light-outline" class="wk-chip skill-item-installs">
                            {{ singleSearchedSkill.installs }}
                          </t-tag>
                        </div>
                        <div class="single-remote-skill-meta">
                          {{ singleSearchedSkill.source }}
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="list-operations-bar">
                        <div class="op-buttons">
                          <t-button size="small" variant="text" @click="handleSearchSelectAll"
                            >{{ t('knowledgeList.extensions.skills.selectAll') }}</t-button
                          >
                          <t-button size="small" variant="text" @click="handleSearchSelectInvert"
                            >{{ t('knowledgeList.extensions.skills.invert') }}</t-button
                          >
                          <t-button size="small" variant="text" @click="handleSearchSelectNone"
                            >{{ t('knowledgeList.extensions.skills.clear') }}</t-button
                          >
                        </div>
                      </div>
                      <div class="skills-list-viewport">
                        <div class="remote-skills-list-container">
                          <div
                            v-for="item in searchedSkills"
                            :key="`${item.source}:${item.name}`"
                            class="remote-skill-row"
                            :class="{ selected: isSearchSkillSelected(item) }"
                            role="checkbox"
                            tabindex="0"
                            :aria-checked="isSearchSkillSelected(item)"
                            @click="toggleSearchSkillFromRow(item)"
                            @keydown.enter.prevent="toggleSearchSkillFromRow(item)"
                            @keydown.space.prevent="toggleSearchSkillFromRow(item)"
                          >
                            <t-checkbox
                              class="remote-row-checkbox"
                              :checked="isSearchSkillSelected(item)"
                              :tabindex="-1"
                              aria-hidden="true"
                            />
                            <div class="remote-skill-row-content">
                              <span class="skill-item-name">{{ item.name }}</span>
                              <span class="skill-item-desc">{{ item.source }}</span>
                            </div>
                            <span v-if="item.installs" class="skill-install-count">
                              {{ item.installs }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </t-form>
              </div>
            </t-tab-panel>
          </t-tabs>
        </div>
      </template>

      <template #selection-footer>
        <span class="modal-footer-summary">{{ remoteSelectionSummary }}</span>
        <div class="modal-footer-buttons">
          <t-button @click="closeInstallFlow">{{ t('knowledgeList.extensions.cancel') }}</t-button>
          <t-button
            theme="primary"
            :disabled="
              activeTab === 'repo'
                ? selectedRepoSkills.length === 0
                : selectedSearchSkills.length === 0
            "
            @click="startInstallRemoteSkills"
          >
            {{ t('knowledgeList.extensions.skills.confirmParse') }}
          </t-button>
        </div>
      </template>
    </SkillInstallFlowModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import {
  Upload,
  Computer,
  WandSparkles,
  History,
  Trash2,
  Check,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-vue-next'
import { skillApi } from '@/api/runtime/skill'
import ExtensionCardGrid from '@harness/components/extensions/ExtensionCardGrid.vue'
import SkillInstallFlowModal from './SkillInstallFlowModal.vue'
import SkillSuiteCard from './SkillSuiteCard.vue'
import InfoCard from '@harness/components/shared/InfoCard.vue'
import PageShoulder from '@harness/components/shared/PageShoulder.vue'
import MarkdownPreview from '@harness/components/common/MarkdownPreview.vue'
import { formatExtensionCardTitle } from '@harness/utils/extensionDisplayName'
import { getShareConfigLabel } from '@harness/utils/shareConfig'
import { getSkillIcon } from '@harness/utils/skill_icon_utils'

const { t } = useI18n()

const emit = defineEmits(['loading-change'])

const recommendedSuites = computed(() => [
  {
    id: 'anthropic-documents',
    name: t('knowledgeList.extensions.skills.suite.anthropicName'),
    provider: 'Anthropic',
    description: t('knowledgeList.extensions.skills.suite.anthropicDesc'),
    source: 'anthropics/skills',
    skills: [
      {
        slug: 'pdf',
        name: 'PDF',
        description: t('knowledgeList.extensions.skills.suite.pdfDesc')
      },
      {
        slug: 'docx',
        name: 'Docs',
        description: t('knowledgeList.extensions.skills.suite.docxDesc')
      },
      {
        slug: 'xlsx',
        name: 'XLSX',
        description: t('knowledgeList.extensions.skills.suite.xlsxDesc')
      },
      {
        slug: 'pptx',
        name: 'PPTX',
        description: t('knowledgeList.extensions.skills.suite.pptxDesc')
      }
    ]
  }
])
const router = useRouter()

const loading = ref(false)
const skillFileInput = ref(null)
const importing = ref(false)
const listingRemoteSkills = ref(false)
const searchQuery = ref('')

const isBatchDeleteMode = ref(false)
const selectedCardSlugs = ref([])
const togglingSkillSlugs = ref([])

const skills = ref([])
const skillPreviewVisible = ref(false)
const previewSkill = ref(null)
const skillPreviewMarkdown = ref('')
const skillPreviewLoading = ref(false)
const skillPreviewError = ref('')
const deletingPreviewSkill = ref(false)
let previewRequestSeq = 0
const installFlowOpen = ref(false)
const installFlow = ref(null)

const activeTab = ref('repo') // 'repo' 或 'search'

const remoteInstallForm = reactive({
  source: 'https://github.com/anthropics/skills',
  skills: []
})
const remoteSkillOptions = ref([])
const repoFilterKeyword = ref('')
const selectedRepoSkills = ref([])
const hasSingleRepoSkill = computed(() => remoteSkillOptions.value.length === 1)
const singleRepoSkill = computed(() => remoteSkillOptions.value[0] || null)

const searchKeyword = ref('')
const searchingRemoteSkills = ref(false)
const searchedSkills = ref([])
const selectedSearchSkills = ref([])
const hasSingleSearchedSkill = computed(() => searchedSkills.value.length === 1)
const singleSearchedSkill = computed(() => searchedSkills.value[0] || null)
const remoteSelectionSummary = computed(() => {
  if (activeTab.value === 'repo') {
    if (!remoteSkillOptions.value.length) return t('knowledgeList.extensions.skills.pickRepoFirst')
    return t('knowledgeList.extensions.skills.repoSelected', {
      selected: selectedRepoSkills.value.length,
      total: remoteSkillOptions.value.length
    })
  }

  if (!searchedSkills.value.length) return t('knowledgeList.extensions.skills.typeKeywordFirst')
  return t('knowledgeList.extensions.skills.searchSelected', {
    selected: selectedSearchSkills.value.length,
    total: searchedSkills.value.length
  })
})

const repoHistory = ref([])

watch(loading, (v) => emit('loading-change', v), { immediate: true })

const matchesSearch = (skill) => {
  if (!searchQuery.value) return true
  const q = searchQuery.value.toLowerCase()
  const text = [
    skill.name,
    skill.slug,
    skill.description,
    ...(skill.skills || []).flatMap((item) => [item.name, item.slug, item.description])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return text.includes(q)
}

const installedSkillCards = computed(() =>
  (skills.value || []).map((skill) => ({
    ...skill,
    sourceType: skill.source_type || 'upload',
    sourceScope: skill.source_scope
  }))
)

const installedPersonalSkillKeys = computed(() => {
  const keys = new Set()
  installedSkillCards.value.forEach((skill) => {
    if (skill.sourceScope !== 'personal') return
    const identifiers = [skill.slug, skill.name]
    identifiers.forEach((value) => {
      if (value) keys.add(String(value).toLowerCase())
    })
  })
  return keys
})

const recommendedSuiteCards = computed(() =>
  recommendedSuites.value.map((suite) => ({ ...suite, isSuite: true }))
)

const filteredInstalledSkills = computed(() => installedSkillCards.value.filter(matchesSearch))
const skillGroups = computed(() => [
  {
    key: 'recommended',
    title: t('knowledgeList.extensions.skills.groupRecommended'),
    skills: isBatchDeleteMode.value ? [] : recommendedSuiteCards.value.filter(matchesSearch)
  },
  {
    key: 'personal',
    title: t('knowledgeList.extensions.skills.groupPersonal'),
    skills: isBatchDeleteMode.value
      ? []
      : filteredInstalledSkills.value.filter((skill) => skill.sourceScope === 'personal')
  },
  {
    key: 'builtin',
    title: t('knowledgeList.extensions.skills.groupBuiltin'),
    skills: filteredInstalledSkills.value.filter((skill) => skill.sourceType === 'builtin')
  },
  {
    key: 'uploaded',
    title: t('knowledgeList.extensions.skills.groupShared'),
    skills: filteredInstalledSkills.value.filter(
      (skill) => skill.sourceType !== 'builtin' && skill.sourceScope !== 'personal'
    )
  }
])
const visibleSkillGroups = computed(() => skillGroups.value.filter((group) => group.skills.length))
const collapsedSkillSections = ref(new Set())
const isSkillSectionCollapsed = (key) => collapsedSkillSections.value.has(key)
const toggleSkillSection = (key) => {
  const next = new Set(collapsedSkillSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedSkillSections.value = next
}
const filteredDeletableSkills = computed(() =>
  filteredInstalledSkills.value.filter(
    (skill) =>
      canManageSkill(skill) && skill.sourceType !== 'builtin' && skill.sourceScope !== 'personal'
  )
)
const canDeletePreviewSkill = computed(
  () =>
    !!previewSkill.value &&
    canManageSkill(previewSkill.value) &&
    previewSkill.value.sourceType !== 'builtin'
)

// 仓库拉取的技能列表过滤
const filteredRepoSkills = computed(() => {
  if (!repoFilterKeyword.value.trim()) return remoteSkillOptions.value
  const kw = repoFilterKeyword.value.trim().toLowerCase()
  return remoteSkillOptions.value.filter(
    (item) =>
      item.name.toLowerCase().includes(kw) ||
      (item.description && item.description.toLowerCase().includes(kw))
  )
})

// 批量选择/反选/清空管理
const handleRepoSelectAll = () => {
  selectedRepoSkills.value = filteredRepoSkills.value.map((item) => item.name)
}
const handleRepoSelectNone = () => {
  selectedRepoSkills.value = []
}
const handleRepoSelectInvert = () => {
  const currentSelected = new Set(selectedRepoSkills.value)
  const newSelected = []
  filteredRepoSkills.value.forEach((item) => {
    if (!currentSelected.has(item.name)) {
      newSelected.push(item.name)
    }
  })
  selectedRepoSkills.value = newSelected
}

const handleSearchSelectAll = () => {
  selectedSearchSkills.value = [...searchedSkills.value]
}
const handleSearchSelectNone = () => {
  selectedSearchSkills.value = []
}
const handleSearchSelectInvert = () => {
  const newSelected = []
  searchedSkills.value.forEach((item) => {
    const isSelected = selectedSearchSkills.value.some(
      (s) => s.name === item.name && s.source === item.source
    )
    if (!isSelected) {
      newSelected.push(item)
    }
  })
  selectedSearchSkills.value = newSelected
}

const handleToggleRepoSkill = (name, checked) => {
  if (checked) {
    if (!selectedRepoSkills.value.includes(name)) {
      selectedRepoSkills.value.push(name)
    }
  } else {
    selectedRepoSkills.value = selectedRepoSkills.value.filter((n) => n !== name)
  }
}

const toggleRepoSkillFromRow = (name) => {
  handleToggleRepoSkill(name, !selectedRepoSkills.value.includes(name))
}

const isSearchSkillSelected = (item) =>
  selectedSearchSkills.value.some(
    (skill) => skill.name === item.name && skill.source === item.source
  )

const handleToggleSearchSkill = (item, checked) => {
  if (checked) {
    const isExist = selectedSearchSkills.value.some(
      (s) => s.name === item.name && s.source === item.source
    )
    if (!isExist) {
      selectedSearchSkills.value.push(item)
    }
  } else {
    selectedSearchSkills.value = selectedSearchSkills.value.filter(
      (s) => !(s.name === item.name && s.source === item.source)
    )
  }
}

const toggleSearchSkillFromRow = (item) => {
  handleToggleSearchSkill(item, !isSearchSkillSelected(item))
}

const sourceTypeLabel = (sourceType) => {
  if (sourceType === 'personal') return t('knowledgeList.extensions.skills.sourcePersonal')
  if (sourceType === 'builtin') return t('knowledgeList.extensions.skills.sourceBuiltin')
  if (sourceType === 'remote') return t('knowledgeList.extensions.skills.sourceRemote')
  return t('knowledgeList.extensions.skills.sourceUpload')
}

/** 返回 Skill 共享范围的简短展示文案。 */
const getSkillShareLabel = (skill) => getShareConfigLabel(skill?.share_config, t)

const skillCardTags = (skill) => {
  if (skill.sourceScope === 'personal') {
    return [
      { name: t('knowledgeList.extensions.skills.sourcePersonal'), color: 'gray' },
      ...(skill.overrides_shared ? [{ name: t('knowledgeList.extensions.skills.tagOverrideShared'), color: 'orange' }] : [])
    ]
  }
  return [
    { name: getSkillShareLabel(skill), color: 'gray' },
    ...(skill.shadowed_by_personal ? [{ name: t('knowledgeList.extensions.skills.tagShadowed'), color: 'orange' }] : [])
  ]
}

const canManageSkill = (skill) => skill?.can_manage !== false
const isSkillToggling = (slug) => togglingSkillSlugs.value.includes(slug)
const navigateToDetail = (skill) => {
  if (skill?.sourceScope === 'personal') return
  router.push({ path: `/platform/skills/${encodeURIComponent(skill.slug)}` })
}

const closeSkillPreview = () => {
  skillPreviewVisible.value = false
}

const openSkillPreview = async (skill) => {
  if (!skill?.slug) return
  const requestSeq = ++previewRequestSeq
  previewSkill.value = skill
  skillPreviewMarkdown.value = ''
  skillPreviewError.value = ''
  skillPreviewLoading.value = true
  skillPreviewVisible.value = true
  try {
    const result =
      skill.sourceScope === 'personal'
        ? await skillApi.getPersonalSkillFile(skill.slug, 'SKILL.md')
        : await skillApi.getSkillFile(skill.slug, 'SKILL.md')
    if (requestSeq !== previewRequestSeq || previewSkill.value?.slug !== skill.slug) return
    skillPreviewMarkdown.value = result?.data?.content || ''
  } catch (error) {
    if (requestSeq !== previewRequestSeq || previewSkill.value?.slug !== skill.slug) return
    skillPreviewError.value = error?.response?.data?.detail || error.message || t('knowledgeList.extensions.skills.readFailed')
  } finally {
    if (requestSeq === previewRequestSeq) skillPreviewLoading.value = false
  }
}

const goToPreviewSkillManagement = () => {
  if (!previewSkill.value) return
  navigateToDetail(previewSkill.value)
  closeSkillPreview()
}

const handleCardClick = (skill) => {
  if (isBatchDeleteMode.value) {
    handleToggleCardSelect(skill.slug)
  } else {
    openSkillPreview(skill)
  }
}

const handleToggleCardSelect = (slug) => {
  const target = installedSkillCards.value.find(
    (skill) => skill.slug === slug && skill.sourceScope !== 'personal'
  )
  if (!canManageSkill(target) || target?.sourceType === 'builtin') return
  const idx = selectedCardSlugs.value.indexOf(slug)
  if (idx > -1) {
    selectedCardSlugs.value.splice(idx, 1)
  } else {
    selectedCardSlugs.value.push(slug)
  }
}

const handleToggleSkillEnabled = async (skill) => {
  if (!skill || !canManageSkill(skill) || isSkillToggling(skill.slug)) return
  const enabled = skill.enabled === false
  togglingSkillSlugs.value.push(skill.slug)
  try {
    const result = await skillApi.updateSkillEnabled(skill.slug, enabled)
    const updatedSkill = result?.data
    const index = skills.value.findIndex(
      (item) => item.slug === skill.slug && item.source_scope !== 'personal'
    )
    if (updatedSkill && index > -1) {
      skills.value[index] = updatedSkill
    } else {
      await fetchSkills()
    }
    if (previewSkill.value?.slug === skill.slug) {
      previewSkill.value = updatedSkill
        ? { ...updatedSkill, sourceType: updatedSkill.source_type || 'upload' }
        : { ...previewSkill.value, enabled }
    }
    MessagePlugin.success(t(enabled ? 'knowledgeList.extensions.skills.enabled' : 'knowledgeList.extensions.skills.disabledOk'))
  } catch (error) {
    MessagePlugin.error(error?.response?.data?.detail || error.message || t('knowledgeList.extensions.skills.toggleFailed'))
  } finally {
    togglingSkillSlugs.value = togglingSkillSlugs.value.filter((slug) => slug !== skill.slug)
  }
}

const handlePreviewToggle = () => {
  if (!previewSkill.value) return
  handleToggleSkillEnabled(previewSkill.value)
}

const confirmDeletePreviewSkill = () => {
  const target = previewSkill.value
  if (!target || !canDeletePreviewSkill.value || deletingPreviewSkill.value) return

  const dialog = DialogPlugin.confirm({
    attach: 'body',
    placement: 'center',
    header: t('knowledgeList.extensions.skills.uninstallTitle', { name: target.name || target.slug }),
    body:
      target.sourceScope === 'personal'
        ? t('knowledgeList.extensions.skills.uninstallPersonalHint')
        : t('knowledgeList.extensions.skills.uninstallSharedHint'),
    confirmBtn: { content: t('knowledgeList.extensions.skills.uninstall'), theme: 'danger' },
    cancelBtn: t('knowledgeList.extensions.cancel'),
    onConfirm: async () => {
      try {
        deletingPreviewSkill.value = true
        if (target.sourceScope === 'personal') {
          await skillApi.deletePersonalSkill(target.slug)
        } else {
          await skillApi.deleteSkill(target.slug)
        }
        MessagePlugin.success(t('knowledgeList.extensions.skills.uninstalled'))
        closeSkillPreview()
        previewSkill.value = null
        await fetchSkills()
      } catch (error) {
        MessagePlugin.error(error?.response?.data?.detail || error.message || t('knowledgeList.extensions.skills.uninstallFailed'))
      } finally {
        deletingPreviewSkill.value = false
        dialog.hide()
      }
    }
  })
}

const handleBatchSelectAll = () => {
  selectedCardSlugs.value = filteredDeletableSkills.value.map((skill) => skill.slug)
}

const handleBatchSelectNone = () => {
  selectedCardSlugs.value = []
}

const handleBatchSelectInvert = () => {
  const currentSet = new Set(selectedCardSlugs.value)
  selectedCardSlugs.value = filteredDeletableSkills.value
    .filter((skill) => !currentSet.has(skill.slug))
    .map((skill) => skill.slug)
}

const exitBatchDeleteMode = () => {
  isBatchDeleteMode.value = false
  selectedCardSlugs.value = []
}

const handleBatchDelete = () => {
  const deletableSlugs = selectedCardSlugs.value.filter((slug) => {
    const target = installedSkillCards.value.find(
      (skill) => skill.slug === slug && skill.sourceScope !== 'personal'
    )
    return (
      canManageSkill(target) &&
      target?.sourceType !== 'builtin' &&
      target?.sourceScope !== 'personal'
    )
  })
  if (deletableSlugs.length === 0) return

  const dialog = DialogPlugin.confirm({
    attach: 'body',
    placement: 'center',
    header: t('knowledgeList.extensions.skills.batchDeleteTitle'),
    body: t('knowledgeList.extensions.skills.batchDeleteContent', { count: deletableSlugs.length }),
    confirmBtn: { content: t('knowledgeList.extensions.skills.batchDeleteOk'), theme: 'danger' },
    cancelBtn: t('knowledgeList.extensions.cancel'),
    onConfirm: async () => {
      try {
        loading.value = true
        const res = await skillApi.deleteSkillsBatch(deletableSlugs)
        const results = res?.data || []
        const successList = results.filter((r) => r.success)
        const failList = results.filter((r) => !r.success)

        if (failList.length === 0) {
          MessagePlugin.success(t('knowledgeList.extensions.skills.batchDeleteSuccess', { count: successList.length }))
        } else {
          MessagePlugin.warning(t('knowledgeList.extensions.skills.batchDeletePartial', { success: successList.length, fail: failList.length }))
        }

        exitBatchDeleteMode()
        await fetchSkills()
      } catch (error) {
        MessagePlugin.error(error?.response?.data?.detail || error.message || t('knowledgeList.extensions.skills.batchDeleteFailed'))
      } finally {
        loading.value = false
        dialog.hide()
      }
    }
  })
}

const fetchSkills = async ({ refreshPersonal = false } = {}) => {
  loading.value = true
  try {
    const skillResult = await skillApi.listSkillCards({ refreshPersonal })
    skills.value = skillResult?.data || []
  } catch {
    MessagePlugin.error(t('knowledgeList.extensions.skills.loadFailed'))
  } finally {
    loading.value = false
  }
}

const beforeSkillUpload = (file) => {
  const lower = file.name.toLowerCase()
  if (!lower.endsWith('.zip') && lower !== 'skill.md') {
    MessagePlugin.error(t('knowledgeList.extensions.skills.uploadType'))
    return false
  }
  return true
}

const onSkillFileChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (beforeSkillUpload(file) === false) return
  await handleImportUpload({ file })
}

const openInstallFlow = (flow) => {
  installFlow.value = flow
  installFlowOpen.value = true
}

const resetRemoteSelection = () => {
  selectedRepoSkills.value = []
  selectedSearchSkills.value = []
  remoteSkillOptions.value = []
  searchedSkills.value = []
  repoFilterKeyword.value = ''
  searchKeyword.value = ''
}

const closeInstallFlow = () => {
  const wasRemoteFlow = installFlow.value?.kind === 'remote'
  installFlowOpen.value = false
  installFlow.value = null
  if (wasRemoteFlow) resetRemoteSelection()
}

const openRecommendedSuite = (suite) => {
  openInstallFlow({
    kind: 'suite',
    suite,
    installedSlugs: [...installedPersonalSkillKeys.value]
  })
}

const handleInstallFlowCompleted = async ({ success, failed }) => {
  if (failed === 0) MessagePlugin.success(t('knowledgeList.extensions.skills.addedCount', { count: success }))
  else MessagePlugin.warning(t('knowledgeList.extensions.skills.installPartial', { success, failed }))
  await fetchSkills()
}

const handleImportUpload = async ({ file, onSuccess, onError }) => {
  importing.value = true
  try {
    const result = await skillApi.prepareSkillUpload(file)
    openInstallFlow({
      kind: 'draft',
      title: t('knowledgeList.extensions.skills.installFile', { name: file.name }),
      description: t('knowledgeList.extensions.skills.installFileDesc'),
      drafts: [result?.data]
    })
    onSuccess?.(result)
  } catch (e) {
    MessagePlugin.error(e?.response?.data?.detail || e.message || t('knowledgeList.extensions.skills.parseFailed'))
    onError?.(e)
  } finally {
    importing.value = false
  }
}

const handleOpenRemoteInstall = () => {
  resetRemoteSelection()
  openInstallFlow({
    kind: 'remote',
    title: t('knowledgeList.extensions.skills.remoteTitle'),
    description: t('knowledgeList.extensions.skills.remoteDesc')
  })
}

const rememberRemoteSource = (source) => {
  let history = [...repoHistory.value]
  history = history.filter((item) => item !== source)
  history.unshift(source)
  if (history.length > 10) {
    history = history.slice(0, 10)
  }
  repoHistory.value = history
  localStorage.setItem('yuxi_remote_repo_history', JSON.stringify(history))
}

const handleListRemoteSkills = async () => {
  const source = remoteInstallForm.source.trim()
  if (!source) {
    MessagePlugin.warning(t('knowledgeList.extensions.skills.remoteNeedSource'))
    return
  }
  listingRemoteSkills.value = true
  try {
    const result = await skillApi.listRemoteSkills(source)
    remoteSkillOptions.value = result?.data || []
    selectedRepoSkills.value =
      remoteSkillOptions.value.length === 1 ? [remoteSkillOptions.value[0].name] : []
    if (!remoteSkillOptions.value.length) {
      MessagePlugin.warning(t('knowledgeList.extensions.skills.remoteNone'))
      return
    }
    if (remoteSkillOptions.value.length === 1) {
      MessagePlugin.success(t('knowledgeList.extensions.skills.remoteFoundOne'))
    } else {
      MessagePlugin.success(t('knowledgeList.extensions.skills.remoteFoundMany', { count: remoteSkillOptions.value.length }))
    }

    rememberRemoteSource(source)
  } catch (error) {
    MessagePlugin.error(error?.response?.data?.detail || error.message || t('knowledgeList.extensions.skills.remoteFetchFailed'))
  } finally {
    listingRemoteSkills.value = false
  }
}

const loadHistory = () => {
  try {
    const raw = localStorage.getItem('yuxi_remote_repo_history')
    if (raw) {
      repoHistory.value = JSON.parse(raw)
    }
  } catch (e) {
    console.error('Failed to load repo history', e)
  }
}

const deleteHistoryItem = (item) => {
  repoHistory.value = repoHistory.value.filter((h) => h !== item)
  localStorage.setItem('yuxi_remote_repo_history', JSON.stringify(repoHistory.value))
}

const clearAllHistory = () => {
  repoHistory.value = []
  localStorage.removeItem('yuxi_remote_repo_history')
  MessagePlugin.success(t('knowledgeList.extensions.skills.historyCleared'))
}

const handleSelectHistory = ({ key }) => {
  if (key === 'clear-all-history') {
    clearAllHistory()
    return
  }
  remoteInstallForm.source = key
}

const handleSearchRemoteSkills = async () => {
  const query = searchKeyword.value.trim()
  if (!query) {
    MessagePlugin.warning(t('knowledgeList.extensions.skills.needKeyword'))
    return
  }
  searchingRemoteSkills.value = true
  try {
    const result = await skillApi.searchRemoteSkills(query)
    searchedSkills.value = result?.data || []
    selectedSearchSkills.value = searchedSkills.value.length === 1 ? [...searchedSkills.value] : []
    if (!searchedSkills.value.length) {
      MessagePlugin.warning(t('knowledgeList.extensions.skills.searchNone'))
    } else if (searchedSkills.value.length === 1) {
      MessagePlugin.success(t('knowledgeList.extensions.skills.searchFoundOne'))
    } else {
      MessagePlugin.success(t('knowledgeList.extensions.skills.searchFoundMany', { count: searchedSkills.value.length }))
    }
  } catch (error) {
    MessagePlugin.error(error?.response?.data?.detail || error.message || t('knowledgeList.extensions.skills.searchFailed'))
  } finally {
    searchingRemoteSkills.value = false
  }
}

const startInstallRemoteSkills = () => {
  const requests = []
  if (activeTab.value === 'repo') {
    requests.push({
      source: remoteInstallForm.source.trim(),
      skills: [...selectedRepoSkills.value],
      skillDetails: remoteSkillOptions.value
        .filter((item) => selectedRepoSkills.value.includes(item.name))
        .map((item) => ({ ...item, slug: item.name }))
    })
  } else {
    const groups = new Map()
    selectedSearchSkills.value.forEach((item) => {
      if (!groups.has(item.source)) groups.set(item.source, [])
      groups.get(item.source).push(item)
    })
    groups.forEach((items, source) => {
      requests.push({
        source,
        skills: items.map((item) => item.name),
        skillDetails: items.map((item) => ({ ...item, slug: item.name }))
      })
    })
  }

  openInstallFlow({
    kind: 'remote',
    title: t('knowledgeList.extensions.skills.remoteTitle'),
    description: t('knowledgeList.extensions.skills.remoteSummary', {
      sources: requests.length,
      count: requests.reduce((total, item) => total + item.skills.length, 0)
    }),
    requests
  })
}

watch(activeTab, () => {
  selectedRepoSkills.value = []
  selectedSearchSkills.value = []
})

onMounted(() => {
  fetchSkills()
  loadHistory()
})

defineExpose({
  fetchSkills,
  handleImportUpload,
  openRemoteInstallModal: handleOpenRemoteInstall,
  loading
})
</script>

<style lang="less" scoped>
@import '@harness/assets/css/extensions.less';
</style>

<style lang="less" scoped>
.skill-empty-state {
  width: 100%;
  min-height: 280px;
  padding: 40px var(--page-padding);
}

.skill-empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 220px;
  flex-direction: column;
  border: 1px dashed var(--gray-150);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--gray-0) 0%, var(--gray-25) 100%);
  color: var(--gray-500);
  text-align: center;
}

.skill-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: var(--gray-50);
  color: var(--gray-600);
}

.skill-empty-title {
  color: var(--gray-800);
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}

.skill-empty-desc {
  margin-top: 4px;
  color: var(--gray-500);
  font-size: 13px;
  line-height: 20px;
}

.card-wrapper {
  position: relative;

  :deep(.info-card-mini-desc) {
    display: -webkit-box;
    min-height: 36px;
    color: var(--gray-700);
    white-space: normal;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  :deep(.info-card-mini .info-card-icon) {
    align-self: flex-start;
  }

  &.batch-mode {
    :deep(.info-card) {
      cursor: pointer;
      border-color: var(--gray-200);

      &:hover {
        border-color: var(--td-brand-color);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--td-brand-color) 12%, transparent);
      }
    }

    :deep(.info-card-status),
    :deep(.info-card-mini-action) {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    :deep(.info-card-mini .info-card-info) {
      padding-right: 28px;
    }
  }

  &.selected {
    :deep(.info-card) {
      border-color: var(--td-brand-color, var(--main-color)) !important;
      box-shadow: 0 4px 12px rgba(7, 192, 95, 0.12);
    }
  }

  .card-select-checkbox {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
  }
}

.skill-enabled-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
  color: var(--gray-600);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover,
  &:focus {
    outline: none;
    border-color: var(--gray-300);
    background: var(--gray-50);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &.loading:disabled {
    cursor: wait;
    opacity: 1;
  }

  &.enabled {
    color: var(--color-success-700);

    .action-icon-minus {
      display: none;
    }

    &:hover,
    &:focus {
      border-color: var(--color-error-200, #ffccc7);
      background: var(--color-error-50, #fff2f0);
      color: var(--color-error-700, #cf1322);

      .action-icon-check {
        display: none;
      }

      .action-icon-minus {
        display: block;
      }
    }
  }
}

.action-icon {
  flex-shrink: 0;
}

.skill-preview-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.skill-preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.skill-preview-title-area {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.skill-preview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--gray-50);
  color: var(--gray-600);
}

.skill-preview-title-text {
  min-width: 0;
}

.skill-preview-title {
  overflow: hidden;
  color: var(--gray-900);
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-preview-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 18px;
}

.skill-preview-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  padding-top: 2px;
}

.skill-preview-body {
  min-height: 260px;
  max-height: min(56vh, 520px);
  padding: 14px 16px;
  overflow-y: auto;
  border: 1px solid var(--gray-150);
  border-radius: 12px;
  background: var(--gray-25);

  :deep(.yk-markdown-preview) {
    background: transparent;
  }
}

.skill-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.skill-preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.skill-preview-footer-left,
.skill-preview-footer-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.remote-install-panel {
  :deep(.install-tabs > .t-tabs__nav) {
    justify-content: center;
  }

  .repo-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;

    .repo-input-field {
      flex: 1;
      min-width: 0;
    }
  }

  .history-trigger-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    cursor: pointer;
    outline: none;
    margin-right: -4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--gray-100);
    }

    &:focus,
    &:focus-visible {
      outline: none;
    }
  }

  .history-icon-trigger {
    color: var(--gray-400);
    transition: color 0.2s ease;
    outline: none;

    &:hover {
      color: var(--gray-700);
    }

    &.has-history {
      color: var(--gray-500);

      &:hover {
        color: var(--gray-700);
      }
    }
  }

  .repo-hint-text {
    font-size: 12px;
    color: var(--gray-400);
    margin-bottom: 12px;
    line-height: 1.4;

    a {
      color: var(--gray-700);
      text-decoration: underline;
    }
  }

  .tab-content-wrapper {
    padding: 4px 0 8px 0;
  }

  .skills-list-section {
    margin-top: 12px;
    border: 1px solid var(--gray-150);
    border-radius: 8px;
    overflow: hidden;
    background: var(--gray-0);
  }

  .list-operations-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--gray-150);
    padding: 8px 10px;

    .op-buttons {
      display: flex;
      gap: 2px;

      .t-button {
        padding: 0 4px;
        height: auto;
        font-size: 12px;
        color: var(--gray-600);

        &:hover {
          color: var(--gray-900);
        }
      }
    }
  }

  .skills-list-viewport {
    max-height: min(42vh, 420px);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--gray-0);
  }

  .remote-skills-list-container {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    background: var(--gray-100);
  }

  .remote-skill-row {
    display: flex;
    align-items: center;
    min-height: 46px;
    padding: 6px 10px;
    gap: 8px;
    background: var(--gray-0);
    cursor: pointer;
    transition: background-color 0.18s ease;

    &:hover,
    &.selected {
      background: var(--gray-25);
    }

    &:focus-visible {
      outline: 2px solid var(--gray-400);
      outline-offset: -2px;
    }

    &[aria-disabled='true'] {
      cursor: not-allowed;
    }
  }

  .remote-row-checkbox {
    pointer-events: none;
  }

  .single-remote-skill-card {
    border: 1px solid var(--gray-150);
    border-radius: 6px;
    background: var(--gray-0);
    padding: 12px;
  }

  .single-remote-skill-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;

    .t-tag {
      flex-shrink: 0;
      margin-inline-end: 0;
    }
  }

  .single-remote-skill-name {
    line-height: 20px;
    font-weight: 600;
    color: var(--gray-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .single-remote-skill-meta {
    margin-top: 2px;
    font-size: 12px;
    line-height: 18px;
    color: var(--gray-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remote-skill-row-content {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;

    .skill-item-name {
      font-weight: 600;
      color: var(--gray-900);
    }

    .skill-item-desc {
      display: block;
      font-size: 12px;
      color: var(--gray-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .skill-install-count {
    flex-shrink: 0;
    color: var(--gray-500);
    font-size: 11px;
  }
}

@media (max-width: 600px) {
  .remote-install-panel {
    .skills-list-viewport {
      max-height: 40vh;
      overflow-y: auto;
    }

    .remote-skills-list-container {
      grid-template-columns: 1fr;
    }
  }
}

.modal-footer-summary {
  color: var(--gray-500);
  font-size: 12px;
  line-height: 18px;
}

.modal-footer-buttons {
  display: flex;
  margin-left: auto;
  gap: 8px;
}
</style>

<!-- NOTE: unscoped style block 用于 dropdown overlay 样式穿透 teleport -->
<style lang="less">
/* TDesign Dropdown overlay 通过 teleport 挂载到 body，
   scoped CSS 无法穿透，因此必须使用 unscoped 样式。
   使用 .history-dropdown-menu 作为 overlayClassName 命名空间。 */
.history-dropdown-menu {
  min-width: 280px;

  .t-dropdown__menu {
    padding: 4px;
  }

  .t-dropdown__item {
    padding: 8px 12px;
    border-radius: 6px;

    .t-dropdown__item-text {
      display: flex;
      align-items: center;
      width: 100%;
    }
  }
}

/* 历史记录行：仓库地址 + 删除按钮 */
.history-item-menu-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;

  .history-item-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--gray-800);
    line-height: 1;
  }

  .history-item-del-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--gray-400);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;

    svg {
      display: block;
    }

    &:hover {
      color: var(--color-error-500, #ff4d4f);
      background: var(--color-error-10, rgba(255, 77, 79, 0.1));
    }
  }
}

.history-empty-text {
  color: var(--gray-400);
  font-size: 12px;
}

/* 清空历史记录按钮内容 — 图标在左文字在右，水平居中 */
.clear-history-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-error-500, #ff4d4f);
  font-weight: 500;
  font-size: 13px;
  width: 100%;

  .clear-icon {
    display: flex;
    align-items: center;
  }
}
</style>
