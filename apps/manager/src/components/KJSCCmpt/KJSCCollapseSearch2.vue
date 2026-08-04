<template>
  <div class="kjsc-collapse-search2">
    <div class="first-form">
      <slot></slot>
      <slot name="rightBtns"></slot>
    </div>
    <slot name="more"></slot>
  </div>
</template>

<script lang="ts">
export default {
  name: 'KJSCCollapseSearch2',
}
export function useCollapseSearch2() {
  const state = reactive({
    cs2Expand: false
  });
  const cs2ExpandBtnText = computed(() => {
    return state.cs2Expand ? '收起' : '展开';
  });
  const cs2DoExpand = () => {
    state.cs2Expand = !state.cs2Expand;
  };
  return {
    ...toRefs(state),
    cs2ExpandBtnText,
    cs2DoExpand
  }
}
</script>
<style lang="less" scoped>
.kjsc-collapse-search2 {
  .first-form {
    display: flex;
    justify-content: space-between
  }
  // :deep(.el-form) {
  //   width: 100%;
  // }
}
</style>
