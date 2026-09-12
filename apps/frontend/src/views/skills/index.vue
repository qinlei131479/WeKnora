<template>
  <div class="skills-tools-page layout-container">
    <PageHeader
      :title="t('menu.skillsTools')"
      :subtitle="t('ext.subtitle')"
      :active-key="activeTab"
      :tabs="tabs"
      :loading="listLoading"
      :aria-label="t('menu.skillsTools')"
    >
      <template #actions>
        <div id="extension-page-header-actions" class="extension-page-header-actions" />
      </template>
    </PageHeader>
    <SkillCardList v-if="activeTab === 'skills'" @loading-change="listLoading = $event" />
    <ToolsCardList v-else-if="activeTab === 'tools'" @loading-change="listLoading = $event" />
    <McpCardList v-else-if="activeTab === 'mcp'" @loading-change="listLoading = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/harness/shared/PageHeader.vue'
import SkillCardList from './SkillCardList.vue'
import ToolsCardList from '../tools/ToolsCardList.vue'
import McpCardList from '../mcp/McpCardList.vue'
import { isHiddenKbSurface } from '@/utils/weknoraFeatures'

const { t } = useI18n()
const route = useRoute()
const listLoading = ref(false)

const activeTab = computed(() => {
  if (route.path.startsWith('/platform/tools')) return 'tools'
  if (route.path.startsWith('/platform/mcp')) return 'mcp'
  return 'skills'
})

const tabs = computed(() =>
  [
    { key: 'skills', label: t('ext.tabs.skills'), path: '/platform/skills' },
    { key: 'tools', label: t('ext.tabs.tools'), path: '/platform/tools' },
    { key: 'mcp', label: t('ext.tabs.mcp'), path: '/platform/mcp' },
  ].filter((item) => !isHiddenKbSurface(item.key)),
)
</script>

<style lang="less">
.skills-tools-page {
  --page-padding: 22px;
  --main-800: #027218;
  --main-700: #038626;
  --main-600: #049b38;
  --main-500: #07c05f;
  --main-100: #b7ebc8;
  --main-20: #f7fcf8;
  --main-5: #fcfefd;
  --main-color: #07c05f;
  --shadow-1: rgba(0, 0, 0, 0.05);
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
  --color-success-700: #389e0d;
  --color-error-50: #fff2f0;
  --color-error-200: #ffccc7;
  --color-error-700: #cf1322;
  --bg-sider: #fcfefd;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

html[theme-mode="dark"] .skills-tools-page {
  --main-800: #07c05f;
  --main-700: #07c05f;
  --main-600: #06b04d;
  --main-500: #06b04d;
  --main-100: #015e0d;
  --main-20: #06110a;
  --main-5: var(--td-bg-color-container, #242424);
  --main-color: var(--td-brand-color, #06b04d);
  --shadow-1: rgba(255, 255, 255, 0.05);
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
  --gray-0: var(--td-bg-color-page, #181818);
  --bg-sider: var(--td-bg-color-sidebar, #181818);
}

.skills-tools-page .extension-card-grid {
  padding-top: 8px;
  padding-bottom: 16px;
}

.extension-page-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  &:empty {
    display: none;
  }

  .t-button--variant-outline {
    background: var(--gray-0);
  }
}

@media (min-width: 1440px) {
  .skills-tools-page {
    --page-padding: 30px;
  }
}

@media (max-width: 1199px) {
  .skills-tools-page {
    --page-padding: 18px;
  }
}

@media (max-width: 767px) {
  .skills-tools-page {
    --page-padding: 14px;
  }
}
</style>
