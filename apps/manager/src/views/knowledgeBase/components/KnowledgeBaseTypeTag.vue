<template>
  <el-tag :type="dv.tagType" :class="dv.className">{{ dv.label }}</el-tag>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  type: {
    type: String,
    default: ''
  }
});
const dv = computed(() => {
  let label = '';
  let tagType = '';
  let className = '';
  const type = props.type;
  if (type === 'document') {
    label = t('page.knowledgeBase.types.document', '文档');
    tagType = 'primary';
    className = 'knowledge-type-document';
  } else if (type === 'faq') {
    label = t('page.knowledgeBase.types.faq', '问答');
    tagType = 'info';
    className = 'knowledge-type-faq';
  }
  return {
    label,
    tagType,
    className
  }
})
</script>