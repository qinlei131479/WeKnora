<template>
  <my-page class="monitor-page-shell">
    <section class="monitor-page">
      <page-name class="page-name" />

      <div class="monitor-content-card">
        <!-- <SearchPanel class="monitor-search-panel" @search="handleSearch" /> -->

        <div class="table-panel">
          <!-- <div class="table-toolbar">
            <div class="batch-actions">
              <el-button-group>
                <el-button :disabled="!selectedRows.length" @click="handleBatchDelete">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  批量删除
                </el-button>
                <el-button :disabled="!records.length" @click="handleExport(selectedRows)">
                  <el-icon>
                    <Download />
                  </el-icon>
                  批量导出
                </el-button>
              </el-button-group>
              <span
                >共选中 <strong>{{ selectedRows.length }}</strong> 条</span
              >
            </div>
          </div> -->

          <div v-loading="loading" class="table-wrap">
            <el-table
              ref="tableRef"
              :data="records"
              height="100%"
              row-key="id"
              class="monitor-table"
              empty-text="当前筛选条件下暂无交互记录"
              @selection-change="selectedRows = $event"
            >
              <el-table-column type="selection" align="center" reserve-selection min-width="48" />
              <el-table-column prop="id" label="序号" />
              <el-table-column label="员工ID" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.jobNumber || row.userId || '' }}
                </template>
              </el-table-column>
              <el-table-column prop="userName" label="姓名" show-overflow-tooltip min-width="120">
                <template #default="{ row }">
                  <span v-html="getHighlightedText(row.userName)" />
                </template>
              </el-table-column>
              <el-table-column prop="deptName" label="部门" show-overflow-tooltip min-width="120">
                <template #default="{ row }">
                  <span v-html="getHighlightedText(row.deptName)" />
                </template>
              </el-table-column>
              <el-table-column prop="postName" label="岗位" show-overflow-tooltip min-width="120">
                <template #default="{ row }">
                  <span v-html="getHighlightedText(row.postName)" />
                </template>
              </el-table-column>
              <el-table-column label="交互内容" show-overflow-tooltip min-width="160">
                <template #default="{ row }">
                  <span v-html="getHighlightedText(row.interactionContent || row.question)" />
                </template>
              </el-table-column>
              <el-table-column prop="categoryName" label="归属领域分类" show-overflow-tooltip min-width="120" />
              <el-table-column prop="questionTime" label="开始对话时间" min-width="160" />
              <el-table-column prop="answerEndTime" label="结束对话时间" min-width="160" />
              <el-table-column prop="totalTime" label="总时长" />
              <el-table-column prop="agenticName" label="调用智能体" show-overflow-tooltip min-width="160">
                <template #default="{ row }">
                  <span v-html="getHighlightedText(row.agenticName)" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button link class="action-link action-link--teal" @click="handleView(row)">查看</el-button>
                  <el-button link type="danger" @click.stop="handleDelete([row.id])">删除</el-button>
                  <el-button
                    v-hasPermi="['business:agiChatRecord:export']"
                    link
                    class="action-link action-link--teal"
                    @click.stop="handleExport([row])"
                    >导出</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>

          <KJSCPagination v-show="total > 0" :total="total" :page="pageInfo" @change="handlePaginationChange" />
        </div>
      </div>

      <ChatHistoryDialog v-model="historyVisible" :record="currentRecord" />
    </section>
  </my-page>
</template>

<script setup lang="ts">
import { Delete, Download } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { agiChatRecord } from '@/api/agentic/agiChatRecord';
import KJSCPagination from '@/components/KJSCCmpt/KJSCPagination.vue';
import type { AgiChatRecordPageDTO, AgiChatRecordVO, PageDomain } from '@/types';
import ChatHistoryDialog from './components/ChatHistoryDialog.vue';
import SearchPanel from './components/SearchPanel.vue';

const dto = reactive<AgiChatRecordPageDTO>({
  keyword: '',
  deptId: undefined,
  postId: undefined,
  start: undefined,
  end: undefined
});
const pageInfo = reactive<PageDomain>({
  pageNum: 1,
  pageSize: 10,
  orderByColumn: 'id',
  isAsc: 'desc'
});
const records = ref<AgiChatRecordVO[]>([]);
const tableRef = ref();
const selectedRows = ref<any[]>([]);
const highlightKeyword = ref('');
const total = ref(0);
const loading = ref(false);
const historyVisible = ref(false);
const currentRecord = ref<AgiChatRecordVO>();

