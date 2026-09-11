<script setup lang="ts">
import { API } from '@/api';
import type { PageDomain, TenantsVO, VectorStoresPageDTO, VectorStoresVO } from '@/types';
import DetailDrawer from './components/DetailDrawer.vue';

const state = reactive({
  tenantsVOs: [] as TenantsVO[],
  vectorStoresDto: {} as VectorStoresPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  vectorStoresVOs: [] as VectorStoresVO[],
  detailVisible: false,
  detail: {} as VectorStoresVO,
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

const handleQuery = () => {
  state.page.pageNum = 1;
  getVectorStores();
};

const resetQuery = () => {
  delete state.vectorStoresDto.tenantId;
  handleQuery();
};

const handleDetail = (row: VectorStoresVO) => {
  state.detail = row;
  state.detailVisible = true;
};

onMounted(() => {
  getTenants();
  getVectorStores();
});
</script>

<template>
  <section>
    <page-name />
    <page-content>
      <template #header>
        <div class="search-bar">
          <el-select
            v-model="state.vectorStoresDto.tenantId"
            class="search-bar__input"
            clearable
            filterable
            :placeholder="$t('page.data.vectorStores.search.tenantPlaceholder', '选择租户名称')"
          >
            <el-option v-for="tenant in state.tenantsVOs" :key="tenant.id" :label="tenant.name" :value="tenant.id!" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
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
          :label="$t('page.data.vectorStores.table.tenantName', '租户')"
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

    <DetailDrawer v-model="state.detailVisible" :row="state.detail" />
  </section>
</template>
