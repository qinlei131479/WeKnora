<script setup lang="ts">
import { API } from '@/api';
import type { PageDomain, VectorStoresPageDTO, VectorStoresVO } from '@/types';
import type { TenantsPageDTO, TenantsVO } from '@/types/api/data/tenants';
import { Search } from 'lucide-vue-next';
import DetailDialog from './components/DetailDialog.vue';

const state = reactive({
  keyword: '',
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  vectorStoresDto: {} as VectorStoresPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  vectorStoresVOs: [] as VectorStoresVO[],
  detailVisible: false,
  detail: {} as VectorStoresVO,
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

  if (!state.keyword) {
    delete state.tenantsDto.name;
    return Promise.resolve(state.tenantsVOs);
  }

  state.tenantsDto.name = state.keyword;
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

const onSelectTenants = (tenant: TenantsVO) => {
  state.vectorStoresDto.tenantId = tenant.id;
  state.page.pageNum = 1;
  getVectorStores();
};

const onClearTenants = () => {
  delete state.vectorStoresDto.tenantId;
  state.page.pageNum = 1;
  getVectorStores();
};

const onInput = (value: string) => {
  if (!value) {
    delete state.vectorStoresDto.tenantId;
    state.page.pageNum = 1;
    getVectorStores();
  }
};

const getVectorStores = () => {
  API.VectorStores.list(state.vectorStoresDto, state.page)
    .then((res) => {
      state.vectorStoresVOs.length = 0;
      state.vectorStoresVOs.push(...res.rows);
      state.total = res.total;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    });
};

const handleDetail = (row: VectorStoresVO) => {
  state.detail = row;
  state.detailVisible = true;
};

onMounted(() => {
  getVectorStores();
});
</script>

<template>
  <section>
    <page-name />
    <page-content>
      <template #header>
        <div class="search-bar" @keydown.capture="handleAutocompleteKeydown">
          <el-autocomplete
            v-model="state.keyword"
            value-key="name"
            class="search-bar__input"
            clearable
            hide-loading
            :suffix-icon="Search"
            :trigger-on-focus="false"
            :placeholder="$t('page.data.vectorStores.search.tenantPlaceholder', '输入租户名称查询')"
            :fetch-suggestions="getTenants"
            @select="onSelectTenants"
            @clear="onClearTenants"
            @input="onInput"
          />
        </div>
      </template>

      <el-table :data="state.vectorStoresVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.data.vectorStores.table.name', '名称')"
          :min-width="$dim('page.data.vectorStores.table.name', 220)"
        />
        <el-table-column
          prop="tenantName"
          :label="$t('page.data.vectorStores.table.tenantName', '所属工作空间（租户）')"
          :min-width="$dim('page.data.vectorStores.table.tenantName', 300)"
        />
        <el-table-column
          prop="engineType"
          :label="$t('page.data.vectorStores.table.engineType', '引擎类型')"
          align="center"
          :min-width="$dim('page.data.vectorStores.table.engineType', 130)"
        />
        <el-table-column
          prop="createdAt"
          :label="$t('page.data.vectorStores.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.data.vectorStores.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.data.vectorStores.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.data.vectorStores.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.data.vectorStores.table.operation', 100)"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="handleDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getVectorStores" />
      </template>
    </page-content>

    <DetailDialog v-model:visible="state.detailVisible" :row="state.detail" />
  </section>
</template>

<style lang="scss" scoped></style>
