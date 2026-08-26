<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { CustomAgentsVO } from '@/types';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    agent?: CustomAgentsVO;
  }>(),
  {
    modelValue: false,
    agent: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const drawerTitle = computed(() => {
  const detail = t('page.normal.detail', '详情');
  return props.agent.name ? `${props.agent.name} ${detail}` : detail;
});
</script>

<template>
  <KjscRtlDrawer
    v-model="visible"
    :size="800"
    :title="drawerTitle"
    :show-cancel="false"
    :show-confirm="false"
  >
    <template #header>
      <el-text>{{ drawerTitle }}</el-text>
    </template>
  </KjscRtlDrawer>
</template>
