<template>
  <div :class="{ 'hidden': hidden }" class="pagination-container">
    <el-pagination :background="background" v-model:current-page="currentPage" v-model:page-size="pageSize"
      :layout="layout" :page-sizes="pageSizes" :pager-count="pagerCount" :total="total" @size-change="handleSizeChange"
      @current-change="handleCurrentChange" />
  </div>
</template>

<script setup lang="ts">
import { scrollTo } from '@/utils/scroll-to'

const props = defineProps({
  total: {
    required: true,
    type: Number
  },
  page: {
    type: Number,
    default: 1
  },
  limit: {
    type: Number,
    default: 10
  },
  pageSizes: {
    type: Array,
    default() {
      return [10, 20, 30, 50]
    }
  },
  // 移动端页码按钮的数量端默认值5
  pagerCount: {
    type: Number,
    default: document.body.clientWidth < 992 ? 5 : 7
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper' // sizes, , jumper
  },
  background: {
    type: Boolean,
    default: false
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  hidden: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits()
const currentPage = computed({
  get() {
    return props.page
  },
  set(val: number) {
    emit('update:page', val)
  }
})
const pageSize = computed({
  get() {
    return props.limit
  },
  set(val: number) {
    emit('update:limit', val)
  }
})

function handleSizeChange(val: number) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1
  }
  emit('pagination', { page: currentPage.value, limit: val })
  if (props.autoScroll) {
    scrollTo(0, 800)
  }
}

function handleCurrentChange(val: number) {
  emit('pagination', { page: val, limit: pageSize.value })
  if (props.autoScroll) {
    scrollTo(0, 800)
  }
}
</script>

<style scoped lang="scss">
/* .pagination-container {
  background: #fff;
} */
.pagination-container.hidden {
  display: none;
}

.el-pagination {
  --el-pagination-bg-color: transparent;
  --el-pagination-button-disabled-bg-color: transparent;

  :deep(.el-pagination__sizes) {
    .el-select__wrapper {
      background: transparent;
    }
  }

  :deep(.el-pagination__jump) {
    .el-input {
      --el-input-bg-color: transparent;
      --el-input-border-color: transparent;
    }
  }
}
</style>