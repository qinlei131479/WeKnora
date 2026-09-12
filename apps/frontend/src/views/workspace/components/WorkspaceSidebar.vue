<template>
  <aside class="workspace-sidebar">
    <section class="sidebar-section">
      <button
        type="button"
        class="workspace-nav-item"
        :class="{ active: activeKey === 'personal' && !isQuickAccessPath(currentPath) }"
        @click="$emit('select-personal')"
      >
        <FileTypeIcon is-dir :size="18" />
        <span>{{ t('workspacePage.personal') }}</span>
      </button>
    </section>

    <section class="sidebar-section">
      <div class="section-title">{{ t('workspacePage.quickAccess') }}</div>
      <button
        type="button"
        class="workspace-nav-item secondary"
        :class="{
          active: activeKey === 'personal' && isSameOrChildPath(currentPath, savedArtifactsPath)
        }"
        @click="$emit('select-path', savedArtifactsPath)"
      >
        <FileTypeIcon is-dir :size="18" />
        <span>{{ t('workspacePage.savedArtifacts') }}</span>
      </button>
      <button
        type="button"
        class="workspace-nav-item secondary"
        :class="{ active: activeKey === 'personal' && isSameOrChildPath(currentPath, agentsPath) }"
        @click="$emit('select-path', agentsPath)"
      >
        <FileTypeIcon is-dir :size="18" />
        <span>{{ t('workspacePage.agentFiles') }}</span>
      </button>
    </section>

    <section
      v-for="section in knowledgeSections"
      :key="section.key"
      class="sidebar-section"
    >
      <div class="section-title">{{ section.title }}</div>
      <button
        v-for="database in section.items"
        :key="database.kb_id || database.id || database.name"
        type="button"
        class="workspace-nav-item secondary"
        :class="{ active: activeKey === `database:${database.kb_id}` }"
        @click="$emit('select-database', database)"
      >
        <FileTypeIcon is-dir :size="18" />
        <span>{{ database.name }}</span>
      </button>
    </section>

    <section v-if="loadingDatabases" class="sidebar-section">
      <div class="sidebar-muted">{{ t('workspacePage.loadingKnowledge') }}</div>
    </section>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FileTypeIcon from '@/components/harness/common/FileTypeIcon.vue'

const { t } = useI18n()

const savedArtifactsPath = '/saved_artifacts'
const agentsPath = '/agents/'
const quickAccessPaths = [savedArtifactsPath, agentsPath]

const normalizePath = (path) => String(path || '/').replace(/\/$/, '') || '/'
const isSameOrChildPath = (path, targetPath) => {
  const current = normalizePath(path)
  const target = normalizePath(targetPath)
  return current === target || current.startsWith(`${target}/`)
}
const isQuickAccessPath = (path) =>
  quickAccessPaths.some((targetPath) => isSameOrChildPath(path, targetPath))

const props = defineProps({
  activeKey: { type: String, default: 'personal' },
  currentPath: { type: String, default: '/' },
  databases: { type: Array, default: () => [] },
  sharedDatabases: { type: Array, default: () => [] },
  loadingDatabases: { type: Boolean, default: false }
})

const knowledgeSections = computed(() => {
  const sections = []
  if (props.databases.length || !props.sharedDatabases.length) {
    sections.push({ key: 'mine', title: t('workspacePage.myKnowledge'), items: props.databases })
  }
  if (props.sharedDatabases.length) {
    sections.push({
      key: 'shared',
      title: t('workspacePage.sharedKnowledge'),
      items: props.sharedDatabases
    })
  }
  return sections
})

defineEmits(['select-personal', 'select-database', 'select-path'])
</script>

<style scoped lang="less">
.workspace-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 14px 10px 14px calc(var(--page-padding) - 10px);
  border-right: 1px solid var(--gray-100);
  background: var(--bg-sider, var(--gray-25));
  overflow-y: auto;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  // gap: 6px;
}

.section-title {
  padding: 4px 8px;
  color: var(--gray-500);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
}

.workspace-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--gray-600);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;

  span:first-of-type {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  &:hover:not(:disabled),
  &.active {
    border-color: var(--td-brand-color, var(--main-color));
    background: var(--td-brand-color-light, color-mix(in srgb, var(--td-brand-color) 12%, transparent));
    color: var(--td-brand-color, var(--main-600));
  }

  &.secondary {
    min-height: 32px;
    font-size: 13px;
  }
}

.sidebar-muted {
  padding: 6px 8px;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 1.5;
}
</style>
