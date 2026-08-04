<script setup lang="ts">

import AgentBrainBase from '@/components/agentic/brain/AgentBrainBase.vue'
import AgentBrainBusiness from '@/components/agentic/brain/AgentBrainBusiness.vue'

import { allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'


const activeTab = ref<'business' | 'base'>('business')

const domain = ref(allCategoryId);

const route = useRoute();
if (route.query.domain) {
  domain.value = +route.query.domain || allCategoryId;
  if (domain.value === baseCategoryId) {
    activeTab.value = 'base';
  }
}

</script>

<template>
  <my-page>
    <page-layout>
      <template #start>
        <page-name />
      </template>
      <page-layout gap="0">
        <template #start>
          <el-tabs v-model="activeTab" class="demo-tabs">
            <el-tab-pane label="业务半脑配置" name="business" />
            <el-tab-pane label="基础半脑配置" name="base" />
          </el-tabs>
        </template>
        <AgentBrainBase v-if="activeTab === 'base'" />
        <AgentBrainBusiness v-else :domain="domain" @ready="domain = null"/>
      </page-layout>
    </page-layout>
  </my-page>
</template>

<style scoped lang="scss">
.my-page {
  background-image: url('@/assets/images/brain/bg.png');
}
</style>
