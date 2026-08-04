<script setup lang="ts">
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal, Download,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

// import AddInnerCatModa from './AddInnerCatModa.vue'
import FaqImport from './FaqImport.vue'
import FaqItemForm from './FaqItemForm.vue'
import FaqView from './FaqView.vue'

// import { folderTreeApi } from '@/api/knowledgeLib/knowledgeFile'
// import { detailKnowledgeFaqApi, listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, AjaxResult, KnowledgeLibFileListEntity, TableDataInfo, KnowledgeFaqQuestionQueryParams, KnowledgeFaqQuestionEntity } from '@/types'
import { deleteKnowledgeFaqQuestionApi, listKnowledgeFaqQuestionApi } from '@/api/knowledgeLib/knowledgeFaqQuestion.js'
import { resolveStaticPath } from '@/utils/index.js'

// import type { CategoryVO } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
const isDev = import.meta.env.DEV;
const { proxy } = getCurrentInstance();

const state = inject('faqDetailFaq')

const getTableData = (isReset: boolean = false) => {
  if (isReset) {
    state.pageInfo.pageNum = 1;
  }
  const params: KnowledgeFaqQuestionQueryParams = { ...state.searchInfo, ...state.pageInfo };
  // const dateRange = state.dateRange;
  // if (dateRange.length > 0) {
  //   params.startTime = dateRange[0];
  //   params.endTime = dateRange[1];
  // }
  state.loading = true
  params.knowledgeId = state.item?.id
  return listKnowledgeFaqQuestionApi(params).then((res: TableDataInfo<KnowledgeFaqQuestionEntity>) => {
    state.selectedData = [];
    state.tableData = res.rows || (res as any).data;
    state.total = +res.total || 0;
  }, () => {
  }).then(() => {
    state.loading = false
  });
};
let searchTimeout: any = null
const handleDelaySearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchTimeout = 0;
    if (state.loading) {
      handleDelaySearch()
    } else {
      getTableData()
    }
  }, 500)
}

const showFAQEditModal = ref(false)
const editingFAQ = ref<KnowledgeFaqQuestionEntity | null>(null)
const showViewingFAQ = ref(false)
const viewingFAQ = ref<KnowledgeFaqQuestionEntity | null>(null)


const showFAQImportModal = ref(false)

const openFAQFormDialog = (faq: KnowledgeFaqQuestionEntity | null) => {
  editingFAQ.value = faq
  showFAQEditModal.value = true
}

const handleImport = () => {
  showFAQImportModal.value = true
}
const handleAdd = () => {
  openFAQFormDialog(null)
}
const handleEdit = (faq: KnowledgeFaqQuestionEntity | null) => {
  openFAQFormDialog(faq)
}
const handleDelete = (row: KnowledgeFaqQuestionEntity | null) => {
  if (!row) return
  // const name = row.question || '';
  proxy.$modal.confirm('确定彻底删除该 FAQ 问题对吗？').then(function () {
    return deleteRow(row)
  }).catch(() => { })
}
// 删除
const deleteRow = (row: KnowledgeFaqQuestionEntity) => {
  const params: any = row.id!
  return deleteKnowledgeFaqQuestionApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess('删除成功')
      // ElMessage({
      //   message: '删除成功',
      //   type: 'success'
      // });
      getTableData(true);
    }
  });
};
const handleView = (faq: KnowledgeFaqQuestionEntity | null) => {
  // openFAQFormDialog(faq)
  viewingFAQ.value = faq
  showViewingFAQ.value = true
}

const handleDownloadTemplate = () => {
  const path = resolveStaticPath('/template/faq_template.xlsx')
  window.open(path, '_blank')
}
state.getTableData = (isReset: boolean = false) => getTableData(isReset)

watch(
  () => state.item,
  (item: KnowledgeFaqEntity | null) => {
    if (item) {
      getTableData()
    }
  },
  { immediate: true }
)
</script>

