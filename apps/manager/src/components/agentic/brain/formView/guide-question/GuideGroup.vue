<template>
  <div class="guide-group">
    <div class="guide-group-name">
      <GuideInput v-model="item.name"
        placeholder="输入分组名称（一级分类）?"
        @remove="emit('remove', item)"/>
    </div>
    <div class="guide-group-questions">
      <GuideInput
        v-for="(question, index) in item.questions"
        :key="index"
        :model-value="question"
        @update:model-value="handleUpdate(index, $event)"
        @remove="item.questions.splice(index, 1)"
      />
    </div>
    <div class="guide-group-add">
      <el-button
        dashed
        :icon="Plus"
        @click="item.questions.push('')">添加引导问题</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import GuideInput from './GuideInput.vue'
import { GuideGroupItem } from './guideGroup'
import { Plus } from '@element-plus/icons-vue'

const emit = defineEmits(['remove'])

const props = defineProps({
  item: {
    type: Object as () => GuideGroupItem,
    default: () => ({questions: []})
  }
})
const item = ref(props.item)
watch(
  () => props.item,
  (newVal: GuideGroupItem) => {
    console.log('new group', newVal)
    item.value = newVal || {questions: []}
  }
)
const handleUpdate = (index: number, val: string) => {
  console.log('handleUpdate',index, val)
  item.value.questions[index] = val
}
</script>
<style scoped lang="scss">
.guide-group {
  & + .guide-group {
    margin-top: 20px;
  }
  .guide-group-name {
    margin-bottom: 5px;
  }
  .guide-group-questions {
    margin-bottom: 5px;
    padding: 0 10px;
  }
}
</style>
