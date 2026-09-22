<script setup lang="ts">
import { API } from '@/api';
import { t } from '@/i18n';
import type { PageDomain, SkillCatalogPageDTO, SkillCatalogVO, TenantsVO } from '@/types';
import modal from '@/plugins/modal';
import FileViewDrawer from './components/FileViewDrawer.vue';
import AddDrawer from './components/AddDrawer.vue';

const fileViewRef = ref<InstanceType<typeof FileViewDrawer>>();
const addRef = ref<InstanceType<typeof AddDrawer>>();
const state = reactive({
  dto: {} as SkillCatalogPageDTO,
  page: { pageNum: 1, pageSize: 10 } satisfies PageDomain,
  rows: [] as SkillCatalogVO[],
  tenants: [] as TenantsVO[],
  total: 0,
  loading: false,
  deletingId: ''
});
let listRequestId = 0;

const getList = () => {
  const requestId = ++listRequestId;
  state.loading = true;
  const dto: SkillCatalogPageDTO = {
    keyword: state.dto.keyword?.trim() || undefined,
    tenantId: state.dto.tenantId
  };
  return API.Skills.list(dto, { ...state.page })
    .then((res) => {
      if (requestId !== listRequestId) return;
      state.rows = res.rows || [];
      state.total = Number(res.total) || 0;
    })
    .catch(() => {
      if (requestId !== listRequestId) return;
      state.rows = [];
      state.total = 0;
    })
    .finally(() => {
      if (requestId === listRequestId) state.loading = false;
    });
};

const handleQuery = () => {
  state.page.pageNum = 1;
  return getList();
};

const resetQuery = () => {
  state.dto = {};
  return handleQuery();
};

const handleDelete = (row: SkillCatalogVO) => {
  const id = row.id;
  if (!id || state.deletingId) return;

  state.deletingId = id;
  return modal
    .confirm(t('page.data.skills.deleteConfirm', { name: row.name || id }, '确认删除技能 {name}？'))
    .then(() => API.Skills.delete(id))
    .then(() => {
      modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
      if (state.rows.length === 1 && state.rows[0]?.id === id && state.page.pageNum > 1) {
        state.page.pageNum -= 1;
      }
      return getList();
    })
    .catch((error: unknown) => {
      if (error === 'cancel' || error === 'close') return;
      console.error('[Skills] delete failed:', error);
    })
    .finally(() => {
      state.deletingId = '';
    });
};

onMounted(() => {
  getList();
  API.Tenants.list({}, { pageNum: 1, pageSize: 9999 })
    .then((res) => {
      state.tenants = res.rows || [];
    })
    .catch(() => {
      state.tenants = [];
    });
});
</script>

<template>
  <section>
    <page-name class="page-name">
      <el-button type="primary" icon="Plus" v-hasPermi="['business:skills:add']" @click="addRef?.handleAdd()">{{
        $t('page.data.skills.add.title', '新增技能')
      }}</el-button>
    </page-name>
    <page-content>
      <template #header>
        <div class="search-bar">
          <el-input
            v-model="state.dto.keyword"
            class="search-bar__input"
            clearable
            :placeholder="$t('page.data.skills.search.keyword', '按技能名称、描述搜索')"
          />
          <el-select
            v-model="state.dto.tenantId"
            class="search-bar__select"
            clearable
            filterable
            :placeholder="$t('page.data.skills.search.tenant', '选择租户')"
          >
            <el-option v-for="tenant in state.tenants" :key="tenant.id" :value="tenant.id!" :label="tenant.name" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.rows" height="100%" show-overflow-tooltip>
        <template #empty><kjsc-empty /></template>
        <el-table-column prop="name" :label="$t('page.data.skills.field.name', '技能名称')" :min-width="$dim('page.data.skills.table.name', 220)" />
        <el-table-column
          prop="description"
          :label="$t('page.data.skills.field.description', '技能描述')"
          :min-width="$dim('page.data.skills.table.description', 360)"
        />
        <el-table-column
          prop="version"
          :label="$t('page.data.skills.field.version', '版本')"
          :min-width="$dim('page.data.skills.table.version', 100)"
        />
        <el-table-column :label="$t('page.data.skills.field.tenant', '租户')" :min-width="$dim('page.data.skills.table.tenant', 180)">
          <template #default="{ row }">{{ row.tenant?.name ?? '' }}</template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.data.skills.field.createdAt', '创建时间')"
          :min-width="$dim('page.data.skills.table.createdAt', 180)"
          align="center"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.data.skills.field.updatedAt', '更新时间')"
          :min-width="$dim('page.data.skills.table.updatedAt', 180)"
          align="center"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          :width="$dim('page.data.skills.table.operation', 180)"
          align="left"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button link type="primary" :disabled="!row.id" @click="fileViewRef?.handleOpen(row)" v-hasPermi="['business:skills:query']">{{
              $t('page.data.skills.files.title', '查看文件')
            }}</el-button>
            <el-button
              link
              type="danger"
              :disabled="!row.id || !!state.deletingId"
              :loading="state.deletingId === row.id"
              @click.stop="handleDelete(row)"
              v-hasPermi="['business:skills:remove']"
              >{{ $t('page.normal.delete', '删除') }}</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination
          v-show="state.total > 0"
          v-model:page="state.page.pageNum"
          v-model:limit="state.page.pageSize"
          :total="state.total"
          @pagination="getList"
        />
      </template>
    </page-content>

    <FileViewDrawer ref="fileViewRef" />
    <AddDrawer ref="addRef" @success="handleQuery" />
  </section>
</template>

<style lang="scss" scoped>
.search-bar__select {
  width: 180px;
}
</style>
