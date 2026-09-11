<script setup lang="ts">
import { API } from '@/api';
import type { PageDomain, StorageBackendsPageDTO, StorageBackendsVO, TenantsVO } from '@/types';
import DetailDrawer from './components/DetailDrawer.vue';

const state = reactive({
  tenantsVOs: [] as TenantsVO[],
  backendsDto: {} as StorageBackendsPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'createdAt', isAsc: 'desc' } as PageDomain,
  backendsVOs: [] as StorageBackendsVO[],
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

const handleQuery = () => {
  state.page.pageNum = 1;
  getBackends();
};

const resetQuery = () => {
  delete state.backendsDto.tenantId;
  handleQuery();
};

const detailOpen = ref(false);
const detailRow = ref<StorageBackendsVO>({});

const showDetail = (row: StorageBackendsVO) => {
  detailRow.value = { ...row };
  detailOpen.value = true;
};

onMounted(() => {
  getTenants();
  getBackends();
});
</script>

<template>
  <section>
    <page-name />
    <page-content>
      <template #header>
        <div class="search-bar">
          <el-select
            v-model="state.backendsDto.tenantId"
            class="search-bar__input"
            :placeholder="$t('page.data.storage.search.tenantPlaceholder', '选择租户名称')"
            clearable
            filterable
          >
            <el-option v-for="tenant in state.tenantsVOs" :key="tenant.id" :label="tenant.name" :value="tenant.id!" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table :data="state.backendsVOs" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
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
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.data.storage.table.operation', 100)"
        >
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="showDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getBackends" />
      </template>
    </page-content>

    <DetailDrawer v-model="detailOpen" :row="detailRow" />
  </section>
</template>
