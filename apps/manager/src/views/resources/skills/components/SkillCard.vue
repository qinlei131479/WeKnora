<template>
  <el-card shadow="hover" class="skill-card">
    <div class="card-header">
      <div class="tag-line">
        <el-tag type="primary" effect="light" round>
          {{ categoryLabel }}
        </el-tag>
        <el-tag type="info" effect="plain" round>
          {{ domainLabel }}
        </el-tag>
        <el-tag :type="currentStatusMeta.type" effect="light" round>
          {{ currentStatusMeta.label }}
        </el-tag>
      </div>

      <el-dropdown trigger="click" popper-class="skill-card-dropdown" @command="emit('command', $event, skill)">
        <el-button class="card-menu-button" circle text>
          <svg-icon icon-class="more-up" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="skill.status !== 1" command="online">上线</el-dropdown-item>
            <el-dropdown-item v-else command="offline">下线</el-dropdown-item>
            <el-dropdown-item command="delete" class="delete" :disabled="skill.status !== 2">删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="skill-main">
      <div class="skill-name text-ellipsis" :title="skill.name || ''" v-html="getHighlightedText(skill.name)"></div>
      <p class="description-text" :title="skill.description || ''">{{ skill.description || '' }}</p>
    </div>

    <div class="skill-meta">
      <span class="skill-meta-label">版本号：</span>
      <strong class="skill-meta-value text-ellipsis" :title="skill.version || ''">{{ skill.version || '-' }}</strong>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { SkillVO } from '@/types';

const statusMeta: Record<0 | 1 | 2, { label: string; type: 'success' | 'warning' | 'info' }> = {
  0: { label: '部署中', type: 'warning' },
  1: { label: '已上线', type: 'success' },
  2: { label: '已下线', type: 'info' }
};

const props = defineProps<{
  skill: SkillVO;
  categoryLabel: string;
  keyword?: string;
}>();

const emit = defineEmits<{
  command: [command: string | number | object, skill: SkillVO];
}>();

const domainLabel = computed(() => props.skill.domain?.trim() || '公共领域');
const currentStatusMeta = computed(() => statusMeta[(props.skill.status ?? 0) as 0 | 1 | 2] || statusMeta[0]);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entityMap[char];
  });

const getHighlightedText = (value?: string) => {
  const text = value || '';
  const keyword = props.keyword?.trim();
  if (!keyword) return escapeHtml(text);

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escapedKeyword, 'gi');
  let html = '';
  let lastIndex = 0;

  for (const match of text.matchAll(matcher)) {
    const index = match.index ?? 0;
    html += escapeHtml(text.slice(lastIndex, index));
    html += `<mark class="keyword-highlight">${escapeHtml(match[0])}</mark>`;
    lastIndex = index + match[0].length;
  }

  return html + escapeHtml(text.slice(lastIndex));
};
</script>

<style lang="scss" scoped>
.skill-card {
  border-width: 0;
  border-radius: 24px;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    padding: 24px !important;
  }
}

.card-header,
.tag-line,
.skill-meta {
  display: flex;
  align-items: center;
}

.card-header {
  min-width: 0;
  justify-content: space-between;
}

.tag-line {
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  gap: 12px;
  overflow: hidden;

  :deep(.el-tag) {
    min-width: 0;
    flex: 0 1 auto;
  }

  :deep(.el-tag__content) {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-menu-button {
  width: 24px;
  height: 24px;
  flex: none;
  padding: 0;

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
    margin-right: 0;
  }
}

.skill-main {
  min-width: 0;
  margin-top: 20px;

  .skill-name {
    margin-bottom: 16px;
    color: #2b2f33;
    font-size: 18px;
    font-weight: bold;
  }
}

.description-text {
  display: -webkit-box;
  height: 32px;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #b0bac6;
  font-size: 12px;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.skill-meta {
  min-width: 0;
  margin-top: 20px;
  padding: 12px;
  border: 1px solid #ebf3f5;
  border-radius: 16px;
  background: rgba(235, 243, 245, 0.6);
  font-size: 14px;
}

.skill-meta-label {
  flex: none;
  color: #77838f;
  font-weight: 400;
}

.skill-meta-value {
  color: #2b2f33;
  font-weight: bold;
}

.text-ellipsis {
  display: block;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.keyword-highlight) {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
  font-weight: inherit;
}

:global(.skill-card-dropdown .el-dropdown-menu__item) {
  color: var(--el-color-primary) !important;
  font-size: 12px !important;
  font-weight: 400 !important;
}

:global(.skill-card-dropdown .el-dropdown-menu__item.delete) {
  color: var(--el-text-color-danger) !important;
}

:global(.skill-card-dropdown .el-dropdown-menu__item.is-disabled) {
  color: var(--el-text-color-disabled) !important;
}
</style>
