<template>
  <libList v-if="showType === 'lib'" @manage="showManage" />
  <FileList v-else-if="showType === 'file'" :libId="libId" :lib="lib" @back="showLib" />
  <!-- <FaqList v-else :libId="libId" :lib="lib" @back="showLib" /> -->
</template>

<script setup lang="ts" name="KnowledgeBase">
import FileList from './FileList.vue';
import libList from './libList.vue';
// import FaqList from './FaqList.vue';
import { KnowledgeBaseEntity, KnowledgeBaseType } from '@/types';

type IShowType = 'lib' | 'file' | 'faq';
const showType: Ref<IShowType> = ref('lib');
const libId: Ref<string> = ref('');
const lib: Ref<KnowledgeBaseEntity | undefined> = ref();
const showManage = (params: { id: string; type: KnowledgeBaseType; row?: KnowledgeBaseEntity }) => {
  libId.value = params.id;
  const faqList = ['faq'];
  if (faqList.includes(params.type)) {
    showType.value = 'faq';
  } else {
    showType.value = 'file';
  }
  lib.value = params.row;
};
const showLib = () => {
  showType.value = 'lib';
};
</script>

<style scoped lang="scss"></style>
