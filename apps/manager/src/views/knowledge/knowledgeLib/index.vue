<template>
  <my-page>
    <page-layout>
      <template #start>
        <page-name>
          <template v-if="$auth.hasPermi('knowledge:lib:add')">
            <router-link :to="`/knowledge/add?domain=${state.searchInfo.categoryId}`">
              <btn type="success" round>
                <Plus class="w-4 h-4 mr-1" />新建文档知识库
              </btn>
            </router-link>
          </template>
          <template v-else>
            <el-button type="success" disabled round>
              <Lock class="w-4 h-4 mr-1" />
              只读角色禁止新建
            </el-button>
          </template>
        </page-name>
      </template>
      <page-layout row gap="20">
        <template #start>
          <DomainSidebar v-model="state.searchInfo.categoryId" @change="handleSearch" />
        </template>
        <page-layout gap="20">
          <template #start>
            <el-input v-model="state.searchInfo.name" :placeholder="`搜索归属您的 [${getModuleTitleChinese()}] ...`"
              :suffix-icon="Search" clearable @keyup.enter="handleSearch" @input="handleDelaySearch"
              class="mp__search-input" />
          </template>

          <el-scrollbar>
            <!-- <div class="flex items-center justify-between border-b pb-2">
              <h2
                class="text-xs font-bold text-blue-600 border-b-2 border-blue-600 pb-2 -mb-[10px] px-1 uppercase tracking-wider flex items-center gap-1">
                <span>{{ getModuleTitleChinese() }}列表</span>
                <span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono">
                  {{ state.total }} 库
                </span>
              </h2>
              <span class="text-[10px] text-slate-400">已自适应过滤归纳</span>
            </div> -->

            <div v-if="state.tableData.length === 0"
              class="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-6 gap-3">
              <ShieldAlert class="w-12 h-12 text-slate-300 animate-pulse" />
              <div class="space-y-1 max-w-md">
                <p class="text-xs font-bold text-slate-700">未检索到任何符合筛选条件的[{{ getModuleTitleChinese() }}]</p>
                <p class="text-[10px] text-slate-400 leading-relaxed">
                  可能是当前选择的账号 "{{ userStore.nickName || userStore.name || '未知' }}" 的所属部门、职务岗位不具备此安全级别可见。或者尚未在此分类下注册特定规则。
                </p>
              </div>
              <div class="pt-2 flex gap-2">
                <Button @click="state.searchInfo.name = ''; handleSearch()" variant="outline" size="sm"
                  class="text-xs text-slate-600 border-slate-200">
                  清除搜索关键字
                </Button>
                <router-link v-if="$auth.hasPermi('knowledge:lib:add')"
                  :to="`/knowledge/add?domain=${state.searchInfo.categoryId}`">
                  <Button size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    立即创建首项知识库
                  </Button>
                </router-link>
              </div>
            </div>


            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <LibCard v-for="kb in state.tableData" :key="kb.id" :kb="kb" @change="getList" />
            </div>
          </el-scrollbar>
          <template #end>
            <pagination v-show="state.total > 0" :total="state.total" v-model:page="state.pageInfo.pageNum"
              :page-sizes="state.pageSizes" v-model:limit="state.pageInfo.pageSize" @pagination="getList" />
          </template>
        </page-layout>
      </page-layout>
    </page-layout>
  </my-page>
</template>
<script setup lang="ts">
// import { useRouter, useRoute } from 'vue-router'
import {
  Search, Plus, Trash, Play, RefreshCw, Loader2, Globe, Database,
  Folder, UserCheck, Info, ShieldAlert, Lock
} from 'lucide-vue-next'
// import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
// import Card from '@/components/ui/Card.vue'
import DomainSidebar, { allCategoryId } from '@/components/common/DomainSidebar.vue'
// import { getKBs, deleteKB, saveKBs, checkKBPermissions, type KnowledgeBase } from '@/lib/kb-store'
// import { getFlatDomains, isDomainMatch } from '@/lib/domain-store'

import {
  listKnowledgeLibApi,
  // deleteKnowledgeLibApi,
  // detailKnowledgeLibApi
} from '@/api/knowledgeLib/knowledgeLib'

import { KnowledgeLibEntity, KnowledgeLibQueryParams, TableDataInfo } from '@/types'

import LibCard from './components/LibCard.vue'

import useUserStore from "@/store/modules/user";
const userStore = useUserStore();

// const isDev = import.meta.env.DEV;
// const { proxy } = getCurrentInstance();

// const router = useRouter()
// const route = useRoute()

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
  pageSizes: [6, 12, 24, 48],
  sortInfo: { orderByColumn: 'createTime', isAsc: 'desc' }, // 排序
  loading: false, // 加载中
  tableData: [],
  total: 0,
  selectedData: [],

  robotTypes: [],

  saveVisible: false,
  dataId: '',
  previewVisible: false,
  renameVisible: false,
  renameData: null,
});

const getModuleTitleChinese = () => {
  return '本地物理文档接入'
  // if (currentType.value === 'local') return '本地物理文档接入'
  // if (currentType.value === 'web') return '万维网网页链接接入'
  // return '企业数据库 JDBC 定时同步'
}

const getList = () => {
  getTableData();
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
  state.loading = true
  const params: KnowledgeLibQueryParams = { ...state.searchInfo, ...state.pageInfo };
  params.knowledgeType = 0

  // const dateRange = state.dateRange;
  // if (dateRange.length > 0) {
  //   params.startTime = dateRange[0];
  //   params.endTime = dateRange[1];
  // }
  return listKnowledgeLibApi(params).then((res: TableDataInfo<KnowledgeLibEntity>) => {
    state.loading = false
    state.selectedData = [];
    // res.rows = []
    state.tableData = res.rows;
    state.total = +res.total;
    // if (isDev) {
    //   if (!state.tableData.length) {
    //     state.tableData = getKBs()
    //     state.total = state.tableData.length
    //   }
    // }
  }, () => {
    state.loading = false
    // if (isDev) {
    //   state.tableData = getKBs()
    //   state.total = state.tableData.length
    // }
  });
};

getTableData()
</script>
<style scoped lang="scss">
.my-page {
  background-image: url('@/assets/images/knowledge/bg.png');
}
</style>
