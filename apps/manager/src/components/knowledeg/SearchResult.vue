<template>
  <div class="knowledge-search-result">
    <page-name class="page-name" />

    <div class="result-content-card">
      <div class="search-bar" :class="{ 'is-focused': searchFocused }">
        <el-input
          v-model="state.queryParams.keyword"
          class="search-bar__input"
          placeholder="请输入关键词搜索文档知识或FAQ知识..."
          clearable
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keyup.enter="changeKeyWords"
          @input="changeKeyWords"
        />
        <button type="button" class="search-bar__btn" @click="changeKeyWords">
          <svg-icon icon-class="search" class="search-bar__btn-icon" />
        </button>
      </div>

      <!-- 排序功能暂不使用
      <div class="sort">
        <el-dropdown class="right-menu-item hover-effect" :hide-on-click="true" trigger="click">
          ...
        </el-dropdown>
      </div>
      -->

      <div class="result-table-panel">
        <el-tabs v-model="state.activeName" class="result-tabs">
          <el-tab-pane v-for="(item, index) in state.tabList" :key="index" :label="item.label" :name="item.key">
            <div class="table-wrap">
              <Table
                v-if="state.activeName === item.key"
                :key-words="state.queryParams.keyword"
                :table-data="state.tableData"
                @done="callback"
              />
            </div>
            <KJSCPagination
              v-show="state.total > 0"
              :total="state.total"
              :page="{ pageNum: state.pagInfo.pageNum, pageSize: state.pagInfo.pageSize }"
              class="result-pagination"
              @change="handlePageChange"
            />
            <!-- <KJSCPagination v-show="state.total > 0" :total="state.total" :page="{ pageNum: state.pagInfo.pageNum, pageSize: state.pagInfo.pageSize }" @change="handlePageChange" /> -->
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup name="searchResult">
import Table from './SearchTable.vue';
import { listSearch } from '@/api/knowledge/ragKnowledgeSearch';
import KJSCPagination from '@/components/KJSCCmpt/KJSCPagination.vue';

const props = defineProps({
  keyWords: {
    type: String,
    default: ''
  }
});

const searchFocused = ref(false);

const state = reactive({
  // columnData: [{
  //   key: 'fileName',
  //   label: '名称'
  // }, {
  //   key: 'memberCount',
  //   label: '成员数量'
  // }, {
  //   key: 'chunkContent',
  //   label: '内容'
  // }, {
  //   key: 'createTime',
  //   label: '日期'
  // }],
  activeName: '',
  tabList: [
    { key: '', label: '全部' },
    { key: 'doc', label: '文档' },
    { key: 'excel', label: '表格' },
    { key: 'ppt', label: 'PPT' },
    { key: 'text', label: '文本' },
    { key: 'audio', label: '音频' },
    { key: 'video', label: '视频' },
    { key: 'image', label: '图像' }
  ],
  // sortType: 'desc',
  // columnType: 'createTime',
  tableData: [],
  queryParams: {
    firstSortColumn: 'createTime',
    firstSortOrder: 'desc',
    secondSortColumn: '',
    secondSortOrder: '',
    keyword: '',
    type: ''
  },
  pagInfo: {
    pageNum: 1,
    pageSize: 10
  },
  total: 0
});

// const changeColumn = (type, key) => {
//   if (type == 2) {
//     state.sortType = key;
//     state.queryParams.firstSortOrder = state.sortType;
//   } else {
//     state.columnType = key;
//     state.queryParams.firstSortColumn = state.columnType;
//   }
//   getTable();
// };

const getTable = async () => {
  const params = { ...state.queryParams };
  params.type = state.activeName;
  const res = await listSearch(params, state.pagInfo);
  if (res.code === 200) {
    state.tableData = res.rows;
    state.total = res.total;
  }
};

const changeKeyWords = () => {
  state.pagInfo.pageNum = 1;
  getTable();
};

const callback = (column) => {
  if (column.order == 'ascending') {
    state.queryParams.secondSortOrder = 'asc';
  }
  if (column.order == 'descending') {
    state.queryParams.secondSortOrder = 'desc';
  }
  state.queryParams.secondSortColumn = column.prop;
  getTable();
};

const handlePageChange = ({ page, type }) => {
  if (type === 'size') {
    state.pagInfo.pageNum = 1;
  } else {
    state.pagInfo.pageNum = page.pageNum;
  }
  state.pagInfo.pageSize = page.pageSize;
  getTable();
};

watch(
  () => state.activeName,
  () => {
    if (state.queryParams.keyword) {
      state.pagInfo.pageNum = 1;
      state.pagInfo.pageSize = 10;
      getTable();
    }
  },
  { immediate: true }
);

onMounted(() => {
  state.queryParams.keyword = props.keyWords;
  getTable();
});
</script>

<style lang="scss" scoped>
.knowledge-search-result {
  box-sizing: border-box;
  min-height: calc(100vh - var(--navbar-height, 96px));
  padding: 24px 32px 32px;
  background: #ebf3f5;
  border-radius: 40px 0 0 0;
  overflow: hidden;
}

.page-name {
  margin-bottom: 20px;
}

.result-content-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px 24px 24px;
  border-radius: 24px;
  // background: #ffffff;
}

.search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 420px;
  height: 48px;
  margin-bottom: 20px;
  padding: 0 8px 0 20px;
  border: 1px solid #E1E6EC;
  border-radius: 24px;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.is-focused {
    border-color: #3297a0;
    box-shadow: 0 0 0 2px rgba(50, 151, 160, 0.12);
  }

  &__input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      padding: 0;
      background: transparent;
      box-shadow: none !important;
    }

    :deep(.el-input__inner) {
      height: 46px;
      line-height: 46px;
      font-size: 14px;
      color: #303133;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s;

    &:hover {
      background-color: #ebf3f5;
    }
  }

  &__btn-icon {
    font-size: 18px;
    color: #77838f;
  }
}

.result-table-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.result-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 40px;
    padding: 0 24px;
    color: #77838f;
    font-size: 14px;
    font-weight: 500;

    &.is-active {
      color: #3297a0;
      font-weight: 600;
    }

    &:hover {
      color: #3297a0;
    }
  }

  :deep(.el-tabs__active-bar) {
    height: 2px;
    background-color: #3297a0;
  }

  :deep(.el-tabs__item.is-top:nth-child(2)) {
    padding-left: 0;
  }
}

.table-wrap {
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 12px;

  :deep(.el-table) {
    --el-table-border-color: #ebeef5;
    --el-table-header-bg-color: #ffffff !important;
    --el-table-tr-bg-color: #fbfcfd;
  }

  :deep(.el-table__body-wrapper) {
    background-color: #fbfcfd;
  }

  :deep(.el-table__body tr.el-table__row) {
    background-color: #fbfcfd !important;
  }

  :deep(.el-table__body tr.el-table__row td.el-table__cell) {
    background-color: #fbfcfd !important;
  }

  :deep(.el-table__header-wrapper th),
  :deep(.el-table__fixed-header-wrapper th) {
    background-color: #ffffff !important;
    color: #77838f;
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.el-table__header-wrapper th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    background-color: #ffffff !important;
  }

  :deep(.el-table__cell) {
    padding: 12px 0;
    color: #2b2f33;
    font-size: 14px;
  }
}

.result-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-bottom: 16px;
}
</style>
