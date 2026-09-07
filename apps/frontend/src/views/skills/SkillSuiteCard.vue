<template>
  <button type="button" class="skill-suite-card" @click="$emit('open', suite)">
    <div class="suite-card-head">
      <div class="suite-card-icon"><Boxes :size="18" /></div>
      <div class="suite-card-title-group">
        <div class="suite-card-title">{{ suite.name }}</div>
        <div class="suite-card-provider">{{ suite.provider }}</div>
      </div>
    </div>

    <p class="suite-card-description">{{ suite.description }}</p>

    <div class="suite-card-members" :aria-label="t('knowledgeList.extensions.skills.suite.membersAria')">
      <t-tag v-for="skill in visibleSkills" :key="skill.slug" size="small" variant="light-outline" class="wk-chip">
        {{ skill.name }}
      </t-tag>
      <t-tag v-if="hiddenCount" size="small" variant="light-outline" class="wk-chip">+{{ hiddenCount }}</t-tag>
    </div>

    <div class="suite-card-footer">
      <span class="suite-card-status">{{ statusText }}</span>
      <span class="suite-card-action">
        {{
          installedCount === suite.skills.length
            ? t('knowledgeList.extensions.skills.suite.viewSuite')
            : t('knowledgeList.extensions.skills.suite.viewAndInstall')
        }}
        <ChevronRight :size="15" />
      </span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Boxes, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  suite: { type: Object, required: true },
  installedSlugs: { type: Array, default: () => [] }
})

defineEmits(['open'])

const { t } = useI18n()

const installedSet = computed(
  () => new Set(props.installedSlugs.map((slug) => String(slug).toLowerCase()))
)
const installedCount = computed(
  () =>
    props.suite.skills.filter((skill) => installedSet.value.has(skill.slug.toLowerCase())).length
)
const visibleSkills = computed(() => props.suite.skills.slice(0, 4))
const hiddenCount = computed(() =>
  Math.max(0, props.suite.skills.length - visibleSkills.value.length)
)
const statusText = computed(() => {
  if (installedCount.value === props.suite.skills.length) {
    return t('knowledgeList.extensions.skills.suite.allInstalled')
  }
  if (installedCount.value > 0) {
    return t('knowledgeList.extensions.skills.suite.partialInstalled', {
      installed: installedCount.value,
      total: props.suite.skills.length
    })
  }
  return t('knowledgeList.extensions.skills.suite.installable', {
    count: props.suite.skills.length
  })
})
</script>

<style lang="less" scoped>
.skill-suite-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 136px;
  padding: 12px 14px;
  border: 1px solid var(--td-component-stroke, var(--gray-150));
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  background: linear-gradient(
    135deg,
    var(--td-bg-color-container, var(--gray-0)) 0%,
    rgba(7, 192, 95, 0.04) 100%
  );
  color: var(--td-text-color-primary, var(--gray-900));
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease,
    box-shadow 0.25s ease;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, rgba(7, 192, 95, 0.08) 0%, transparent 100%);
    border-radius: 0 8px 0 100%;
    pointer-events: none;
  }

  &:hover {
    border-color: var(--td-brand-color, var(--main-color));
    box-shadow: 0 4px 12px rgba(7, 192, 95, 0.12);
    background: linear-gradient(
      135deg,
      var(--td-bg-color-container, var(--gray-0)) 0%,
      rgba(7, 192, 95, 0.08) 100%
    );
  }

  &:focus-visible {
    outline: 2px solid var(--td-brand-color, var(--main-color));
    outline-offset: 2px;
  }
}

.suite-card-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suite-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  height: 24px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--td-brand-color, var(--main-color)) 10%, transparent);
  color: var(--td-brand-color, var(--main-color));
}

.suite-card-title-group {
  min-width: 0;
}

.suite-card-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suite-card-provider {
  margin-top: 1px;
  color: var(--td-text-color-secondary, var(--gray-600));
  font-size: 12px;
  line-height: 18px;
}

.suite-card-description {
  position: relative;
  z-index: 1;
  display: -webkit-box;
  flex: 1;
  min-height: 34px;
  margin: 6px 0 8px;
  overflow: hidden;
  color: var(--td-text-color-secondary, var(--gray-600));
  font-size: 12px;
  line-height: 17px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.suite-card-members {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.t-tag.wk-chip) {
  height: 18px;
  max-height: 18px;
  line-height: 16px;
  padding: 0 6px;
  margin: 0;
  border-radius: 999px;
  background: transparent;
  border-color: var(--td-component-stroke, var(--gray-200));
  color: var(--td-text-color-secondary, var(--gray-600));
  font-size: 11px;
  font-weight: 500;
}

.suite-card-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 8px;
}

.suite-card-status {
  color: var(--gray-500);
  font-size: 12px;
}

.suite-card-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--gray-700);
  font-size: 12px;
  font-weight: 600;
}
</style>
