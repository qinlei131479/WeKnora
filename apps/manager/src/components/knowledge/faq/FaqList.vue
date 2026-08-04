<script setup lang="ts">
import {
  Search, Plus
} from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
// import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
// import { getDomains, getFlatDomains, isDomainMatch } from '@/lib/domain-store'
// import { getFAQKBs, saveFAQKBs, addFAQKB, deleteFAQKB, type FAQKnowledgeBase, type FAQItem, type FAQCategory } from '@/lib/faq-store'
// import { getUsers, getDepartments, getPositions, getUserGroups, type User } from '@/lib/org-store'
// import { getDefaultPermissions, type KBPermissions } from '@/lib/kb-store'

import FaqCard from './FaqCard.vue'
import FaqSave from './FaqSave.vue'

import { listKnowledgeFaqApi, deleteKnowledgeFaqApi } from '@/api/knowledgeLib/knowledgeFaq'
import type { KnowledgeFaqQueryParams, KnowledgeFaqEntity, TableDataInfo, AjaxResult } from '@/types'

import type { CategoryVO } from '@/types'
// import DomainServiceFactory, { allCategoryName, allCategoryId, baseCategoryId, businessCategoryId } from '@/service/domainService'
import DomainSidebar, { allCategoryId } from '@/components/common/DomainSidebar.vue'

const emit = defineEmits(['detail', 'add'])

// const isDev = import.meta.env.DEV;
const { proxy } = getCurrentInstance();

// const domainService = DomainServiceFactory()

// const domainTreeProps = {
//   children: 'childrenList',
//   label: 'name',
//   value: 'id',
// }

// const domainTreeContainer = ref<HTMLDivElement>(null);
// const treeHeight = ref(200);

const treeRef = ref(null)

const state = reactive({
  dateRange: [], // 时间范围
  searchInfo: {
    name: '',
    categoryId: allCategoryId,
  }, // 查询条件
  pageInfo: {
    pageNum: 1,
    pageSize: 6,
  },
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  tableData: [],
  total: 0,
  selectedData: [],
  loading: false,
  showCreateKBModal: false,
  selectedKB: null,
})

const handleCurrentChange = (data: { item: CategoryVO }) => {
  // console.log('handleCurrentChange', data)
  state.searchInfo.categoryId = data.item?.id || allCategoryId
  getTableData(true)
}

const handleSelectAll = () => {
  state.searchInfo.categoryId = allCategoryId
  if (treeRef.value) {
    treeRef.value.setCurrentKey(null)
  }
  getTableData(true)
}

const showDetail = (dataId: string | number) => {
  emit('detail', dataId)
}

const handleCardClick = (kb: KnowledgeFaqEntity) => {
  if (proxy.$auth.hasPermi('knowledge:faq:setup')) {
    showDetail(kb.id!)
  } else {
    proxy.$modal.msgWarning('您没有权限查看该知识库')
  }
}
const handleCardEdit = (kb: KnowledgeFaqEntity) => {
  state.showCreateKBModal = true
  state.selectedKB = kb
}
const handleCardDelete = (kb: KnowledgeFaqEntity) => {
  proxy.$modal.confirm(`确定彻底删除 [${kb.name}] 吗？不可逆！`).then(function () {
    return deleteRow(kb)
  }).catch(() => { })
}
const deleteRow = (row: KnowledgeFaqEntity) => {
  deleteKnowledgeFaqApi(row.id!).then((res: AjaxResult) => {
    // console.log('deleteBusinessAgentSessionApi', res)
    if (res.code === 200) {
      getTableData(true)
      proxy.$modal.msgSuccess('删除成功')
    }
  }).catch(() => { })
  // state.selectedSession = null
}

const handleAdd = () => {
  state.showCreateKBModal = true
  state.selectedKB = null
}

const handleSearch = () => {
  getTableData()
}
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
      handleSearch()
    }
  }, 500)
}
const getTableData = (isReset: boolean = false) => {
  if (isReset) {
    state.pageInfo.pageNum = 1;
  }
  const params: KnowledgeFaqQueryParams = { ...state.searchInfo, ...state.pageInfo };
  // const dateRange = state.dateRange;
  // if (dateRange.length > 0) {
  //   params.startTime = dateRange[0];
  //   params.endTime = dateRange[1];
  // }
  state.loading = true
  return listKnowledgeFaqApi(params).then((res: TableDataInfo<KnowledgeFaqEntity>) => {
    state.selectedData = [];
    state.tableData = res.rows;
    state.total = +res.total;
  }, () => {
  }).then(() => {
    state.loading = false
  });
};

onMounted(() => {
  // nextTick(() => {
  //   const domainTreeContainerNode = domainTreeContainer.value;
  //   if (domainTreeContainerNode) {
  //     const rect = domainTreeContainerNode.getBoundingClientRect()
  //     treeHeight.value = rect.height
  //   }
  // })
  getTableData()
})
</script>

<template>
  <page-layout>
    <template #start>
      <page-name>
        <btn v-hasPermi="['knowledge:faq:add']" @click="handleAdd" type="success">
          <Plus class="w-3.5 h-3.5 mr-1" /> 新建FAQ知识库
        </btn>
      </page-name>
    </template>
    <page-layout row gap="20">
      <template #start>
        <DomainSidebar v-model="state.searchInfo.categoryId" @change="handleCurrentChange" />
      </template>
      <page-layout gap="20">
        <template #start>
          <el-input v-model="state.searchInfo.name" placeholder="搜索拥有访问权的 FAQ 知识库..." :suffix-icon="Search"
            @keyup.enter="handleSearch" @input="handleDelaySearch" class="mp__search-input" />
        </template>
        <div v-if="state.tableData?.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FaqCard v-for="kb in state.tableData" :key="kb.id" :item="kb" @click="handleCardClick"
            @delete="handleCardDelete" @edit="handleCardEdit" />
        </div>
        <!-- <kjsc-empty v-else :image-size="320"></kjsc-empty> -->
        <div v-else class="text-center text-slate-500">暂无知识库</div>
        <template #end>
          <pagination v-show="state.total > 0" :total="state.total" :page-sizes="[6, 12, 24, 48]"
            v-model:page="state.pageInfo.pageNum" v-model:limit="state.pageInfo.pageSize" @pagination="handleSearch" />
        </template>
      </page-layout>
    </page-layout>
    <FaqSave v-model="state.showCreateKBModal" :item="state.selectedKB" @change="getTableData" />
  </page-layout>
</template>