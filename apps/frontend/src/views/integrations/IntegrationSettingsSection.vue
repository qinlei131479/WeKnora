<template>
  <div class="integrations-settings">
    <div class="integrations-settings__body" :class="{ 'integrations-settings__body--landing': isLandingSection }">
      <div v-if="tab === 'im'" class="section">
        <div class="section-header">
          <h2>{{ $t('agentEditor.im.title') }}</h2>
          <p class="section-description">
            {{ imDescription }}
          </p>
        </div>
        <IMChannelPanel v-model:filter-agent-id="filterAgentId" />
      </div>

      <div v-if="tab === 'embed'" class="section">
        <div class="section-header">
          <h2>{{ $t('agentEditor.embed.title') }}</h2>
          <p class="section-description">{{ $t('agentEditor.embed.description') }}</p>
        </div>
        <AgentEmbedChannelPanel v-model:filter-agent-id="filterAgentId" />
      </div>

      <div v-if="tab === 'api'" class="section">
        <div class="section-header">
          <h2>{{ $t('integrations.api.title') }}</h2>
          <p class="section-description">{{ $t('integrations.api.subtitle') }}</p>
        </div>
        <ApiIntegrationSettings />
      </div>

      <CliIntegrationLanding v-if="tab === 'cli'" />
      <ChromeExtensionLanding v-if="tab === 'chrome'" />
      <ClawSkillLanding v-if="tab === 'claw'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import IMChannelPanel from '@/components/IMChannelPanel.vue'
import AgentEmbedChannelPanel from '@/components/AgentEmbedChannelPanel.vue'
import ApiIntegrationSettings from '@/views/integrations/ApiIntegrationSettings.vue'
import ChromeExtensionLanding from '@/views/integrations/ChromeExtensionLanding.vue'
import ClawSkillLanding from '@/views/integrations/ClawSkillLanding.vue'
import CliIntegrationLanding from '@/views/integrations/CliIntegrationLanding.vue'
import type { IntegrationTab } from '@/config/integrations'
import { getFeatureFlags } from '@/utils/weknoraFeatures'

const { t } = useI18n()
const filterAgentId = ref('')

const props = defineProps<{
  tab: IntegrationTab
}>()

const route = useRoute()

const isLandingSection = computed(
  () => props.tab === 'chrome' || props.tab === 'claw' || props.tab === 'cli',
)

/** hide 模式下平台白名单为企微/飞书/钉钉，描述与可选平台保持一致 */
const imDescription = computed(() =>
  getFeatureFlags().restrictProviderOptions
    ? t('agentEditor.im.descriptionRestricted')
    : t('agentEditor.im.description'),
)

function applyAgentFilterFromRoute() {
  filterAgentId.value = (route.query.agentId as string) || ''
}

watch(
  () => route.query.agentId,
  applyAgentFilterFromRoute,
  { immediate: true },
)
</script>

<style scoped lang="less">
.integrations-settings {
  display: flex;
  flex-direction: column;
}

.integrations-settings__body {
  min-width: 0;
}

.integrations-settings__body--landing {
  max-width: 760px;
}

.section-header {
  margin-bottom: 18px;

  h2 {
    margin: 0 0 6px;
    color: var(--td-text-color-primary);
    font-size: 18px;
    font-weight: 600;
    line-height: 1.35;
  }
}

.section-description {
  margin: 0;
  color: var(--td-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  color: var(--td-brand-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.link-icon {
  font-size: 13px;
}
</style>
