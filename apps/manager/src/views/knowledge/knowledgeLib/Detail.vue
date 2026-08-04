<script setup lang="ts">
import { detailKnowledgeLibApi } from '@/api/knowledgeLib/knowledgeLib'
import KnowledgeLibManage from '@/components/knowledeg/newModule/LibManage.vue'
// import { useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const state = reactive({
  rightType: 'manage',
  libItem: null,
})

const showList = () => {
  router.back();
}
const id = route.query.id as string

const getTableData = () => {
  if (!id) {
    return
  }
  detailKnowledgeLibApi(id).then((res: any) => {
    state.libItem = res.data
  })
}
watch(
  () => route.query.id,
  () => {
    getTableData()
  },
  { immediate: true }
)
</script>

<template>
  <KnowledgeLibManage v-if="state.libItem"
    :right-type="state.rightType"
    :lib-item="state.libItem"
    @back="showList"/>
</template>