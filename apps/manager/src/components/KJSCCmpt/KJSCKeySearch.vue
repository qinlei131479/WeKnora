<template>
  <div class="tool-bar">
    <div class="search-div">
      <template v-if="showSearchBox">
        <el-input
          v-model="keyWord"
          :placeholder="placeholder"
          clearable
          style="width: 300px"
          @keyup.enter="doSearch"
          @clear="doSearch"
        >
          <!-- <template #suffix> -->
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <template v-if="showSearchBtn">
          <el-button class="search-btn" type="primary" @click="doSearch">查询</el-button>
          <el-button plain @click="doReset">重置</el-button>
        </template>
      </template>
    </div>
    <div>
      <slot name="btns"></slot>
      <!-- <el-button plain>朴素按钮</el-button> -->
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, watch, nextTick } from 'vue';
export default {
  props: {
    modelValue: String,

    placeholder: {
      type: String,
      default: '请输入关键词搜索'
    },
    showSearchBox: {
      type: Boolean,
      default: true
    },
    showSearchBtn: {
      type: Boolean,
      default: false
    }
  },
  emits: ['doKeySearch', 'update:modelValue'],
  setup(props, context) {
    const state = reactive({
      keyWord: ''
    });

    const doSearch = async () => {
      // eslint-disable-next-line vue/valid-next-tick
      await nextTick(() => {
        context.emit('doKeySearch');
      });
    };

    const doReset = async () => {
      state.keyWord = '';
      // eslint-disable-next-line vue/valid-next-tick
      await nextTick(() => {
        context.emit('doKeySearch');
      });
    };

    watch(
      () => {
        return state.keyWord;
      },
      (val) => {
        context.emit('update:modelValue', val);
      }
    );
    watch(
      () => {
        return props.modelValue;
      },
      (val) => {
        state.keyWord = val;
      },
      {
        immediate: true
      }
    );

    return {
      ...toRefs(state),
      doSearch,
      doReset
    };
  }
};
</script>
<style lang="less" scoped>
.tool-bar {
  display: flex;
  justify-content: flex-end;
  height: 50px;
  line-height: 50px;
  .search-div {
    margin-right: auto;
  }
  .search-btn {
    margin-left: 10px;
  }
}
</style>
