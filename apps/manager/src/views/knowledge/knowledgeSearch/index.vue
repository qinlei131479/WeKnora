<template>
  <div>
    <!-- //知识库搜索-未搜索时 -->
    <SearchInit v-if="state.type==0" @done="changeType"/>
    <!-- 知识库搜索-搜索结果 -->
    <SearchResult v-else :keyWords="state.keyWords"/>
  </div>
</template>

<script setup name="knowledgeSearch">
import SearchInit from '@/components/knowledeg/SearchInit.vue';
import SearchResult from '@/components/knowledeg/SearchResult.vue';
const state = reactive({
  type:0,
  keyWords:''
});
const changeType = (words) => {
    state.type= 1;
    state.keyWords = words;
};
</script>
<style>

</style>