<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { API } from '@/api';
import { t } from '@/i18n';
import type { AmpParserEnginesPageDTO, AmpParserEnginesVO, PageDomain } from '@/types';
import modal from '@/plugins/modal';
import DetailDrawer from './components/DetailDrawer.vue';
import EditDrawer from './components/EditDrawer.vue';

const state = reactive({
  loading: false,
  dto: {} as AmpParserEnginesPageDTO,
  page: { pageNum: 1, pageSize: 10, orderByColumn: 'sortOrder', isAsc: 'asc' } satisfies PageDomain,
  rows: [] as AmpParserEnginesVO[],
  total: 0,
  detailVisible: false,
  detailRow: {} as AmpParserEnginesVO,
  editVisible: false,
  editRow: undefined as AmpParserEnginesVO | undefined
});

const getList = () => {
  state.loading = true;
  API.AmpParserEngines.list(state.dto, state.page)
    .then((res) => {
      state.rows.length = 0;
      state.rows.push(...(res.rows || []));
      state.total = res.total || 0;
    })
    .catch((error) => {
      console.error('--> --> Error:', error);
      state.rows.length = 0;
      state.total = 0;
    })
    .finally(() => {
      state.loading = false;
    });
};

const handleQuery = () => {
  state.page.pageNum = 1;
  getList();
};

const resetQuery = () => {
  state.dto = {};
  handleQuery();
};

const handleDetail = (row: AmpParserEnginesVO) => {
  state.detailRow = { ...row };
  state.detailVisible = true;
};

const handleAdd = () => {
  state.editRow = undefined;
  state.editVisible = true;
};

const handleEdit = (row: AmpParserEnginesVO) => {
  state.editRow = { ...row };
  state.editVisible = true;
};

const handleDelete = (row: AmpParserEnginesVO) => {
  const id = row.id;
  if (id === undefined) return;

  modal
    .confirm(t('page.data.ampParserEngines.deleteConfirm', { name: row.name ?? '' }, '确认删除解析引擎 {name}？'))
    .then(() => API.AmpParserEngines.delete(id))
    .then(() => {
      modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess', '删除成功'));
      if (state.rows.length === 1 && state.page.pageNum > 1) {
        state.page.pageNum -= 1;
      }
      getList();
    })
    .catch((error: unknown) => {
      if (error === 'cancel' || error === 'close') return;
      console.error('--> --> Error:', error);
    });
};

onMounted(getList);
</script>

<template>
  <section>
    <page-name>
      <el-button v-if="false" type="primary" icon="Plus" v-hasPermi="['business:ampParserEngines:add']" @click="handleAdd">
        {{ $t('page.normal.add', '新增') }}
      </el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <el-input
            v-model="state.dto.name"
            class="search-bar__input"
            style="max-width: 300px"
            clearable
            :suffix-icon="Search"
            :placeholder="$t('page.data.ampParserEngines.search.namePlaceholder', '输入名称查询')"
            @keyup.enter="handleQuery"
          />
          <el-select
            v-model="state.dto.enabled"
            style="width: 160px"
            clearable
            :placeholder="$t('page.data.ampParserEngines.search.enabledPlaceholder', '全部状态')"
          >
            <el-option :label="$t('page.data.ampParserEngines.status.enabled', '启用')" :value="true" />
            <el-option :label="$t('page.data.ampParserEngines.status.disabled', '禁用')" :value="false" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.rows" show-overflow-tooltip height="100%" style="width: 100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.data.ampParserEngines.table.name', '名称')"
          :min-width="$dim('page.data.ampParserEngines.table.name', 220)"
        />
        <el-table-column
          prop="description"
          :label="$t('page.data.ampParserEngines.table.description', '描述')"
          :min-width="$dim('page.data.ampParserEngines.table.description', 360)"
        />
        <el-table-column
          prop="sortOrder"
          :label="$t('page.data.ampParserEngines.table.sortOrder', '排序')"
          align="center"
          :min-width="$dim('page.data.ampParserEngines.table.sortOrder', 80)"
        />
        <el-table-column
          prop="enabled"
          :label="$t('page.data.ampParserEngines.table.enabled', '状态')"
          align="center"
          :min-width="$dim('page.data.ampParserEngines.table.enabled', 100)"
        >
          <template #default="{ row }">
            <el-tag v-if="row.enabled === true" type="success">
              {{ $t('page.data.ampParserEngines.status.enabled', '启用') }}
            </el-tag>
            <el-tag v-else-if="row.enabled === false" type="danger">
              {{ $t('page.data.ampParserEngines.status.disabled', '禁用') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          :label="$t('page.data.ampParserEngines.table.createdAt', '创建时间')"
          align="center"
          :min-width="$dim('page.data.ampParserEngines.table.createdAt', 180)"
        />
        <el-table-column
          prop="updatedAt"
          :label="$t('page.data.ampParserEngines.table.updatedAt', '更新时间')"
          align="center"
          :min-width="$dim('page.data.ampParserEngines.table.updatedAt', 180)"
        />
        <el-table-column
          :label="$t('page.normal.operation', '操作')"
          align="left"
          fixed="right"
          :min-width="$dim('page.data.ampParserEngines.table.operation', 140)"
        >
          <template #default="{ row }">
            <el-button link type="primary" v-hasPermi="['business:ampParserEngines:query']" @click.stop="handleDetail(row)">
              {{ $t('page.normal.detail', '详情') }}
            </el-button>
            <el-button
              link
              type="primary"
              v-hasPermi="['business:ampParserEngines:edit']"
              :disabled="!['mineru', 'paddleocr_vl'].includes(row.name)"
              @click.stop="handleEdit(row)"
            >
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button v-if="false" link type="danger" v-hasPermi="['business:ampParserEngines:remove']" @click.stop="handleDelete(row)">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <pagination v-model:page="state.page.pageNum" v-model:limit="state.page.pageSize" :total="state.total" @pagination="getList" />
      </template>
    </page-content>

    <DetailDrawer v-model="state.detailVisible" :row="state.detailRow" />
    <EditDrawer v-model="state.editVisible" :row="state.editRow" @success="getList" />
  </section>
</template>
