<script setup lang="ts">
import { API } from '@/api';
import type { CustomAgentsPageDTO, CustomAgentsVO, PageDomain } from '@/types';
import type { TenantsPageDTO, TenantsVO } from '@/types/api/data/tenants';
import { Search } from 'lucide-vue-next';
import DetailDrawer from './components/DetailDrawer.vue';

const state = reactive({
  tenantKeyword: '',
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  customAgentsDto: {} as CustomAgentsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  dateRange: [] as string[] | null,
  customAgentsVOs: [] as CustomAgentsVO[],
  detailDrawerVisible: false,
  selectedAgent: {} as CustomAgentsVO,
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
    })
    .then(() => state.tenantsVOs);
};

const onSelectTenant = (tenant: TenantsVO) => {
  state.customAgentsDto.tenantId = tenant.id;
};

const onTenantInput = () => {
  delete state.customAgentsDto.tenantId;
};

const getCustomAgents = () => {
  delete state.customAgentsDto.createdAtStart;
  delete state.customAgentsDto.createdAtEnd;
  if (state.dateRange?.length === 2) {
    state.customAgentsDto.createdAtStart = `${state.dateRange[0]} 00:00:00`;
    state.customAgentsDto.createdAtEnd = `${state.dateRange[1]} 23:59:59`;
  }

  state.loading = true;
  state.customAgentsVOs.length = 0;
  API.CustomAgents.list(state.customAgentsDto, state.page)
    .then((res) => {
      state.customAgentsVOs.push(...res.rows);
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
  getCustomAgents();
};

const showDetail = (row: CustomAgentsVO) => {
  state.selectedAgent = row;
  state.detailDrawerVisible = true;
};

onMounted(() => {
  getCustomAgents();
});
</script>

<template>
  <section>
    <page-name />

    <page-content>
      <template #header>
        <div class="search-bar" @keydown.capture="handleAutocompleteKeydown">
          <el-input
            v-model="state.customAgentsDto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.agent.list.search.namePlaceholder', '输入智能体名称查询')"
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
            :placeholder="$t('page.agent.list.search.tenantPlaceholder', '输入租户名称查询')"
            :fetch-suggestions="getTenants"
            @select="onSelectTenant"
            @clear="onTenantInput"
            @input="onTenantInput"
          />

          <el-date-picker
            v-model="state.dateRange"
            class="search-bar__date"
            style="max-width: 300px"
            value-format="YYYY-MM-DD"
            type="daterange"
            :start-placeholder="$t('page.agent.list.search.startDatePlaceholder', '创建时间开始')"
            range-separator="-"
            :end-placeholder="$t('page.agent.list.search.endDatePlaceholder', '创建时间截止')"
          />

          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.customAgentsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column prop="name" :label="$t('page.agent.list.table.name', '智能体名称')" :min-width="$dim('page.agent.list.table.name', 260)">
          <template #default="{ row }">
            <span style="display: inline-flex; align-items: center; gap: 0.25em">
              <el-text>{{ row.name }}</el-text>
              <el-tag v-if="row.isBuiltin" type="info" effect="dark" size="small" round>{{ $t('page.agent.list.tag.builtin', '内置') }}</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          :label="$t('page.agent.list.table.description', '智能体说明')"
          :min-width="$dim('page.agent.list.table.description', 360)"
        />
        <el-table-column
          prop="tenant.name"
          :label="$t('page.agent.list.table.tenantName', '所属工作空间（租户）')"
          :min-width="$dim('page.agent.list.table.tenantName', 250)"
        >
          <template #default="{ row }">{{ row.tenant?.name }}</template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.agent.list.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.agent.list.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.agent.list.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.agent.list.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.agent.list.table.operation', 100)"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getCustomAgents" />
      </template>
    </page-content>

    <DetailDrawer v-model="state.detailDrawerVisible" :agent="state.selectedAgent" />
  </section>
</template>
