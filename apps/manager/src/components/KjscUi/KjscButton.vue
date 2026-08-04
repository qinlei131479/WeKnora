<template>
  <el-button :loading="loading" :type="type" @click="handleClick">
    <slot></slot>
  </el-button>
</template>

<script setup>
import {
  // defineEmits,
  ref,
  defineProps,
  computed
} from 'vue';
const innerLoading = ref(false);

// const emits = defineEmits(['click']);
const props = defineProps({
  isAsync: { type: Boolean, default: false },
  onClick: {
    type: Function
  },
  type: {
    type: String
  },
  // 劫持loading属性
  loading: { type: Boolean }
});
const loading = computed(() => {
  if (props.isAsync) {
    return innerLoading.value;
  } else {
    return props.loading;
  }
});
const type = computed(() => {
  const _type = props.type ? props.type : '';
  if (_type === 'default') {
    return 'primary';
  } else if (_type === 'add') {
    return 'success';
  }
  return _type;
});
const handleClick = async (evt) => {
  // 按钮点击事件的回调函数
  let target = evt.target;
  if (target.nodeName === 'SPAN') {
    target = evt.target.parentNode;
  }
  target.blur();

  if (props.onClick) {
    innerLoading.value = true;
    try {
      await props.onClick();
    } catch (err) {
    } finally {
      innerLoading.value = false;
    }
  }
  // emits('click');
};
</script>
<script>
export default {
  name: 'KjscButton'
};
</script>

<style lang="less">
.is-circle [class*='el-icon'] + span {
  margin: 0;
}
</style>
