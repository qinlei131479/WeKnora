<template>
  <page-layout row gap="20">
    <template #start>
      <!-- <div
        class="h-full w-full lg:w-56 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-auto shadow-sm h-fit">
      </div> -->
      <DomainSidebar v-model="selectedDomain" :service="domainService" @change="handleSearch" root-label="全部业务脑"
        :root-domain-id="businessCategoryId" />
    </template>
    <page-layout gap="20">
      <template #start>
        <page-search-form>
          <template #main>
            <el-form-item>
              <el-input placeholder="搜索业务大脑名称/描述..." v-model="searchTerm" @keyup.enter="handleSearch"
                @input="handleDelaySearch" suffix-icon="Search" style="width: 420px" />
            </el-form-item>
          </template>
          <template #right>
            <router-link v-if="$auth.hasPermi('agentic:brain:add')" :to="`/agentic/brain/add?domain=${selectedDomain}`">
              <btn type="success">
                <Plus class="h-3 w-3 mr-1" />新建业务半脑
              </btn>
            </router-link>
          </template>
        </page-search-form>
      </template>
      <div v-if="agents.length === 0"
        class="empty-area py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
        <!-- <BrainCircuit class="w-12 h-12 text-slate-300 mb-4 animate-pulse" /> -->
        <img src="@/assets/images/brain/brain.empty.png" alt="agent-brain" class="w-12 h-12 mb-4 animate-pulse" />
        <p class="empty-text text0">当前分类下暂无已注册的业务半脑</p>
        <p class="empty-text text1">您可以点击右上方按钮为此业务分类装载一个新的思考元</p>
      </div>
      <div v-else class="card-list">
        <el-scrollbar>
          <div class="space-y-6">
            <AgentBrainBusinessCard v-for="(agent, i) in agents" :key="agent.id || i" :agent="agent"
              :service="domainService" @test="handleTest(agent)" @delete="handleDelete(agent)" />
          </div>
        </el-scrollbar>
      </div>
      <template #end>
        <Pagination :total="pageInfo.total" v-model:page="pageInfo.page" v-model:limit="pageInfo.limit"
          @pagination="getList" />
      </template>
    </page-layout>
  </page-layout>
</template>
<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import DomainSidebar from '@/components/common/DomainSidebar.vue';
// import AgentTest from './AgentTest.vue';
import AgentBrainBusinessCard from './AgentBrainBusinessCard.vue';
import DomainServiceFactory, { businessCategoryId } from '@/service/domainService';
import type { BusinessAgentBrainQueryParams, AgentBrainEntity } from '@/types';

import { delBusinessAgentBrainApi, listBusinessAgentBrainApi } from '@/api/agentic/agentBrain';

// import { businessCategoryId } from '@/api/settings/category'

// const isDev = import.meta.env.DEV;
const { proxy } = getCurrentInstance();

const emit = defineEmits(['ready']);
const props = defineProps({
  domain: {
    type: Number,
    default: null
  }
});

const domainService = DomainServiceFactory();

const pageInfo = reactive({
  total: 0,
  page: 1,
  limit: 10
});
const testAgent = ref<AgentBrainEntity | null>(null);
const message = ref('');
const chatLog = ref<{ role: 'user' | 'model'; content: string }[]>([]);
// const isTyping = ref(false)

const searchTerm = ref('');
const selectedDomain = ref<number | null>(props.domain || businessCategoryId);
const agents = ref<AgentBrainEntity[]>([]);
// const activeTab = ref<'business' | 'base'>('business')
const loading = ref(false);

const handleTest = (agent: AgentBrainEntity) => {
  testAgent.value = agent;
  chatLog.value = [{ role: 'model', content: `你好，我是 "${agent.name}" 控制中枢。已加载完整特化业务半脑，我可以开始接收您的输入与指令。` }];
  message.value = '';
};

const handleDelete = (row: AgentBrainEntity) => {
  const name = row.name || '';
  proxy.$modal
    .confirm('是否确认删除半脑名称为"' + name + '"的数据项？')
    .then(function () {
      deleteRow(row);
    })
    .catch(() => { });
};

// 删除
const deleteRow = (row: AgentBrainEntity) => {
  const params: any = row.id!;
  // deleteAgent(params)
  return delBusinessAgentBrainApi(params).then((res) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess('删除成功');
      // ElMessage({
      //   message: '删除成功',
      //   type: 'success'
      // });
      reloadData();
    }
  });
};

const reloadData = () => {
  pageInfo.page = 1;
  getTableData();
};
const getList = () => {
  getTableData();
};
const getTableData = () => {
  const params: BusinessAgentBrainQueryParams = {
    pageNum: pageInfo.page,
    pageSize: pageInfo.limit
  };
  params.categoryId = selectedDomain.value;
  if (searchTerm.value) {
    params.keyword = searchTerm.value;
  }
  loading.value = true;
  listBusinessAgentBrainApi(params).then(
    (res) => {
      loading.value = false;
      agents.value = res.rows || [];
      pageInfo.total = res.total || 0;
    },
    () => {
      loading.value = false;
    }
  );
};
const handleSearch = () => {
  getTableData();
};
let searchTimeout: any = null;
const handleDelaySearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    searchTimeout = 0;
    if (loading.value) {
      handleDelaySearch();
    } else {
      handleSearch();
    }
  }, 500);
};

getTableData();
emit('ready');
</script>
<style scoped lang="scss">
.empty-area {
  opacity: 0.8;

  .empty-text.text0 {
    color: #77838F;
    font-weight: bold;
    font-size: 20px;
    line-height: 29px;
    margin-top: 16px;
  }

  .empty-text.text1 {
    font-weight: 400;
    font-size: 16px;
    color: #B0BAC6;
    line-height: 24px;
    margin-top: 8px;
  }
}
.card-list {
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
}
</style>
