<template>
  <el-empty :image-size="props.imageSize" :description="props.description" :image="state.image">
    <template v-if="useDescription" #description>
      <slot name="description"></slot>
    </template>
    <slot></slot>
  </el-empty>
</template>

<script setup>
import { computed, defineProps, useSlots, reactive } from 'vue';
import image from '../../assets/images/kjsc/no-data.png';
const props = defineProps({
  imageSize: {
    type: Number,
    default: 350
  },
  description: {
    type: String,
    default: '暂无数据'
  },
  image: {}
});
const state = reactive({
  image: props.image ? props.image : image
});

const useDescription = computed(() => {
  return !!useSlots().description;
});
</script>
<script>
export default {
  name: 'KjscEmpty'
};
</script>
<style lang="less" scoped></style>