const apiChatRecordList = () => {
  loading.value = true;
  const currentKeyword = dto.keyword || '';
  agiChatRecord
    .list(dto, pageInfo)
    .then((res: any) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      records.value = res.rows || [];
      highlightKeyword.value = currentKeyword;
      total.value = Number(res.total || 0);
      selectedRows.value = [];
    })
    .catch((err: any) => {
      console.error('--> --> 获取交互记录失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取交互记录失败');
      records.value = [];
      total.value = 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const getHighlightedText = (value?: string | null) => {
  const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, (char) => {
      const entityMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entityMap[char];
    });

  const text = value || '';
  const keyword = highlightKeyword.value.trim();
  if (!keyword) {
    return escapeHtml(text);
  }

  const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let html = '';
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index || 0;
    html += escapeHtml(text.slice(lastIndex, index));
    html += `<mark class="keyword-highlight">${escapeHtml(match[0])}</mark>`;
    lastIndex = index + match[0].length;
  }

  return html + escapeHtml(text.slice(lastIndex));
};

const clearTableSelection = () => {
  tableRef.value?.clearSelection();
  selectedRows.value = [];
};

const handleSearch = (params: any) => {
  dto.keyword = params.keyword || '';
  dto.deptId = params.deptId;
  dto.postId = params.postId;
  dto.start = params.start;
  dto.end = params.end ? `${params.end} 23:59:59.999` : undefined;
  pageInfo.pageNum = 1;
  clearTableSelection();
  apiChatRecordList();
};

const handlePaginationChange = () => {
  clearTableSelection();
  apiChatRecordList();
};

const handleView = (row: AgiChatRecordVO) => {
  if (!row.id || !row.userId) {
    return;
  }

  currentRecord.value = row;
  historyVisible.value = true;
};

const handleDelete = (ids: Array<number | undefined>) => {
  const dataList = ids.filter((id): id is number => Number.isFinite(id));
  if (!dataList.length) {
    return;
  }

  ElMessageBox.confirm(`确定删除选中的 ${dataList.length} 条交互记录吗？删除后不可恢复。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
    .then(() => agiChatRecord.batchDelete(dataList) as Promise<any>)
    .then((res: any) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success('交互记录已删除');
      clearTableSelection();
      apiChatRecordList();
    })
    .catch((err: any) => {
      if (err === 'cancel' || err === 'close') {
        return;
      }
      console.error('--> --> 删除交互记录失败', err);
      ElMessage.closeAll();
      ElMessage.warning('删除交互记录失败');
    });
};

const handleBatchDelete = () => {
  handleDelete(selectedRows.value.map((row: any) => row.id));
};

const handleExport = (rows: any[]) => {
  agiChatRecord.excel(
    rows.length
      ? {
          sessionIdList: rows.map((row: any) => row.id).filter(Boolean)
        }
      : { ...dto },
    {
      ...pageInfo,
      pageNum: 1,
      pageSize: 65536
    }
  );
};

onMounted(apiChatRecordList);
</script>

<style scoped lang="scss">
.monitor-page-shell {
  background-image: url(@/assets/images/agentmonitor/bg_agentmonitor.png);
  background-position: right bottom;
  background-repeat: no-repeat;
  background-size: 100%;
  :deep(.my-page-content) {
    min-width: 0;
  }

  .page-name {
    margin-bottom: 20px;
  }
}

.monitor-page {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.monitor-content-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 20px 24px 24px;
  border-radius: 24px;
  background: #ffffff;
  overflow: hidden;
}

.monitor-search-panel {
  flex: none;

  :deep(.filter-panel) {
    margin-bottom: 16px;
    border: none;
    border-radius: 0;
    background: transparent;

    .el-card__body {
      padding: 0;
    }
  }
}

.table-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.table-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    > span {
      margin-left: 8px;
      color: #77838f;
      font-size: 12px;

      strong {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    :deep(.el-button) {
      margin-left: 0;

      > span {
        display: inline-flex;
        align-items: center;
        gap: 0.5em;
      }
    }
  }
}

.table-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 12px;
}

.monitor-table {
  height: 100%;

  :deep(.keyword-highlight) {
    padding: 0 1px;
    border-radius: 2px;
    background: var(--el-color-danger-light-8);
    color: var(--el-color-danger);
    font-weight: inherit;
  }

  :deep(.el-table__header-wrapper th) {
    background: #f5f7fa;
    color: #77838f;
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.el-table__cell) {
    padding: 12px 0;
    color: #2b2f33;
    font-size: 14px;

    .cell {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  :deep(.el-button.is-link) {
    padding: 0 4px;
    font-size: 14px;
  }

  :deep(.action-link--teal.el-button.is-link) {
    color: #3297a0;
    background: transparent !important;
    background-image: none !important;
    border: none;

    &:hover,
    &:focus {
      color: #66b8bf;
      background: transparent !important;
      background-image: none !important;
    }
  }
}

.table-panel :deep(.page.el-pagination) {
  display: flex;
  flex: none;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
