<script setup lang="ts">
import {
  Search, Plus, Trash2, Edit, CheckCircle2, XCircle, UploadCloud, HelpCircle,
  Info, X, ChevronRight, ChevronDown, RefreshCw, Sparkles, Check, FileText,
  AlertCircle, BookOpen, Layers, Undo2, ArrowRight, Eye, ShieldAlert, BadgeCheck,
  FolderTree, Settings2, Shield, Lock, ShieldCheck, UserCheck, KeyRound, Globe,
  Database, User as UserIcon, Play, Loader2, Save, Send, EyeOff, Terminal,
  Bold, Italic, Underline, ImageIcon, Video, Paperclip, Link, Type, MessageSquare
} from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

import FaqDetailPermissionsCard from './FaqDetailPermissionsCard.vue'
import FaqDetailPermissionsAddWhiteList from './FaqDetailPermissionsAddWhiteList.vue'
import { detailKnowledgeFaqApi, listKnowledgeFaqApi, getKnowledgeFaqPermissionsApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, AjaxResult, KnowledgeAuthEntity, SysDept } from '@/types'
import { listDept } from '@/api/system/dept.js'
import DeptService, { TreeDept, deptTreeProps } from '@/service/deptService'
import { AuthTypes } from '@/api/knowledgeLib/knowledgeAuth.js'
import { CardPermissions, CardConfig } from './Permission.js'

// import type { CategoryVO } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'


// const isDev = import.meta.env.DEV;
// const { proxy } = getCurrentInstance();

const emit = defineEmits(['back'])

const props = defineProps({
  item: {
    type: Object as () => KnowledgeFaqEntity,
    default: () => ({})
  }
})
// const domainService = DomainServiceFactory()
// const selectedDomain = ref(allCategoryId)


const state = reactive({
  item: {} as KnowledgeFaqEntity,
  dateRange: [], // 时间范围
  searchInfo: {
    query: '',
    status: 'all',
    domain: 'all',
    mode: 'all',
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
  cardsPermissions: []
})
let allAuthList: KnowledgeAuthEntity[] = [];

const cardConfigs: CardConfig[] = [
  {
    type: 'manageFlag',
    title: '拥有管理与上传配置权',
    description: '允许修改 FAQ 的内容结构与状态。',
    icon: h(ShieldCheck, { className: 'w-4 h-4 text-blue-600' }),
  },
  {
    type: 'queryFlag',
    title: '允许智能问答与检索',
    description: '在 AI 会话中可命中并匹配这里的问答。',
    icon: h(Eye, { className: 'w-4 h-4 text-emerald-600' }),
  },
  {
    type: 'downloadFlag',
    title: '允许原文件下载导出',
    description: '允许导出 FAQ Excel 配置包。',
    icon: h(UploadCloud, { className: 'w-4 h-4 text-amber-600' }),
  },
];
const showPermPickerModal = ref(false)
const addHoldInfo = ref<{ config: CardConfig, index: number } | null>(null);

const handleAdd = (event: { config: CardConfig }, index: number) => {
  addHoldInfo.value = { ...event, index }
  // const { item, config } = event
  // if (item.permissions) {
  //   item.permissions[config.type] = item.permissions[config.type] || []
  // }
  showPermPickerModal.value = true
}

const deptService = DeptService({ autoLoad: false })

const getAuthList = () => {
  const item: KnowledgeFaqEntity = state.item
  getKnowledgeFaqPermissionsApi(item.id!).then((res: AjaxResult<KnowledgeAuthEntity[]>) => {
    if (res.code === 200) {
      allAuthList = res.data || []
      buildCardsPermissions()
    }
  })
}
const buildCardsPermissions = () => {
  const manageCardPermissions: CardPermissions = {
    deptPermissions: [],
    positionPermissions: [],
    groupPermissions: [],
  }
  const queryCardPermissions: CardPermissions = {
    deptPermissions: [],
    positionPermissions: [],
    groupPermissions: [],
  }
  const downloadCardPermissions: CardPermissions = {
    deptPermissions: [],
    positionPermissions: [],
    groupPermissions: [],
  }
  const cardsPermissions: CardPermissions[] = [
    manageCardPermissions,
    queryCardPermissions,
    downloadCardPermissions,
  ];
  allAuthList.forEach((auth: KnowledgeAuthEntity) => {
    let cardPermissions: CardPermissions | null = null
    const add = (cardPermissions: CardPermissions, auth: KnowledgeAuthEntity) => {
      const authType = auth.authType
      if (authType === AuthTypes.DEPT) {
        cardPermissions.deptPermissions.push(auth)
      } else if (authType === AuthTypes.POST) {
        cardPermissions.positionPermissions.push(auth)
      } else if (authType === AuthTypes.USERGROUP) {
        cardPermissions.groupPermissions.push(auth)
      }
    }
    if (auth.manageFlag) {
      cardPermissions = manageCardPermissions
      add(cardPermissions, auth)
    }
    if (auth.queryFlag) {
      cardPermissions = queryCardPermissions
      add(cardPermissions, auth)
    }
    if (auth.downloadFlag) {
      cardPermissions = downloadCardPermissions
      add(cardPermissions, auth)
    }
    // if (!cardPermissions) {
    //   return;
    // }
    // const authType = auth.authType
    // if (authType === AuthTypes.DEPT) {
    //   cardPermissions.deptPermissions.push(auth)
    // } else if (authType === AuthTypes.POST) {
    //   cardPermissions.positionPermissions.push(auth)
    // } else if (authType === AuthTypes.USERGROUP) {
    //   cardPermissions.groupPermissions.push(auth)
    // }
  })
  console.log('cardsPermissions', cardsPermissions)
  state.cardsPermissions = cardsPermissions
}

watch(
  () => props.item,
  (item: KnowledgeFaqEntity | null) => {
    state.item = item;
    if (item) {
      getAuthList()
      deptService.load()
    }
  },
  { immediate: true }
)

</script>

<template>
  <div class="FaqDetailPermissions">
    <div class="FaqDetailPermissions-list">
      <FaqDetailPermissionsCard v-for="(config, i) in cardConfigs" :key="config.type" :config="config"
        :item="state.item" :permissions="state.cardsPermissions[i]" :deptService="deptService" @change="getAuthList"
        @add="handleAdd($event, i)" />
    </div>
    <FaqDetailPermissionsAddWhiteList v-model="showPermPickerModal" :item="state.item" :config="addHoldInfo?.config"
      :permissions="state.cardsPermissions[addHoldInfo?.index || 0]" :deptService="deptService" @change="getAuthList" />
  </div>
</template>
<style scoped lang="scss">
.FaqDetailPermissions {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.FaqDetailPermissions-list {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 16px;
  min-width: 0;
  overflow: hidden;

  .FaqDetailPermissionsCard {
    flex: 1 0 33.3%;
    min-width: 0;
    height: 100%;
  }
}
</style>
