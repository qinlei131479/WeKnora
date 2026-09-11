<script setup lang="ts">
import { API } from '@/api';
import { t } from '@/i18n';
import type { CustomAgentsVO, ImChannelsPageDTO, ImChannelsVO, PageDomain, TenantsVO } from '@/types';
import { Search } from 'lucide-vue-next';
import DetailDrawer from './components/DetailDrawer.vue';

interface PlatformOption {
  value: string;
  label: string;
}

const state = reactive({
  tenantsVOs: [] as TenantsVO[],
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

const getTenants = () => {
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  API.Tenants.list({}, page)
    .then((res) => {
      state.tenantsVOs = res.rows;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    });
};

const getAgents = () => {
  const page = { pageNum: 1, pageSize: 99999, orderByColumn: 'createdAt', isAsc: 'asc' } as PageDomain;
  API.CustomAgents.list({}, page)
    .then((res) => {
      state.agentsVOs = res.rows;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    });
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
  state.imChannelsDto = {};
  handleQuery();
};

const showDetail = (row: ImChannelsVO) => {
  state.selectedChannel = { ...row };
  state.detailDrawerVisible = true;
};

onMounted(() => {
  getTenants();
  getAgents();
  getImChannels();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar">
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

          <el-select
            v-model="state.imChannelsDto.tenantId"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            filterable
            :placeholder="$t('page.integration.imChannels.search.tenantPlaceholder', '选择租户名称')"
          >
            <el-option v-for="tenant in state.tenantsVOs" :key="tenant.id" :label="tenant.name" :value="tenant.id!" />
          </el-select>

          <el-select
            v-if="false"
            v-model="state.imChannelsDto.agentId"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            filterable
            :placeholder="$t('page.integration.imChannels.search.agentPlaceholder', '选择智能体名称')"
          >
            <el-option v-for="agent in state.agentsVOs" :key="agent.id" :label="agent.name" :value="agent.id!" />
          </el-select>

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
