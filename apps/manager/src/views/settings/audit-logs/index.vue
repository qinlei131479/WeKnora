<template>
  <section class="audit-log-page">
    <page-name class="page-name" title="系统审计日志">
      <template #subtitle>
        监控并详细记录所有知识库管理、访问行为、问答及物理实体原本的下载轨迹
      </template>
      <button type="button" class="export-btn" @click="apiExportExcel">导出审计数据</button>
    </page-name>
    <div class="search-bar">
      <div class="search-bar__keyword">
        <el-input
          v-model="dto.keyword"
          class="search-bar__input"
          clearable
          placeholder="搜索操作员/事件内容/目标知识库..."
          @keyup.enter="handleSearch"
        />
        <button type="button" class="search-bar__icon-btn" @click="handleSearch">
          <svg-icon icon-class="search" class="search-bar__icon" />
        </button>
      </div>

      <div class="search-bar__date-wrap">
        <el-date-picker
          v-model="dateRange"
          class="search-bar__date"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </div>

      <button type="button" class="search-bar__reset" @click="formReset">重置</button>
      <button type="button" class="search-bar__submit" @click="handleSearch">搜索</button>
    </div>

    <div class="audit-content-card">

      <div class="table-wrap">
        <el-table :data="knowledgeOptLogs" height="100%" class="audit-table">
          <el-table-column prop="id" label="事件流水ID" min-width="110">
            <template #default="{ row }">
              <span class="log-id" v-html="getHighlightedText(row.id)" />
            </template>
          </el-table-column>
          <el-table-column prop="userName" label="操作员" min-width="120">
            <template #default="{ row }">
              <span v-html="getHighlightedText(row.userName)" />
            </template>
          </el-table-column>
          <el-table-column prop="eventDesc" label="操作事件内容" min-width="320" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-html="getHighlightedText(row.eventDesc)" />
            </template>
          </el-table-column>
          <el-table-column prop="knowledgeName" label="目标知识库实体" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-html="getHighlightedText(row.knowledgeName)" />
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="访问来源IP" min-width="140">
            <template #default="{ row }">
              <span v-html="getHighlightedText(row.ip)" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="操作时间" min-width="180" align="right">
            <template #default="{ row }">
              <span v-html="getHighlightedText(row.createTime)" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-row">
        <KJSCPagination :total="pagination.total" :page="pagination" @change="handlePaginationChange" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { agiKnowledgeOptLog } from '@/api/agi';
import KJSCPagination from '@/components/KJSCCmpt/KJSCPagination.vue';
import type { KnowledgeOptLogPageDTO, KnowledgeOptLogVO, PageDomain } from '@/types';
import { ElMessage } from 'element-plus';
import { ElMessageBox } from 'element-plus';

const EXPORT_MAX_COUNT = 50000;
const knowledgeOptLogs = ref<KnowledgeOptLogVO[]>([]);
const highlightKeyword = ref('');
const dto = reactive<KnowledgeOptLogPageDTO>({
  keyword: '',
  start: undefined,
  end: undefined
});
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
});
const dateRange = computed<[string, string] | []>({
  get() {
    return dto.start && dto.end ? [dto.start, dto.end] : [];
  },
  set(value: string) {
    const [start, end] = value || [];
    dto.start = start;
    dto.end = end;
  }
});

const getHighlightedText = (value: unknown): string => {
  const escapeHtml = (value: string): string => {
    return value.replace(/[&<>"']/g, (char) => {
      const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return htmlEntities[char];
    });
  };

  const text = value == null ? '' : String(value);
  const keyword = highlightKeyword.value;

  if (!keyword) {
    return escapeHtml(text);
  }

  const regExp = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regExp.exec(text)) !== null) {
    parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    parts.push(`<span class="keyword-highlight">${escapeHtml(match[0])}</span>`);
    lastIndex = match.index + match[0].length;
  }

  parts.push(escapeHtml(text.slice(lastIndex)));

  return parts.join('');
};

const handleSearch = () => {
  pagination.pageNum = 1;
  apiList();
};

const handlePaginationChange = () => {
  apiList();
};

const formReset = () => {
  dto.keyword = '';
  dto.start = undefined;
  dto.end = undefined;
  pagination.pageNum = 1;
  apiList();
};

const apiList = () => {
  const keyword = dto.keyword.trim().toLowerCase();
  dto.keyword = keyword;
  const pg: PageDomain = {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    orderByColumn: 'id',
    isAsc: 'desc'
  };
  agiKnowledgeOptLog
    .list(dto, pg)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      knowledgeOptLogs.value = res.rows;
      pagination.total = res.total;
      highlightKeyword.value = keyword;
    })
    .catch((err) => {
      console.error('--> --> 获取系统审计日志失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取系统审计日志失败');
    });
};

