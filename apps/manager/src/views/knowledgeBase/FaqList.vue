<template>
  <section class="knowledge-faq-list-page">
    <page-name :title="libName">
      <el-button type="primary" @click="goBack">
        {{ $t('page.normal.back', '返回') }}
      </el-button>
    </page-name>
    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input
              v-model="queryParams.keyword"
              :placeholder="$t('page.knowledgeFaq.searchPlaceholder', '搜索问答')"
              class="search-bar__input"
              clearable
              :prefix-icon="Search"
              @keyup.enter="loadTableData"
              @clear="loadTableData"
            />
          </div>
          <el-select-v2
            v-model="queryParams.tagIds"
            :options="tagOptionsWithId"
            :placeholder="$t('page.knowledgeFaq.tagPlaceholder', '请选择标签')"
            style="max-width: 300px"
            clearable
            multiple
            @clear="loadTableData"
          >
          </el-select-v2>
          <el-button @click="resetQuerySearch">
            {{ $t('page.normal.reset', '重置') }}
          </el-button>
          <el-button type="primary" @click="loadTableData">
            {{ $t('page.normal.search', '搜索') }}
          </el-button>
        </div>
      </template>
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
          :label="$t('page.knowledgeFaq.qaId', '问答ID')"
          align="left"
          prop="id"
          :width="$dim('page.knowledgeFaq.qaId', 320)"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.knowledgeFaq.standardQuestion', '标准问题')"
          align="left"
          prop="standardQuestion"
          :min-width="$dim('page.knowledgeFaq.standardQuestion', 220)"
          :show-overflow-tooltip="true"
        />
        <el-table-column
          :label="$t('page.knowledgeFaq.similarQuestions', '相似问题')"
          align="left"
          prop="similarQuestions"
          :width="$dim('page.knowledgeFaq.similarQuestions', 220)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.similarQuestions?.join(',') }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeFaq.negativeQuestions', '反例问题')"
          align="left"
          prop="negativeQuestions"
          :width="$dim('page.knowledgeFaq.negativeQuestions', 220)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.negativeQuestions?.join(',') }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeFaq.answers', '答案')"
          align="left"
          prop="answers"
          :width="$dim('page.knowledgeFaq.answers', 220)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ scope.row.answers?.join(',') }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.knowledgeFaq.tagName', '标签名称')"
          align="left"
          prop="tagName"
          :width="$dim('page.knowledgeFaq.tagName', 100)"
          :show-overflow-tooltip="true"
        >
          <template #default="scope">
            <span>{{ getTagName(scope.row.tagId) || scope.row.tagName }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column
          :label="$t('page.knowledgeFaq.createdAt', '创建时间')"
          align="left"
          prop="createdAt"
          :width="$dim('page.knowledgeFaq.createdAt', 180)"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column> -->
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          prop="operation"
          align="left"
          :width="$dim('page.knowledgeFaq.operation', 120)"
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
      <template #footer>
        <pagination
          class="pagination-area"
          v-show="total > 0"
          :total="total"
          v-model:page="pageParams.pageNum"
          v-model:limit="pageParams.pageSize"
          @pagination="loadTableData"
        />
      </template>
    </page-content>
    <FaqDetail v-model:visible="detailVisible" :entity="detailEntity" />
  </section>
</template>

<script setup lang="ts" name="KnowledgeFaqList">
import type { PropType } from 'vue';
import { ref, reactive, onMounted } from '@vue/runtime-core';
import { Search } from 'lucide-vue-next';
import {
  // AjaxResult,
  KnowledgeBaseEntity,
  KnowledgeFaqEntity
  // KnowledgeFileFoldersNode,
  // KnowledgeFileListReq,
  // TableShowColumns
} from '@/types';

import { useI18n } from 'vue-i18n';

import { getKnowledgeBaseSingleApi } from '@/api/data/knowledgeBase.js';

import FaqDetail from './components/FaqDetail.vue';
// import { formatSize } from '@/utils';
import faqQueryUse from './faqList/faqQueryUse';
import faqTagUse from './faqList/faqTagUse';
// import useTableData from '@/composables/useTableData';

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

const { t } = useI18n();
const $t = t;
const goBack = () => {
  emit('back');
};

const libInfo = ref<KnowledgeBaseEntity>({});
const libName = computed(() => libInfo.value.name || libInfo.value.id);

const { pageParams, queryParams, tableData, loading, total, loadTableData, resetQuerySearch, handleDelete } = faqQueryUse(props.libId);
const { tagOptionsWithId, loadTags, getTagName } = faqTagUse();

const loadTagsData = () => {
  return loadTags(props.libId);
};

const loadLibInfo = () => {
  getKnowledgeBaseSingleApi(props.libId).then((res) => {
    libInfo.value = res.data || {};
  });
};

/** 选择条数  */
function handleSelectionChange(selection: KnowledgeFaqEntity[]) {}
function handleRowClick(row: KnowledgeFaqEntity, column: any) {
  if (column.property === 'operation') {
    return;
  }
  handleDetail(row);
}
const detailVisible = ref(false);
const detailEntity = ref<KnowledgeFaqEntity>({});
function handleDetail(row: KnowledgeFaqEntity) {
  detailVisible.value = true;
  detailEntity.value = row;
}
// function handleDelete(row: KnowledgeFaqEntity) {
//   const id = row.id!;
//   const message = t('page.knowledgeBase.deleteFaqConfirm', { name: row.fileName }, `是否确认删除问答库 ${row.fileName} 数据项？`);
//   proxy.$modal.confirm(message).then(
//     function () {
//       return doDelete(id);
//     },
//     () => {}
//   );
// }
// function doDelete(id: number | string) {
//   deleteKnowledgeFileSingleApi(id).then((res) => {
//     if (res.code === 200) {
//       proxy.$message.success(t('page.normal.deleteSuccess'));
//       if (filesTableData.value.length === 1 && pageParams.value.pageNum > 1) {
//         pageParams.value.pageNum--;
//       }
//       loadFilesTableData();
//     }
//   });
// }

watch(
  () => props.libId,
  (newVal: string) => {
    if (newVal) {
      loadTableData();
      loadTagsData();
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

<style scoped lang="scss"></style>
