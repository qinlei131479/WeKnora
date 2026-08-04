<template>
  <el-pagination
    class="page"
    :current-page="pageNo"
    :page-sizes="pageSizes"
    :page-size="pageInfo.pageSize"
    :layout="layout"
    :total="total"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  >
  </el-pagination>
</template>

<script>
import { toRefs, computed, onMounted, reactive, watchEffect, watch } from 'vue';

const baseOnZero = false; // 后端分页是否从0开始。
class Page {
  constructor(pageSize, pageNum) {
    this.pageSize = pageSize;
    this.pageNum = pageNum;
  }
}
Page.prototype.resetPageNo = function () {
  this.pageNum = baseOnZero ? 0 : 1;
};
Page.prototype.setPageIndex = function (pageNum) {
  if (baseOnZero) {
    if (pageNum < 0) {
      pageNum = 0;
    }
  } else {
    if (pageNum < 1) {
      pageNum = 1;
    }
  }
  this.pageNum = pageNum;
};
Page.prototype.setPageSize = function (pageSize) {
  this.pageSize = pageSize;
};
export default {
  name: 'KjscPagination',

  props: {
    page: {
      type: [Object, Page],
      default: () => ({
        page: getPage(),
        total: 0
      })
    },
    total: {
      type: [Number]
    },
    textAlign: {
      type: String,
      default: 'right'
    },

    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    sizes: {
      type: Array,
      default() {
        return [10, 20, 50, 100];
      }
    }
  },
  emits: ['change', 'update:page'],
  setup(props, context) {
    const state = reactive({
      pageSizes: props.sizes,
      pageInfo: props.page
    });
    const pageNo = computed(() => {
      return state.pageInfo.pageNum + baseOnZero;
    });
    const handleSizeChange = (pageSize) => {
      state.pageInfo.pageSize = pageSize;
      context.emit('change', { page: state.pageInfo, type: 'size' });
    };
    const handleCurrentChange = (pageNum) => {
      state.pageInfo.pageNum = pageNum - baseOnZero;
      context.emit('change', { page: state.pageInfo, type: 'page' });
    };

    onMounted(() => {
      const currPageSize = state.pageInfo.pageSize;
      if (currPageSize && props.sizes.indexOf(currPageSize) < 0) {
        state.pageSizes.push(currPageSize);
        state.pageSizes.sort((a, b) => {
          return a - b;
        });
      }
    });

    watchEffect(() => {
      state.pageInfo = props.page;
    });
    watch(
      () => {
        return state.pageInfo;
      },
      () => {
        context.emit('update:page', state.pageInfo);
      },
      { deep: true }
    );
    return { ...toRefs(state), pageNo, handleSizeChange, handleCurrentChange };
  }
};

export function getPage(pageSize = 10, pageNum) {
  if (pageNum === undefined || pageNum == null) {
    pageNum = baseOnZero ? 0 : 1;
  } else {
    if (baseOnZero) {
      if (pageNum < 0) {
        pageNum = 0;
      }
    } else {
      if (pageNum < 1) {
        pageNum = 1;
      }
    }
  }
  return new Page(pageSize, pageNum);
}
</script>

<style lang="less" scoped>
.page {
  display: flex;
  align-items: center;
  height: 50px;
  margin-left: auto;
  justify-content: flex-end;
}
</style>
