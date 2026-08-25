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
      <span v-for="skill in visibleSkills" :key="skill.slug" class="suite-member-tag">
        {{ skill.name }}
      </span>
      <span v-if="hiddenCount" class="suite-member-tag">+{{ hiddenCount }}</span>
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
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 196px;
  padding: 18px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
  color: var(--gray-900);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--td-brand-color, var(--main-color));
    background: var(--td-bg-color-container, var(--gray-0));
    box-shadow: 0 4px 12px color-mix(in srgb, var(--td-brand-color, var(--main-color)) 12%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--main-color);
    outline-offset: 2px;
  }
}

.suite-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.suite-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--gray-100);
  color: var(--gray-700);
}

.suite-card-title-group {
  min-width: 0;
}

.suite-card-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 650;
  line-height: 21px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suite-card-provider {
  margin-top: 1px;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 18px;
}

.suite-card-description {
  display: -webkit-box;
  min-height: 40px;
  margin: 14px 0 12px;
  overflow: hidden;
  color: var(--gray-600);
  font-size: 13px;
  line-height: 20px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.suite-card-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suite-member-tag {
  padding: 2px 7px;
  border: 1px solid var(--gray-150);
  border-radius: 999px;
  background: var(--gray-25);
  color: var(--gray-600);
  font-size: 11px;
  line-height: 18px;
}

.suite-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
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
