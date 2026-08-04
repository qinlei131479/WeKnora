<template>
  <div class="tool-bar">
    <div class="search-div">
      <slot></slot>
    </div>
    <div class="btns">
      <el-button type="primary" @click="doSearch">查询</el-button>
      <el-button plain @click="doReset">重置</el-button>
      <slot name="btns"></slot>
      <el-button v-show="useMore" type="text" @click="doExpand">
        {{ expandBtnText }}<el-icon><CaretBottom v-if="isExpand" /><CaretTop v-else /></el-icon>
      </el-button>
    </div>
  </div>
  <slot v-if="!isExpand" name="more"> </slot>
</template>

<script>
import { reactive, toRefs, computed, useSlots } from 'vue';
export default {
  emits: ['doSearch', 'doReset', 'doExpand'],
  setup(props, context) {
    const state = reactive({
      isExpand: true
    });
    const expandBtnText = computed(() => {
      return state.isExpand ? '展开' : '收起';
    });
    const useMore = !!useSlots().more;
    const doSearch = () => {
      context.emit('doSearch');
    };

    const doReset = () => {
      context.emit('doReset');
    };

    const doExpand = () => {
      state.isExpand = !state.isExpand;
      context.emit('doExpand');
    };
    return {
      ...toRefs(state),
      expandBtnText,
      useMore,
      doSearch,
      doReset,
      doExpand
    };
  }
};
</script>
<style lang="less" scoped>
.tool-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  line-height: 50px;

  :deep(.el-form-item) {
    margin: 5px 20px 5px 0px;
  }
  .search-div {
    margin-right: auto;
  }

  .btns {
    text-align: right;
    min-width: 200px;
  }
}
</style>
