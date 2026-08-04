<template>
  <div class="tool-bar">
    <div class="search-div">
      <el-checkbox
        v-if="isSelectionAll"
        v-model="selectionAll"
        :indeterminate="isIndeterminate"
        style="margin-right: 20px; margin-left: 10px"
        :disabled="isDisabled"
        @change="toggleSelection"
        >全选</el-checkbox
      >

      <el-button-group>
        <slot></slot>
      </el-button-group>
      <span v-if="!noSelectText" class="selected-text">
        共选中
        <span>{{ length }}</span
        >条
      </span>
    </div>
    <div>
      <slot name="btns"></slot>
    </div>
  </div>
</template>
<script>
import { defineComponent, reactive, toRefs, watchEffect } from 'vue';
export default defineComponent({
  name: 'KjscToolBar',
  props: {
    modelValue: String,
    length: {
      type: Number,
      default: 0
    },
    tableData: {
      type: Array
    },
    noSelectText: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggleSelection'],
  setup(props, context) {
    const state = reactive({
      selectionAll: false, // 单独全选
      isIndeterminate: false,
      tableData: [],
      noSelectText: false,
      isSelectionAll: false,
      isDisabled: false
    });
    const toggleSelection = (val) => {
      console.log(val);
      context.emit('toggleSelection', val);
    };
    // 监听父组件传来的参数
    // watch(
    //   () => {
    //     return props.tableData;
    //   },
    //   (val) => {
    //     console.log(val)
    //   }
    // );
    watchEffect(() => {
      // console.log(props)
      state.noSelectText = props.noSelectText;
      if (props.tableData) {
        if (props.tableData.length > 0) {
          state.isDisabled = false;
        } else {
          state.isDisabled = true;
        }
        state.isSelectionAll = true;

        state.tableData = props.tableData;
        if (props.length === state.tableData.length && props.tableData.length !== 0) {
          state.selectionAll = true;
          state.isIndeterminate = false;
        } else if (props.length > 0) {
          state.selectionAll = false;
          state.isIndeterminate = true;
        } else if (props.length === 0) {
          state.selectionAll = false;
          state.isIndeterminate = false;
        }
      } else {
        state.isSelectionAll = false;
      }
    });

    return {
      ...toRefs(state),
      toggleSelection
    };
  }
});
</script>
<style lang="less" scoped>
.tool-bar {
  display: flex;
  justify-content: flex-end;
  height: 50px;
  line-height: 50px;
  .search-div {
    margin-right: auto;
    display: flex;
    // align-items: center;
  }
  .search-btn {
    margin-left: 10px;
  }
  .selected-text {
    margin-left: 20px;
    font-size: 14px;
    color: #999999;
    line-height: 32px;
    span {
      padding: 0 5px;
      color: #6397ff;
    }
  }
}
</style>
