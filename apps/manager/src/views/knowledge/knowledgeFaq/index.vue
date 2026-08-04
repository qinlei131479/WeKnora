<script setup lang="ts">
import FaqList from '@/components/knowledge/faq/FaqList.vue'
import FaqDetail from '@/components/knowledge/faq/FaqDetail.vue'

const state = reactive({
  dataId: null
})

const handleDetail = (dataId: string | number) => {
  state.dataId = dataId
}

const handleBack = () => {
  state.dataId = null
}
</script>

<template>
  <my-page v-if="!state.dataId" class="faq-page" :class="state.dataId ? 'faq-detail-page' : 'faq-list-page'">
    <FaqList @detail="handleDetail" />
  </my-page>
  <FaqDetail v-else :data-id="state.dataId" @back="handleBack" />
</template>
<style scoped lang="scss">
.faq-list-page {
  background-image: url('@/assets/images/faq/bg.png');
}

// .faq-detail-page {
//   :deep(.my-page-top) {
//     display: none;
//   }
// }
</style>