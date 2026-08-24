<template>
  <t-tooltip :content="tooltip" placement="bottom">
    <div
      class="platform-topbar-icon"
      role="button"
      :aria-label="tooltip"
      @click="toggleTheme"
    >
      <t-icon :name="isDark ? 'sunny' : 'moon'" size="18px" />
    </div>
  </t-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'

const { t } = useI18n()
const { isDark, toggleTheme } = useTheme()

const tooltip = computed(() =>
  isDark.value ? t('theme.switchToLight') : t('theme.switchToDark'),
)
</script>