<template>
  <page-layout class="FaqDetailFaqRight" gap="20">
    <template #start>
      <div class="search-area">
        <el-input v-model="state.searchInfo.keyword" @keyup.enter="getTableData(true)" @input="handleDelaySearch"
          placeholder="检索当前知识库下关联的条目..." :suffix-icon="Search" class="mp__search-input small"></el-input>
        <div class="search-area-right">
          <btn @click="handleDownloadTemplate">
            下载模板
          </btn>
          <btn class="import-btn" type="primary" @click="handleImport">
            <svg-icon icon-class="mp-import" /> 批量导入文档解析
          </btn>
          <btn @click="handleAdd">
            录入单项问题
          </btn>
        </div>
      </div>
    </template>
    <template #end>
      <pagination v-show="state.total > 0" :total="state.total" v-model:page="state.pageInfo.pageNum"
        v-model:limit="state.pageInfo.pageSize" @pagination="getTableData(false)" />
    </template>
    <div class="main-view">
      <div v-if="!state.tableData?.length" class="text-center py-20 text-slate-400 text-sm flex flex-col items-center">
        <FileText class="w-10 h-10 mb-2 opacity-50" />
        暂无相关 FAQ 数据或未命中关键词
      </div>
      <!-- <div v-else class="h-full flex flex-col overflow-hidden">
        <div class="flex-1 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        </div>
      </div> -->
      <el-table v-else :data="state.tableData" class="data-table" height="100%">
        <el-table-column prop="question" label="标准问题及答案预览" min-width="200">
          <template #default="scope">
            <g-text class="question-title" :content="scope.row.question" popper-class="tooltip-middle">{{
              scope.row.question }}</g-text>
            <g-text class="question-answer" :line="2" :content="scope.row.answer?.replace(/<[^>]*>?/gm, '')"
              popper-class="tooltip-middle">{{
                scope.row.answer?.replace(/<[^>]*>?/gm, '') }}
            </g-text>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="业务分类" width="200">
          <template #default="scope">
            <span class="category-name">{{
              scope.row.categoryName
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="操作编辑" width="200" align="center">
          <template #default="scope">
            <div class="operation-btns">
              <el-button link type="success" @click="handleView(scope.row)">预览</el-button>
              <el-button link type="success" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
              <!-- <Button @click="handleView(scope.row)" variant="ghost" size="sm"
                class="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50">
                <Eye class="w-4 h-4" />
              </Button>
              <Button @click="handleEdit(scope.row)" variant="ghost" size="sm"
                class="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                <Edit class="w-4 h-4" />
              </Button>
              <Button @click="handleDelete(scope.row)" variant="ghost" size="sm"
                class="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                <Trash2 class="w-4 h-4" />
              </Button> -->
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <FaqImport v-model="showFAQImportModal" :knowledge-id="state.item?.id"
      :category-id="state.searchInfo.categoryId || state.categoryTreeData[0]?.id"
      :category-tree-data="state.categoryTreeData" @change="getTableData(true)" />
    <FaqItemForm v-model="showFAQEditModal" :knowledge-id="state.item?.id" :category-id="state.searchInfo.categoryId"
      :item="editingFAQ" :category-tree-data="state.categoryTreeData" @change="getTableData(true)" />

    <FaqView v-model="showViewingFAQ" :item="viewingFAQ" />

  </page-layout>
</template>
<style scoped lang="scss">
.FaqDetailFaqRight {
  .search-area {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .search-area-right {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-left: auto;

    .import-btn {
      .svg-icon {
        width: 24px;
        height: 24px;
      }
    }

    .el-button {
      margin: 0;
    }
  }
}

.main-view {
  background: #FFFFFF;
  border-radius: 24px 24px 24px 24px;
  height: 100%;
  overflow: hidden;
}

.data-table {
  width: 100%;
  height: 100%;
  --el-table-border: 1px solid #E1E6EC;

  :deep(.cell) {
    line-height: 20px;
  }

  :deep(.el-table__cell) {
    padding: 20px 0 19px;
  }

  :deep(.el-table__header-wrapper) {
    th {
      font-size: var(--el-font-size-base);
      color: #2B2F33;
      background: transparent !important;
    }
  }

  .question-title {
    color: #2B2F33;
    margin: 0 38px 0 8px;
  }

  .question-answer {
    line-height: 22px;
    color: #B0BAC6;
    margin: 0 38px 0 8px;
  }

  .category-name {
    background: #F5F5F5;
    border-radius: 4px 4px 4px 4px;
    border: 1px solid #E1E6EC;
    font-weight: 400;
    font-size: 12px;
    color: #77838F;
    line-height: 16px;
    padding: 4px 12px;
    display: inline-block;
    min-width: 80px;
    text-align: center;
    max-width: 178px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .operation-btns {
    // display: flex;
    // align-items: center;
    // justify-content: space-between;
    // gap: 20px;
    --el-color-success: var(--el-color-primary);

    .el-button+.el-button {
      margin-left: 20px;
    }
  }
}
</style>
