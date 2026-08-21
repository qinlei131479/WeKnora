<script setup lang="ts">
import { API } from '@/api';
import { PageDomain, StorageBackendsPageDTO, StorageBackendsVO } from '@/types';
import { TenantsPageDTO, TenantsVO } from '@/types/api/data/tenants';

const state = reactive({
  keyword: '',
  tenantsDto: {} as TenantsPageDTO,
  tenantsVOs: [] as TenantsVO[],
  tenantsId: undefined as number | undefined,
  backendsDto: {} as StorageBackendsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  backendsVOs: [] as StorageBackendsVO[],
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
  state.tenantsId = tenant.id;
  state.backendsDto.tenantId = tenant.id;
  state.page.pageNum = 1;
  getBackends();
};

const onClearTenants = () => {
  state.tenantsId = undefined;
  delete state.backendsDto.tenantId;
  state.page.pageNum = 1;
  getBackends();
};

const getBackends = () => {
  API.Storage.list(state.backendsDto, state.page)
    .then((res) => {
      state.backendsVOs.length = 0;
      state.backendsVOs.push(...res.rows);
      state.total = res.total;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
    });
};

onMounted(() => {
  getBackends();
});
</script>

<template>
  <section class="manage-page agent-stroage-page">
    <page-name class="page-name" title="存储引擎" />
    <div class="table-pager-area">
      <br />
      <div @keydown.capture="handleAutocompleteKeydown">
        <el-autocomplete
          v-model="state.keyword"
          value-key="name"
          placeholder="租户名称"
          clearable
          hide-loading
          :trigger-on-focus="false"
          :fetch-suggestions="getTenants"
          @select="onSelectTenants"
          @clear="onClearTenants"
        />
      </div>

      <br />
      <el-table :data="state.backendsVOs" style="width: 100%; height: 100%">
        <el-table-column prop="name" label="name" min-width="180" />
        <el-table-column prop="tenantName" label="tenantName" min-width="180" />
        <el-table-column prop="provider" label="provider" min-width="180" />
        <el-table-column prop="source" label="source" min-width="180" />
        <el-table-column prop="status" label="status" min-width="180" />
        <el-table-column prop="isDefault" label="isDefault" min-width="180" />
        <el-table-column prop="createdAt" label="createdAt" min-width="180" />
        <el-table-column prop="updatedAt" label="updatedAt" min-width="180" />
        <template #empty>
          <el-empty />
        </template>
      </el-table>

      <el-pagination
        v-model:current-page="state.page.pageNum"
        v-model:page-size="state.page.pageSize"
        :total="state.total"
        layout="total, sizes, prev, pager, next, jumper"
        @change="getBackends"
      />
    </div>
  </section>
</template>

<style lang="sass" scoped></style>
