<script setup lang="ts">
import { API } from '@/api';
import type { CustomAgentsVO, EmbedChannelsPageDTO, EmbedChannelsVO, PageDomain, TenantsVO } from '@/types';
import { Search } from 'lucide-vue-next';
import DetailDrawer from './components/DetailDrawer.vue';

const state = reactive({
  tenantsVOs: [] as TenantsVO[],
  agentsVOs: [] as CustomAgentsVO[],
  embedChannelsDto: {} as EmbedChannelsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  embedChannelsVOs: [] as EmbedChannelsVO[],
  detailDrawerVisible: false,
  selectedChannel: {} as EmbedChannelsVO,
  loading: false,
  total: 0
});

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
  delete state.embedChannelsDto.name;
  delete state.embedChannelsDto.tenantId;
  delete state.embedChannelsDto.agentId;
  handleQuery();
};

const showDetail = (row: EmbedChannelsVO) => {
  state.selectedChannel = { ...row };
  state.detailDrawerVisible = true;
};

onMounted(() => {
  getTenants();
  getAgents();
  getEmbedChannels();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar">
          <el-input
            v-model="state.embedChannelsDto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.integration.embedChannels.search.namePlaceholder', '输入嵌入渠道名称查询')"
          />

          <el-select
            v-model="state.embedChannelsDto.tenantId"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            filterable
            :placeholder="$t('page.integration.embedChannels.search.tenantPlaceholder', '选择租户名称')"
          >
            <el-option v-for="tenant in state.tenantsVOs" :key="tenant.id" :label="tenant.name" :value="tenant.id!" />
          </el-select>

          <el-select
            v-if="false"
            v-model="state.embedChannelsDto.agentId"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            filterable
            :placeholder="$t('page.integration.embedChannels.search.agentPlaceholder', '选择智能体名称')"
          >
            <el-option v-for="agent in state.agentsVOs" :key="agent.id" :label="agent.name" :value="agent.id!" />
          </el-select>

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
