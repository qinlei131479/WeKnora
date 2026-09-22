<template>
  <section class="knowledge-file-list-page">
    <page-name :title="libName">
      <el-button type="primary" @click="goBack">
        {{ $t('page.normal.back', '返回') }}
      </el-button>
    </page-name>
    <page-content>
      <div class="knowledge-file-list-content">
        <div ref="treeHeightRef" class="knowledge-file-list-left">
          <!-- <div class="left-view"></div> -->
          <el-tree-v2
            ref="folderTreeRef"
            v-if="folderTreeData"
            :data="folderTreeData"
            :props="folderTreeProps"
            :height="treeHeight"
            :item-size="40"
            :default-expanded-keys="folderTreeIds"
            :expand-on-click-node="false"
            :current-node-key="folderTreeData[0]?.id || ''"
            highlight-current
            @current-change="handleTreeCurrentChange"
          >
            <template #default="{ node, data }">
              <el-icon class="node-icon" :class="{ 'is-leaf': node.isLeaf }">
                <Folder v-if="node.isLeaf" />
                <Folder v-else-if="!node.expanded" />
                <FolderOpen v-else />
              </el-icon>
              <div class="tree-node-content">
                <label>{{ node.label }}</label>
                <span>{{ data.totalCount }}</span>
              </div>
            </template>
          </el-tree-v2>
        </div>
        <div class="knowledge-file-list-right">
          <div class="search-bar">
            <div class="search-bar__keyword">
              <el-input
                v-model="queryParams.keyword"
                class="search-bar__input"
                :placeholder="$t('page.knowledgeFile.searchPlaceholder', '搜索文档')"
                clearable
                :prefix-icon="Search"
                @keyup.enter="loadTableData"
                @clear="loadTableData"
              />
            </div>
            <el-autocomplete
              v-model="queryParams.fileType"
              style="max-width: 300px"
              value-key="name"
              :placeholder="$t('page.knowledgeFile.fileTypePlaceholder', '文件类型')"
              clearable
              hide-loading
              :suffix-icon="Search"
              :trigger-on-focus="false"
              :fetch-suggestions="getFileTypeSuggestions"
              @keyup.enter="loadTableData"
              @clear="loadTableData"
            />
            <el-button @click="resetQuerySearch">
              {{ $t('page.normal.reset', '重置') }}
            </el-button>
            <el-button type="primary" @click="loadTableData">
              {{ $t('page.normal.search', '查询') }}
            </el-button>
          </div>
          <div class="table-area">
            <el-table ref="tableRef" v-loading="loading" :data="tableData" height="100%" @row-click="handleRowClick">
              <template #empty>
                <kjsc-empty />
              </template>
              <el-table-column
                :label="$t('page.knowledgeFile.fileName', '文件名')"
                align="left"
                prop="fileName"
                :min-width="$dim('page.knowledgeFile.fileName', 200)"
                :show-overflow-tooltip="true"
              />
              <el-table-column
                :label="$t('page.knowledgeFile.fileType', '文件类型')"
                align="left"
                prop="fileType"
                :width="$dim('page.knowledgeFile.fileType', 220)"
                :show-overflow-tooltip="true"
              />
              <el-table-column
                :label="$t('page.knowledgeFile.fileSize', '文件大小')"
                align="left"
                prop="fileSize"
                :width="$dim('page.knowledgeFile.fileSize', 120)"
                :show-overflow-tooltip="true"
              >
                <template #default="scope">
                  <span>{{ formatSize(scope.row.fileSize) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('page.knowledgeFile.parseStatus', '解析状态')"
                align="left"
                prop="parseStatus"
                :width="$dim('page.knowledgeFile.parseStatus', 120)"
                :show-overflow-tooltip="true"
              >
                <template #default="{ row }">
                  <template v-if="statusByRow.get(row.id)">
                    <el-tag v-if="statusByRow.get(row.id)!.label !== '--'" :type="statusByRow.get(row.id)!.theme" class="row-status-tag">
                      <template v-if="statusByRow.get(row.id)!.icon">
                        <el-icon :class="{ 'is-loading': statusByRow.get(row.id)!.spin }">
                          <component :is="statusByRow.get(row.id)!.icon!" />
                        </el-icon>
                      </template>
                      {{ statusByRow.get(row.id)!.label }}
                    </el-tag>
                    <span v-else class="row-muted">--</span>
                  </template>
                  <!-- <div class="indexingStrategy-cell">
                    <el-tag v-if="scope.row.indexingStrategy?.vector_enabled">{{
                      $t('page.knowledgeFile.indexingStrategys.vector', 'RAG检索')
                    }}</el-tag>
                    <el-tag v-if="scope.row.indexingStrategy?.wiki_enabled">{{
                      $t('page.knowledgeFile.indexingStrategys.wiki', 'Wiki 知识库')
                    }}</el-tag>
                  </div> -->
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('page.knowledgeFile.channel', '来源渠道')"
                align="left"
                prop="channel"
                :width="$dim('page.knowledgeFile.channel', 200)"
                :show-overflow-tooltip="true"
              >
                <template #default="scope">
                  <span>{{ scope.row.channel }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('page.knowledgeFile.createdAt', '创建时间')"
                align="left"
                prop="createdAt"
                :width="$dim('page.knowledgeFile.createdAt', 180)"
              >
                <template #default="scope">
                  <span>{{ parseTime(scope.row.createdAt) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('page.normal.operation', '操作')"
                prop="operation"
                align="left"
                :width="$dim('page.knowledgeFile.operation', 120)"
                fixed="right"
              >
                <template #default="scope">
                  <el-button link type="primary" @click="handleDetail(scope.row)" v-hasPermi="['business:knowledgeBases:query']">
                    {{ $t('page.normal.detail') }}
                  </el-button>
                  <el-button link type="danger" @click="handleDelete(scope.row.id, scope.row)" v-hasPermi="['business:knowledgeBases:remove']">
                    {{ $t('page.normal.remove') }}
                  </el-button>
                  <!-- <el-button v-if="!scope.row.isActive" link type="info" @click="handleEnable(scope.row)" v-hasPermi="['business:knowledgeBases:edit']">
                    {{ $t('page.normal.enable') }}
                  </el-button>
                  <el-button v-else link type="info" @click="handleDisable(scope.row)" v-hasPermi="['business:knowledgeBases:edit']">
                    {{ $t('page.normal.disable') }}
                  </el-button> -->
                </template>
              </el-table-column>
            </el-table>
          </div>
          <pagination
            class="pagination-area"
            v-show="total > 0"
            :total="total"
            v-model:page="pageParams.pageNum"
            v-model:limit="pageParams.pageSize"
            @pagination="loadTableData"
          />
        </div>
      </div>
    </page-content>

    <!-- 详情抽屉 -->
    <FileDetailDrawer v-model:visible="detailVisible" :entity="detailEntity" />
  </section>
</template>

<script setup lang="ts" name="KnowledgeFileList">
import type { Component, PropType } from 'vue';
import { ref, onMounted } from '@vue/runtime-core';
import { Folder, FolderOpen, LoaderCircle, CircleX } from 'lucide-vue-next';
import { KnowledgeBaseEntity, KnowledgeFileEntity, KnowledgeFileFoldersNode, KnowledgeFileListReq, TableShowColumns } from '@/types';
// import { useI18n } from 'vue-i18n';
import { t } from '@/i18n';
import { Search } from 'lucide-vue-next';
import { getKnowledgeBaseSingleApi } from '@/api/data/knowledgeBase.js';
import { formatSize } from '@/utils';
import folderUse from './fileList/folderUse';
import filesQueryUse from './fileList/filesQueryUse';
import FileDetailDrawer from './components/FileDetailDrawer.vue';

const emit = defineEmits(['back']);

const props = defineProps({
  libId: {
    type: String,
    default: ''
  },
  lib: {
    type: Object as PropType<KnowledgeBaseEntity>,
    default: () => void 0
  }
});

// const { t } = useI18n();
// const $t = t;
const goBack = () => {
  emit('back');
};

// const i18nTexts = ref({
//   enable: t('page.normal.enable'),
//   disable: t('page.normal.disable')
// });
const libInfo: Ref<KnowledgeBaseEntity> = ref({});
const libName = computed(() => libInfo.value.name || libInfo.value.id);

const { folderTreeData, folderTreeProps, folderTreeIds, loadFolderTreeData } = folderUse({ t }, props.libId);

const {
  pageParams,
  queryParams,
  tableData,
  loading,
  total,
  loadTableData,
  resetQuerySearch: resetFileQuerySearch,
  resetParams,
  handleDelete
} = filesQueryUse(props.libId);
const folderTreeRef = ref<{ setCurrentKey: (key?: string | number) => void }>();

const resetQuerySearch = () => {
  queryParams.value.folderPath = '';
  pageParams.value.pageNum = 1;
  folderTreeRef.value?.setCurrentKey(folderTreeData.value?.[0]?.id);
  resetFileQuerySearch();
};

const loadLibInfo = () => {
  getKnowledgeBaseSingleApi(props.libId).then((res) => {
    libInfo.value = res.data || {};
  });
};

const treeHeightRef = ref<HTMLDivElement>();
const treeHeight = ref<number>(200);

onMounted(() => {
  treeHeight.value = treeHeightRef.value?.clientHeight || 200;
  console.log('treeHeight', treeHeight.value);
});

/** 树节点点击事件 */
function handleTreeCurrentChange(data: KnowledgeFileFoldersNode, node: any) {
  // console.log('handleTreeCurrentChange', data, node);
  resetParams();
  const queryParamsValue: KnowledgeFileListReq = queryParams.value;
  queryParamsValue.folderPath = data.path;
  // pageParams.value.pageNum = 1;
  loadTableData();
}

const allSuggestionFileTypes = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'markdown',
  'json',
  'log',
  'yaml',
  'yml',
  'xml',
  'html',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'mp3',
  'wav',
  'm4a',
  'flac',
  'ogg',
  'aac'
];
function getFileTypeSuggestions(queryString: string, cb: any) {
  let fileTypes = allSuggestionFileTypes;
  if (queryString) {
    fileTypes = fileTypes.filter((item) => item.includes(queryString));
  }
  cb(fileTypes.map((item) => ({ name: item })));
}

function handleRowClick(row: KnowledgeFileEntity, column: any) {
  if (column.property === 'operation') {
    return;
  }
  // showFiles(row);
}
const detailVisible = ref<boolean>(false);
const detailEntity = ref<KnowledgeFileEntity>({});
function handleDetail(row: KnowledgeFileEntity) {
  detailVisible.value = true;
  detailEntity.value = row;
}

interface StatusInfo {
  label: string;
  theme: 'success' | 'warning' | 'danger' | 'primary' | 'default';
  icon?: Component;
  spin?: boolean;
}
const computeStatus = (item: KnowledgeFileEntity): StatusInfo => {
  if (item.parseStatus === 'pending' || item.parseStatus === 'processing') {
    return { label: t('page.knowledgeBase.statuss.statusProcessing'), theme: 'primary', icon: LoaderCircle, spin: true };
  }
  // finalizing = primary parse done, enrichment subtasks still running.
  // While in this phase, prefer the specific "summary generating" copy
  // when summary is what's actually outstanding (preserves the old UX
  // where this label was tied to completed+summary_pending). Otherwise
  // fall back to the generic "finalizing" label — covers question gen
  // and graph extract, which the user historically had no visibility on.
  if (item.parseStatus === 'finalizing') {
    if (item.summaryStatus === 'pending' || item.summaryStatus === 'processing') {
      return { label: t('page.knowledgeBase.statuss.generatingSummary'), theme: 'primary', icon: LoaderCircle, spin: true };
    }
    return { label: t('page.knowledgeBase.statuss.statusFinalizing'), theme: 'primary', icon: LoaderCircle, spin: true };
  }
  if (item.parseStatus === 'failed') {
    return { label: t('page.knowledgeBase.statuss.statusFailed'), theme: 'danger', icon: CircleX };
  }
  if (item.parseStatus === 'cancelled') {
    return { label: t('page.knowledgeBase.statuss.statusCancelled'), theme: 'warning', icon: CircleX };
  }
  if (item.parseStatus === 'draft') {
    return { label: t('page.knowledgeBase.statuss.statusDraft'), theme: 'warning' };
  }
  // Legacy completed+summary_pending path: kept as a defensive fallback
  // for rows that bypassed finalizing (no enrichment configured, or
  // upgraded mid-flight from a pre-finalizing build).
  if (item.parseStatus === 'completed' && (item.summaryStatus === 'pending' || item.summaryStatus === 'processing')) {
    return { label: t('page.knowledgeBase.statuss.generatingSummary'), theme: 'primary', icon: LoaderCircle, spin: true };
  }
  if (item.parseStatus === 'completed') {
    return { label: t('page.knowledgeBase.statuss.statusCompleted'), theme: 'success' };
  }
  return { label: '--', theme: 'default' };
};

const statusByRow = computed(() => {
  const map = new Map<string, StatusInfo>();
  for (const item of tableData.value) if (item.id !== undefined) map.set(item.id, computeStatus(item));
  return map;
});

watch(
  () => props.libId,
  (newVal: string) => {
    if (newVal) {
      loadFolderTreeData();
      loadTableData();
      if (props.lib) {
        libInfo.value = props.lib;
      } else {
        loadLibInfo();
      }
    }
  },
  {
    immediate: true
  }
);
</script>

<style scoped lang="scss">
.knowledge-file-list-content {
  height: 100%;
  width: 100%;
  overflow: auto;
  display: flex;
  min-width: 0;
  .knowledge-file-list-left {
    width: 300px;
    height: 100%;
    flex-shrink: 0;
    overflow: hidden;
    min-width: 0;
    padding: 0 16px;
    --el-color-primary-light-9: #f3f3f3;
  }
  .knowledge-file-list-right {
    flex: 1;
    overflow: auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}
.el-tree {
  --el-tree-text-color: #0c110f;
  // font-size: 16px;
  // font-weight: 500;
  :deep(.is-current) {
    color: var(--el-color-primary);
  }
}
.tree-node-content {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
  margin-left: 5px;
  label {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 5px;
    font-weight: inherit;
  }
}
.knowledge-file-list-right {
  .search-area {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    .el-input {
      width: 300px;
    }
    .el-select {
      width: 300px;
    }
  }
  .table-area {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }
  .pagination-area {
    margin-top: 10px;
  }
}
.row-status-tag {
  :deep(.el-tag__content) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
}
</style>