const apiExportExcel = () => {
  dto.keyword = dto.keyword.trim().toLowerCase();
  const pg: PageDomain = {
    pageNum: 1,
    pageSize: EXPORT_MAX_COUNT,
    orderByColumn: 'id',
    isAsc: 'desc'
  };

  agiKnowledgeOptLog
    .count(dto)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      if (!!res.data && res.data > EXPORT_MAX_COUNT) {
        return Promise.reject({
          errMsg: `当前条件下日志数量 ${res.data} 条，超过最大导出数 ${EXPORT_MAX_COUNT} 条。<br />请调整筛选条件后再试。`
        });
      }
      return agiKnowledgeOptLog.exportExcel(dto, pg);
    })
    .then((res) => {
      downloadFile(res, `export_${yyyyMMddHHmmss()}.xlsx`);
    })
    .catch((err) => {
      console.error('--> --> 导出系统审计日志失败', err);
      if (!!err.errMsg) {
        ElMessageBox.alert(err.errMsg, '提示', {
          confirmButtonText: '确定',
          dangerouslyUseHTMLString: true
        });
      } else {
        ElMessage.closeAll();
        ElMessage.warning('导出系统审计日志失败');
      }
    });
};

const downloadFile = (data: any, filename: string) => {
  const url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const yyyyMMddHHmmss = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

onMounted(() => {
  apiList();
});
</script>

<style scoped lang="scss">
.audit-log-page {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  min-height: calc(100vh - var(--navbar-height, 96px));
  flex-direction: column;
  padding: 40px 40px 20px;
  background: #ebf3f5;
  border-radius: 40px 0 0 0;
  overflow: hidden;
}

.page-name {
  margin-bottom: 20px;

  :deep(.page-name-right) {
    align-self: flex-start;
    padding-top: 4px;
  }
}

.export-btn {
  min-width: 120px;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.92;
  }
}
.audit-content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0px 0px 32px 0px;
  border-radius: 24px;
  background: #ffffff;
  overflow: hidden;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  &__keyword {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 420px;
    height: 36px;
    padding: 0 8px 0 16px;
    border: 1px solid #e1e6ec;
    border-radius: 12px;
    background: #ffffff;
    box-sizing: border-box;
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
      height: 38px;
      line-height: 38px;
      font-size: 14px;
      color: #303133;

      &::placeholder {
        color: #a8abb2;
      }
    }
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: #ebf3f5;
    }
  }

  &__icon {
    font-size: 16px;
    color: #77838f;
  }

  &__date-wrap {
    width: 326px;
    flex: none;
    margin-left: 8px;
    margin-right: 8px;

    :deep(.el-date-editor) {
      --el-date-editor-daterange-width: 326px;
      --el-date-editor-width: 326px;
      width: 326px !important;
      max-width: 326px !important;
      flex-grow: 0 !important;
    }

    :deep(.el-input__wrapper) {
      width: 100%;
      height: 36px;
      border-radius: 12px;
      box-shadow: 0 0 0 1px #e1e6ec inset !important;
    }
  }

  &__date {
    width: 100%;
  }

  &__reset {
    min-width: 72px;
    height: 36px;
    padding: 0 20px;
    border: 1px solid #e1e6ec;
    border-radius: 8px;
    background: #ffffff;
    color: #77838f;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;

    &:hover {
      border-color: #3297a0;
      color: #3297a0;
    }
  }

  &__submit {
    min-width: 72px;
    height: 36px;
    padding: 0 24px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(180deg, #31aba0 0%, #2897be 100%);
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-left: 8px;

    &:hover {
      opacity: 0.92;
    }
  }
}

.table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.audit-table {
  height: 100%;

  :deep(.el-table) {
    --el-table-border-color: #ebeef5;
    --el-table-header-bg-color: #ffffff !important;
    --el-table-tr-bg-color: #fbfcfd;
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table__body-wrapper) {
    background-color: #fbfcfd;
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

  :deep(.el-table__body tr.el-table__row) {
    background-color: #fbfcfd !important;
  }

  :deep(.el-table__body tr.el-table__row td.el-table__cell) {
    background-color: #fbfcfd !important;
  }

  :deep(.el-table__cell) {
    padding: 15px 0;
    color: #2b2f33;
    font-size: 14px;

    .cell {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
    }
  }

  :deep(.log-id) {
    color: #a8abb2;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 13px;
  }

  :deep(.keyword-highlight) {
    padding: 0 1px;
    border-radius: 2px;
    background: var(--el-color-danger-light-8);
    color: var(--el-color-danger);
    font-weight: inherit;
  }
}

.pagination-row {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding-top: 24px;
}

@media (max-width: 768px) {
  .audit-log-page {
    padding: 16px;
    border-radius: 24px 0 0 0;
  }

  .audit-content-card {
    padding: 16px;
  }

  .search-bar {
    &__keyword,
    &__date-wrap {
      width: 100%;
    }

    &__date-wrap :deep(.el-date-editor) {
      width: 100% !important;
      max-width: none !important;
    }
  }
}
</style>
