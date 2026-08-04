<template>
  <div class="items-box">
    <span v-if="!state.isInput" @click="onFocus">{{ state.value }}</span>
    <el-input v-else ref="inputRef" v-model="state.value" @blur="onChange" />
  </div>
</template>
<script></script>
<script setup>
import { ref, reactive, defineProps, defineEmits, nextTick, watchEffect } from 'vue';

const props = defineProps({
  value: {
    type: [Number, String]
  }
});
const inputRef = ref();
const emit = defineEmits(['update:value', 'onChange']);
const state = reactive({
  isInput: false,
  value: props.value
});

const onFocus = () => {
  state.isInput = true;
  nextTick(() => {
    inputRef.value.focus();
  });
};

const onChange = () => {
  state.isInput = false;
  emit('onChange', {
    value: state.value,
    resetValue: (val) => {
      state.value = props.value;
    }
  });
};

watchEffect(() => {
  console.log('props.value===>', props.value);
});
</script>

<script>
export default {
  name: 'KjscTableInput'
};
</script>

<style lang="less" scoped>
.items-box {
  span {
    display: inline-block;
    width: 100%;
    min-width: 50px;
    min-height: 10px;
    cursor: pointer;
  }
}
</style>
