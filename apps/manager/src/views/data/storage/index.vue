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

const onInput = (value: string) => {
  if (!value) {
    state.tenantsId = undefined;
    delete state.backendsDto.tenantId;
    state.page.pageNum = 1;
    getBackends();
  }
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
  <section>
    <page-name />
    <page-content>
      <template #header>
        <div class="autocomplete" @keydown.capture="handleAutocompleteKeydown">
          <el-autocomplete
            v-model="state.keyword"
            value-key="name"
            placeholder="输入租户名称查询"
            clearable
            hide-loading
            :trigger-on-focus="false"
            :fetch-suggestions="getTenants"
            @select="onSelectTenants"
            @clear="onClearTenants"
            @input="onInput"
          />
        </div>
      </template>

      <el-table :data="state.backendsVOs" height="100%" show-overflow-tooltip style="width: 100%">
        <el-table-column prop="name" :label="$t('page.data.storage.table.name', '名称')" :min-width="$dim('page.data.storage.table.name', 220)" />
        <el-table-column
          prop="tenantName"
          :label="$t('page.data.storage.table.tenantName', '所属工作空间（租户）')"
          :min-width="$dim('page.data.storage.table.tenantName', 300)"
        />
        <el-table-column
          prop="provider"
          :label="$t('page.data.storage.table.provider', '供应商')"
          align="center"
          :min-width="$dim('page.data.storage.table.provider', 90)"
        />
        <el-table-column
          prop="source"
          :label="$t('page.data.storage.table.source', '来源')"
          align="center"
          :min-width="$dim('page.data.storage.table.source', 180)"
        />
        <el-table-column
          prop="status"
          :label="$t('page.data.storage.table.status', '状态')"
          align="center"
          :min-width="$dim('page.data.storage.table.status', 80)"
        >
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="primary">{{ $t('page.data.storage.table.status_active', '活动') }}</el-tag>
            <el-tag v-else-if="row.status === 'disabled'" type="danger">{{ $t('page.data.storage.table.status_disabled', '禁用') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="isDefault"
          :label="$t('page.data.storage.table.isDefault', '是否默认')"
          align="center"
          :min-width="$dim('page.data.storage.table.isDefault', 100)"
        >
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === true" type="success">{{ $t('page.data.storage.table.isDefault_true', '默认') }}</el-tag>
            <el-text v-else></el-text>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.data.storage.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.data.storage.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.data.storage.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.data.storage.table.updatedAt', 180)"
        />
        <template #empty>
          <el-empty />
        </template>
      </el-table>

      <template #footer>
        <div class="pagination">
          <el-pagination
            v-model:current-page="state.page.pageNum"
            v-model:page-size="state.page.pageSize"
            :total="state.total"
            layout="total, sizes, prev, pager, next, jumper"
            @change="getBackends"
          />
        </div>
      </template>
    </page-content>
  </section>
</template>

<style lang="scss" scoped>
.autocomplete {
  margin: 0 16px 16px 16px;
}

.pagination {
  margin: 16px 16px 0 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
