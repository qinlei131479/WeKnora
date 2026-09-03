<template>
  <section class="knowledge-lib-list-page">
    <page-name></page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.name"
              class="search-bar__input"
              clearable
              :prefix-icon="Search"
              :placeholder="$t('page.knowledgeBase.searchPlaceholder', '搜索知识库名称')"
              @keyup.enter="handleQuery"
              @clear="handleQuery"
            />
            <!-- <button type="button" class="search-bar__icon-btn" @click="handleQuery">
              <svg-icon icon-class="search" class="search-bar__icon" />
            </button> -->
          </div>

          <!-- <div class="search-bar__date-wrap">
            <el-date-picker v-model="dateRange" class="search-bar__date" value-format="YYYY-MM-DD" type="daterange"
              :range-separator="$t('page.mcp.range_separator')"
              :start-placeholder="$t('page.mcp.start_date.placeholder')"
              :end-placeholder="$t('page.mcp.end_date.placeholder')" />
          </div> -->

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <div class="action-toolbar" style="display: none">
        <div class="action-toolbar__left">
          <!-- <button type="button" class="toolbar-btn" :disabled="multiple" v-hasPermi="['system:dict:remove']"
            @click="handleDelete()">
            {{ $t('page.normal.batchDelete', '批量删除') }}
          </button> -->
          <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']" @click="handleEnable()">
            {{ $t('page.normal.batchEnable', '批量启用') }}
          </button>
          <button type="button" class="toolbar-btn" :disabled="ids.length === 0" v-hasPermi="['business:tenants:edit']" @click="handleDisable()">
            {{ $t('page.normal.batchDisable', '批量停用') }}
          </button>
          <span class="selected-text"
            >{{ $t('page.normal.selected', '共选中') }} <span>{{ ids.length }}</span> {{ $t('page.normal.items', '条') }}</span
          >
        </div>

        <div class="action-toolbar__right">
          <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:export']" @click="handleExport">导出</button> -->
          <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:remove']"
            @click="handleRefreshCache">刷新缓存</button> -->
          <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" /> -->
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        height="100%"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          :label="$t('page.knowledgeBase.id', '编号')"
          align="left"
          key="id"
          prop="id"
          :width="$dim('page.knowledgeBase.id', 100)"
          v-if="columns.id.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.knowledgeBase.name', '知识库名称')"
          align="left"
          key="name"
          prop="name"
          :width="$dim('page.knowledgeBase.name', 220)"
          v-if="columns.name.visible"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.knowledgeBase.type', '知识库类型')"
          align="left"
          key="type"
          prop="type"
          :width="$dim('page.knowledgeBase.type', 120)"
          v-if="columns.type.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <KnowledgeBaseTypeTag :type="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.indexingStrategy', '索引策略')"
          align="left"
          key="indexingStrategy"
          prop="indexingStrategy"
          :width="$dim('page.knowledgeBase.indexingStrategy', 120)"
          v-if="columns.indexingStrategy.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <div class="indexingStrategy-cell">
              <el-tag v-if="scope.row.indexingStrategy?.vector_enabled">{{ $t('page.knowledgeBase.indexingStrategys.vector', 'RAG检索') }}</el-tag>
              <el-tag v-if="scope.row.indexingStrategy?.wiki_enabled">{{ $t('page.knowledgeBase.indexingStrategys.wiki', 'Wiki 知识库') }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.llmModel', 'LLM语言大模型')"
          align="left"
          key="llmModel"
          prop="llmModel"
          :width="$dim('page.knowledgeBase.llmModel', 200)"
          v-if="columns.llmModel.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.summaryModel?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.embeddingModel', 'Embedding嵌入模型')"
          align="left"
          key="embeddingModel"
          prop="embeddingModel"
          :width="$dim('page.knowledgeBase.embeddingModel', 200)"
          v-if="columns.embeddingModel.visible"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.embeddingModel?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.vectorStore', '向量储存')"
          align="left"
          key="vectorStore"
          prop="vectorStore"
          :width="$dim('page.knowledgeBase.vectorStore', 200)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.vectorStore?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.splitStrategy', '分块策略')"
          align="left"
          key="splitStrategy"
          prop="splitStrategy"
          :width="$dim('page.knowledgeBase.splitStrategy', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ getKBChunkStrategyOptionLabel(scope.row.chunkingConfig?.strategy) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.multiModal', '多模态功能')"
          align="left"
          key="multiModal"
          prop="multiModal"
          :width="$dim('page.knowledgeBase.multiModal', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.vlmConfig?.enabled ? i18nTexts.enable : i18nTexts.disable }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.audioRecognition', '音频语音识别')"
          align="left"
          key="audioRecognition"
          prop="audioRecognition"
          :width="$dim('page.knowledgeBase.audioRecognition', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.asrConfig?.enabled ? i18nTexts.enable : i18nTexts.disable }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.knowledgeGraphs', '知识图谱')"
          align="left"
          key="knowledgeGraphs"
          prop="knowledgeGraphs"
          :width="$dim('page.knowledgeBase.knowledgeGraphs', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.extractConfig?.enabled ? i18nTexts.enable : i18nTexts.disable }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.aiQuestionGeneration', 'AI问题生成')"
          align="left"
          key="aiQuestionGeneration"
          prop="aiQuestionGeneration"
          :width="$dim('page.knowledgeBase.aiQuestionGeneration', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.questionGenerationConfig?.enabled ? i18nTexts.enable : i18nTexts.disable }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.autoTagAssociation', '自动关联标签')"
          align="left"
          key="autoTagAssociation"
          prop="autoTagAssociation"
          :width="$dim('page.knowledgeBase.autoTagAssociation', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.autoTagConfig?.enabled ? i18nTexts.enable : i18nTexts.disable }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.storageEngine', '存储引擎')"
          align="left"
          key="storageEngine"
          prop="storageEngine"
          :width="$dim('page.knowledgeBase.storageEngine', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.storageBackendId ? i18nTexts.enable : i18nTexts.disable }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.tenantId', '关联空间')"
          align="left"
          key="tenantId"
          prop="tenantId"
          :width="$dim('page.knowledgeBase.tenantId', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <div class="tenant-cell">
              <div v-if="scope.row.tenant" class="tenant-cell-name">{{ scope.row.tenant.name }}</div>
              <div class="tenant-cell-id">{{ scope.row.tenantId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeBase.updatedAt', '最新修改时间')"
          align="left"
          prop="updatedAt"
          :width="$dim('page.knowledgeBase.updatedAt', 180)"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.updatedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          prop="operation"
          align="left"
          :width="$dim('page.knowledgeBase.operation', 180)"
          fixed="right"
        >
          <template #default="scope">
            <el-button link type="primary" @click="showManage(scope.row)" v-hasPermi="['business:knowledgeBases:query']">
              {{ $t('page.knowledgeBase.manage') }}
            </el-button>
            <el-button link type="primary" @click="handleDetail(scope.row)" v-hasPermi="['business:knowledgeBases:edit']">
              {{ $t('page.normal.detail') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['business:knowledgeBases:remove']">
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
      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="getList" />
      </template>
    </page-content>

    <!-- 添加或修改对话框 -->
    <!-- <KnowledgeBaseEditorModal v-model:visible="open" :mode="mode" :kbId="kbId" /> -->
    <!-- 详情抽屉 -->
    <KnowledgeBaseDetailDrawer v-model:visible="open" :kbId="kbId" />
  </section>
</template>

<script setup lang="ts" name="KnowledgeLibList">
import { ref, reactive } from '@vue/runtime-core';
import { AjaxResult, KnowledgeBaseEntity, KnowledgeBaseExtends, KnowledgeBaseListReq, TableShowColumns } from '@/types';

import { useI18n } from 'vue-i18n';
import { Search } from 'lucide-vue-next';

import KnowledgeBaseDetailDrawer from './components/KnowledgeBaseDetailDrawer.vue';
import KnowledgeBaseTypeTag from './components/KnowledgeBaseTypeTag.vue';
import { deleteKnowledgeBaseSingleApi, getKnowledgeBaseListApi } from '@/api/data/knowledgeBase.js';

import { getKBChunkStrategyOptionLabel } from '@/composables/useKBChunk.js';
import { parseEntity } from '@/composables/useKnowledge.js';

const emit = defineEmits(['manage']);
const { proxy } = getCurrentInstance();

const { t } = useI18n();
const $t = t;

const i18nTexts = ref({
  enable: t('page.normal.enable'),
  disable: t('page.normal.disable')
});

const tableData = ref<KnowledgeBaseExtends[]>([]) as { value: KnowledgeBaseExtends[] };
// const tableRef = ref();
const loading = ref<boolean>(true);
// const showSearch = ref<boolean>(true)
const ids = ref<string[]>([]);
const single = ref<boolean>(true);
const multiple = ref<boolean>(true);
const total = ref<number>(0);
// 列显隐信息
const columns = ref<Record<string, TableShowColumns>>({
  id: { label: $t('page.knowledgeBase.id', '编号'), visible: true },
  name: { label: $t('page.knowledgeBase.name', '知识库名称'), visible: true },
  type: { label: $t('page.knowledgeBase.type', '知识库类型'), visible: true },
  indexingStrategy: { label: $t('page.knowledgeBase.indexingStrategy', '索引策略'), visible: true },
  llmModel: { label: $t('page.knowledgeBase.llmModel', 'LLM语言大模型'), visible: true },
  embeddingModel: { label: $t('page.knowledgeBase.embeddingModel', 'Embedding嵌入模型'), visible: true }
});

const open = ref<boolean>(false);
let mode: 'create' | 'edit' | 'detail' = 'create';
let kbId = ref<string>('');

const data = reactive({
  queryParams: {
    name: undefined
  } as KnowledgeBaseListReq,
  pageParams: {
    // orderByColumn: 'createTime',
    // isAsc: 'desc',
    pageNum: 1,
    pageSize: 10
  }
});

const { queryParams, pageParams } = toRefs(data);

/** 查询知识库列表 */
function getList() {
  loading.value = true;
  const params: KnowledgeBaseListReq = queryParams.value;
  getKnowledgeBaseListApi(params, pageParams.value).then(
    (res) => {
      loading.value = false;
      tableData.value = (res.rows || []).map(parseEntity);
      total.value = +res.total || 0;
    },
    () => {
      loading.value = false;
    }
  );
  handleSelectionChange([]);
}

/** 搜索按钮操作 */
function handleQuery() {
  pageParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.value.name = undefined;
  handleQuery();
}

/** 删除按钮操作 */
function handleDelete(row: KnowledgeBaseEntity) {
  const id = row.id!;
  const message = t('page.tenantMember.deleteConfirm', '是否确认删除知识库编号为"' + id + '"的数据项？');
  proxy.$modal.confirm(message).then(
    function () {
      return doDelete(id);
    },
    () => {}
  );
}

function doDelete(id: number | string) {
  return deleteKnowledgeBaseSingleApi(id).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.knowledgeBase.deleteSuccess', '删除成功'));
      if (tableData.value.length === 1 && pageParams.value.pageNum > 1) {
        pageParams.value.pageNum--;
      }
      getList();
    }
  });
}

/** 选择条数  */
function handleSelectionChange(selection: KnowledgeBaseEntity[]) {
  ids.value = selection.map((item) => item.id!);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
function handleRowClick(row: KnowledgeBaseEntity, column: any) {
  // if (column.property === 'operation') {
  //   return;
  // }
  // showManage(row);
}

function showManage(row: KnowledgeBaseEntity) {
  console.log('showManage', row);
  emit('manage', {
    id: row.id!,
    type: row.type!,
    row: row
  });
}

// function handleAdd() {
//   mode = 'create';
//   open.value = true;
//   kbId.value = '';
// }
// function handleEdit(row: KnowledgeBaseEntity) {
//   mode = 'edit';
//   open.value = true;
//   kbId.value = row.id!;
// }
function handleDetail(row: KnowledgeBaseEntity) {
  mode = 'detail';
  open.value = true;
  kbId.value = row.id!;
}

getList();
</script>

<style scoped lang="scss">
.indexingStrategy-cell {
  .el-tag + .el-tag {
    margin-left: 12px;
  }
}
.tenant-cell-name {
  font-weight: bold;
}
</style>
