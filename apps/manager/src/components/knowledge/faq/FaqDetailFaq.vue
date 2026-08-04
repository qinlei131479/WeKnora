<script setup lang="ts">
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

import AddInnerCatModa from './AddInnerCatModa.vue'
import FaqDetailFaqLeft from './FaqDetailFaqLeft.vue'
import FaqDetailFaqRight from './FaqDetailFaqRight.vue'

import { folderTreeApi } from '@/api/knowledgeLib/knowledgeFile'
import { detailKnowledgeFaqApi, listKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, AjaxResult, KnowledgeLibFileListEntity, TableDataInfo } from '@/types'

// import type { CategoryVO } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
const isDev = import.meta.env.DEV;
const { proxy } = getCurrentInstance();

const props = defineProps({
  item: {
    type: Object as () => KnowledgeFaqEntity,
    default: () => ({})
  }
})

const state = reactive({
  // dateRange: [], // 时间范围
  item: props.item,
  searchInfo: {
    keyword: '',
    categoryId: null,
  }, // 查询条件
  pageInfo: {
    pageNum: 1,
    pageSize: 10,
  },
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  tableData: [],
  total: 0,
  selectedData: [],
  loading: false,

  addCatParent: null,


  categoryTreeData: [],

  getTreeData: () => { },
  getTableData: (isReset: boolean = false) => { },
})

state.updateSearchCategoryId = (id: number | null) => {
  state.searchInfo.categoryId = id
  state.getTableData?.(true)
}

provide('faqDetailFaq', state)

watch(
  () => props.item,
  (item: KnowledgeFaqEntity | null) => {
    state.item = item;
    // console.log('FaqDetailFaq', item)
    // if (item) {
    //   state.getTreeData()
    //   state.getTableData()
    // }
  },
  { immediate: true }
)
</script>

<template>
  <page-layout row gap="20">
    <template #start>
      <FaqDetailFaqLeft />
    </template>
    <FaqDetailFaqRight />
  </page-layout>
</template>
<style scoped lang="scss">
.tree-row {
  justify-content: space-between;

  &:hover {
    .tree-row-ops {
      display: flex;
    }
  }
}

.tree-row-ops {
  display: none;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
