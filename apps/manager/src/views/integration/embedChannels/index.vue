<script setup lang="ts">
import { API } from '@/api';
import type {
  CustomAgentsPageDTO,
  CustomAgentsVO,
  EmbedChannelsPageDTO,
  EmbedChannelsVO,
  PageDomain,
  TenantsPageDTO,
  TenantsVO
} from '@/types';
import { Search } from 'lucide-vue-next';
import DetailDrawer from './components/DetailDrawer.vue';

const state = reactive({
  tenantKeyword: '',
  agentKeyword: '',
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  agentsDto: {} as CustomAgentsPageDTO,
  agentsVOs: [] as CustomAgentsVO[],
  embedChannelsDto: {} as EmbedChannelsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  embedChannelsVOs: [] as EmbedChannelsVO[],
  detailDrawerVisible: false,
  selectedChannel: {} as EmbedChannelsVO,
  loading: false,
  total: 0
});

const handleAutocompleteKeydown = (event: KeyboardEvent) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (event.altKey) return;

  if (event.key === 'Home' || event.key === 'End') {
    event.stopPropagation();
  }
};

const getTenants = (): Promise<TenantsVO[]> => {
  state.tenantsVOs.length = 0;

  if (!state.tenantKeyword) {
    delete state.tenantsDto.name;
    return Promise.resolve(state.tenantsVOs);
  }

  state.tenantsDto.name = state.tenantKeyword;
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  return API.Tenants.list(state.tenantsDto, page)
    .then((res) => {
      state.tenantsVOs.push(...res.rows);
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
      state.total = 0;
    })
    .then(() => state.tenantsVOs);
};

const getAgents = (): Promise<CustomAgentsVO[]> => {
  state.agentsVOs.length = 0;

  if (!state.agentKeyword) {
    delete state.agentsDto.name;
    return Promise.resolve(state.agentsVOs);
  }

  state.agentsDto.name = state.agentKeyword;
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  return API.CustomAgents.list(state.agentsDto, page)
    .then((res) => {
      state.agentsVOs.push(...res.rows);
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    })
    .then(() => state.agentsVOs);
};

const onSelectTenant = (tenant: TenantsVO) => {
  state.embedChannelsDto.tenantId = tenant.id;
};

const onTenantInput = () => {
  delete state.embedChannelsDto.tenantId;
};

const onSelectAgent = (agent: CustomAgentsVO) => {
  state.embedChannelsDto.agentId = agent.id;
};

const onAgentInput = () => {
  delete state.embedChannelsDto.agentId;
};

const getEmbedChannels = () => {
  state.loading = true;
  state.embedChannelsVOs.length = 0;
  API.EmbedChannels.list(state.embedChannelsDto, state.page)
    .then((res) => {
      state.embedChannelsVOs.push(...res.rows);
      state.total = res.total;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    })
    .finally(() => {
      state.loading = false;
    });
};

const handleQuery = () => {
  state.page.pageNum = 1;
  getEmbedChannels();
};

const resetQuery = () => {
  state.tenantKeyword = '';
  state.agentKeyword = '';
  state.tenantsVOs.length = 0;
  state.agentsVOs.length = 0;
  delete state.tenantsDto.name;
  delete state.agentsDto.name;
  delete state.embedChannelsDto.name;
  delete state.embedChannelsDto.tenantId;
  delete state.embedChannelsDto.agentId;
};

const showDetail = (row: EmbedChannelsVO) => {
  state.selectedChannel = { ...row };
  state.detailDrawerVisible = true;
};

onMounted(() => {
  getEmbedChannels();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar" @keydown.capture="handleAutocompleteKeydown">
          <el-input
            v-model="state.embedChannelsDto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.integration.embedChannels.search.namePlaceholder', '输入嵌入渠道名称查询')"
          />

          <el-autocomplete
            v-model="state.tenantKeyword"
            class="search-bar__input"
            style="max-width: 300px"
            value-key="name"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.integration.embedChannels.search.tenantPlaceholder', '输入租户名称查询')"
            :fetch-suggestions="getTenants"
            @select="onSelectTenant"
            @clear="onTenantInput"
            @input="onTenantInput"
          />

          <el-autocomplete
            v-model="state.agentKeyword"
            class="search-bar__input"
            style="max-width: 300px"
            value-key="name"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.integration.embedChannels.search.agentPlaceholder', '输入智能体名称查询')"
            :fetch-suggestions="getAgents"
            @select="onSelectAgent"
            @clear="onAgentInput"
            @input="onAgentInput"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.embedChannelsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.integration.embedChannels.table.name', '名称')"
          :min-width="$dim('page.integration.embedChannels.table.name', 220)"
        />
        <el-table-column
          prop="tenant.name"
          :label="$t('page.integration.embedChannels.table.tenantName', '所属工作空间（租户）')"
          :min-width="$dim('page.integration.embedChannels.table.tenantName', 300)"
        >
          <template #default="{ row }">{{ row.tenant?.name }}</template>
        </el-table-column>
        <el-table-column
          prop="agent.name"
          :label="$t('page.integration.embedChannels.table.agentName', '智能体')"
          :min-width="$dim('page.integration.embedChannels.table.agentName', 220)"
        >
          <template #default="{ row }">{{ row.agent?.name }}</template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.integration.embedChannels.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.integration.embedChannels.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.integration.embedChannels.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.integration.embedChannels.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.integration.embedChannels.table.operation', 100)"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="showDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getEmbedChannels" />
      </template>
    </page-content>

    <DetailDrawer v-model="state.detailDrawerVisible" :row="state.selectedChannel" />
  </section>
</template>
