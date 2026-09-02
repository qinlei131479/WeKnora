<script setup lang="ts">
import { API } from '@/api';
import { t } from '@/i18n';
import type {
  CustomAgentsPageDTO,
  CustomAgentsVO,
  ImChannelsPageDTO,
  ImChannelsVO,
  PageDomain,
  TenantsPageDTO,
  TenantsVO
} from '@/types';
import { Search } from 'lucide-vue-next';
import DetailDrawer from './components/DetailDrawer.vue';

interface PlatformOption {
  value: string;
  label: string;
}

const state = reactive({
  tenantKeyword: '',
  agentKeyword: '',
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  agentsDto: {} as CustomAgentsPageDTO,
  agentsVOs: [] as CustomAgentsVO[],
  imChannelsDto: {} as ImChannelsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  imChannelsVOs: [] as ImChannelsVO[],
  detailDrawerVisible: false,
  selectedChannel: {} as ImChannelsVO,
  loading: false,
  total: 0
});

const platformOptions = computed(() => [
  { value: 'wecom', label: t('page.integration.imChannels.platform.wecom', '企业微信') },
  { value: 'dingtalk', label: t('page.integration.imChannels.platform.dingtalk', '钉钉') },
  { value: 'feishu', label: t('page.integration.imChannels.platform.feishu', '飞书') }
]);

const formatPlatform = (value?: string): string => {
  return platformOptions.value.find((option: PlatformOption) => option.value === value)?.label || value || '';
};

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
  state.imChannelsDto.tenantId = tenant.id;
};

const onTenantInput = () => {
  delete state.imChannelsDto.tenantId;
};

const onSelectAgent = (agent: CustomAgentsVO) => {
  state.imChannelsDto.agentId = agent.id;
};

const onAgentInput = () => {
  delete state.imChannelsDto.agentId;
};

const getImChannels = () => {
  state.loading = true;
  state.imChannelsVOs.length = 0;
  API.ImChannels.list(state.imChannelsDto, state.page)
    .then((res) => {
      state.imChannelsVOs.push(...res.rows);
      state.total = res.total;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
      state.total = 0;
    })
    .finally(() => {
      state.loading = false;
    });
};

const handleQuery = () => {
  state.page.pageNum = 1;
  getImChannels();
};

const resetQuery = () => {
  state.tenantKeyword = '';
  state.agentKeyword = '';
  state.tenantsDto = {};
  state.agentsDto = {};
  state.imChannelsDto = {};
  state.tenantsVOs.length = 0;
  state.agentsVOs.length = 0;
  state.page.pageNum = 1;
};

const showDetail = (row: ImChannelsVO) => {
  state.selectedChannel = { ...row };
  state.detailDrawerVisible = true;
};

onMounted(() => {
  getImChannels();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar" @keydown.capture="handleAutocompleteKeydown">
          <el-input
            v-model="state.imChannelsDto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.integration.imChannels.search.namePlaceholder', '输入 IM 渠道名称查询')"
          />

          <el-select
            v-model="state.imChannelsDto.platform"
            style="max-width: 200px"
            clearable
            :placeholder="$t('page.integration.imChannels.search.platformPlaceholder', '选择平台')"
          >
            <el-option v-for="option in platformOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>

          <el-autocomplete
            v-model="state.tenantKeyword"
            class="search-bar__input"
            style="max-width: 300px"
            value-key="name"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.integration.imChannels.search.tenantPlaceholder', '输入租户名称查询')"
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
            :placeholder="$t('page.integration.imChannels.search.agentPlaceholder', '输入智能体名称查询')"
            :fetch-suggestions="getAgents"
            @select="onSelectAgent"
            @clear="onAgentInput"
            @input="onAgentInput"
          />

          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.imChannelsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.integration.imChannels.table.name', '名称')"
          :min-width="$dim('page.integration.imChannels.table.name', 220)"
        />
        <el-table-column
          prop="platform"
          :label="$t('page.integration.imChannels.table.platform', '平台')"
          align="center"
          :min-width="$dim('page.integration.imChannels.table.platform', 120)"
        >
          <template #default="{ row }">{{ formatPlatform(row.platform) }}</template>
        </el-table-column>
        <el-table-column
          prop="tenant.name"
          :label="$t('page.integration.imChannels.table.tenantName', '所属工作空间（租户）')"
          :min-width="$dim('page.integration.imChannels.table.tenantName', 300)"
        >
          <template #default="{ row }">{{ row.tenant?.name }}</template>
        </el-table-column>
        <el-table-column
          prop="agent.name"
          :label="$t('page.integration.imChannels.table.agentName', '智能体')"
          :min-width="$dim('page.integration.imChannels.table.agentName', 220)"
        >
          <template #default="{ row }">{{ row.agent?.name }}</template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.integration.imChannels.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.integration.imChannels.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.integration.imChannels.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.integration.imChannels.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.integration.imChannels.table.operation', 100)"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="showDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getImChannels" />
      </template>
    </page-content>

    <DetailDrawer v-model="state.detailDrawerVisible" :row="state.selectedChannel" />
  </section>
</template>
