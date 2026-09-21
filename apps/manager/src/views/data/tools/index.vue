<script setup lang="ts">
import { API } from '@/api';
import { t, te } from '@/i18n';
import type { AmpBuiltinToolsPageDTO, AmpBuiltinToolsVO, PageDomain } from '@/types';
import DetailDrawer from './components/DetailDrawer.vue';

const categoryOptions = computed(() => [
  { value: 'buildin', label: t('page.data.tools.category.buildin', '内置工具') },
  { value: 'database', label: t('page.data.tools.category.database', '数据库') },
  { value: 'knowledge', label: t('page.data.tools.category.knowledge', '知识库') },
  { value: 'wiki', label: t('page.data.tools.category.wiki', 'Wiki') }
]);

const sourceOptions = computed(() => [
  { value: 'work', label: t('page.data.tools.source.work', '工作流') },
  { value: 'chat', label: t('page.data.tools.source.chat', '聊天') }
]);

const state = reactive({
  dto: {} as AmpBuiltinToolsPageDTO,
  page: { pageNum: 1, pageSize: 10 } satisfies PageDomain,
  rows: [] as AmpBuiltinToolsVO[],
  total: 0,
  loading: false,
  detailVisible: false,
  detailRow: {} as AmpBuiltinToolsVO
});

const getList = () => {
  state.loading = true;
  const dto: AmpBuiltinToolsPageDTO = {};
  if (state.dto.keyword) dto.keyword = state.dto.keyword;
  if (state.dto.category) dto.category = state.dto.category;
  if (state.dto.source) dto.source = state.dto.source;
  return API.AmpBuiltinTools.list(dto, { ...state.page })
    .then((res) => {
      state.rows = res.rows || [];
      state.total = Number(res.total) || 0;
    })
    .catch(() => {
      state.rows = [];
      state.total = 0;
    })
    .finally(() => {
      state.loading = false;
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

const formatOption = (type: 'category' | 'source', value?: string): string => {
  if (!value) return '';
  const key = `page.data.tools.${type}.${value}`;
  return te(key) ? t(key) : value;
};

const handleDetail = (row: AmpBuiltinToolsVO) => {
  state.detailRow = { ...row };
  state.detailVisible = true;
};

onMounted(getList);
</script>

<template>
  <section>
    <page-name />
    <page-content>
      <template #header>
        <div class="search-bar">
          <el-button-group>
            <el-button type="primary">{{ $t('page.mcp.tools', '工具') }}</el-button>
            <el-button @click="$router.push('./mcp')">{{ $t('page.mcp.mcp', 'MCP') }}</el-button>
          </el-button-group>
          <el-input
            v-model="state.dto.keyword"
            class="search-bar__input"
            clearable
            :placeholder="$t('page.data.tools.search.keywordPlaceholder', '按名称、描述搜索')"
          />
          <el-select
            v-model="state.dto.category"
            class="search-bar__select"
            clearable
            :placeholder="$t('page.data.tools.search.categoryPlaceholder', '请选择分类')"
          >
            <el-option v-for="item in categoryOptions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
          <el-select
            v-model="state.dto.source"
            class="search-bar__select"
            clearable
            :placeholder="$t('page.data.tools.search.sourcePlaceholder', '请选择来源')"
          >
            <el-option v-for="item in sourceOptions" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
          <el-button @click="resetQuery">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="handleQuery">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>

      <el-table v-loading="state.loading" :data="state.rows" height="100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.data.tools.field.name', '名称')"
          :min-width="$dim('page.data.tools.table.name', 180)"
          show-overflow-tooltip
        />
        <el-table-column
          prop="description"
          :label="$t('page.data.tools.field.description', '描述')"
          :min-width="$dim('page.data.tools.table.description', 300)"
          show-overflow-tooltip
        />
        <el-table-column
          prop="category"
          :label="$t('page.data.tools.field.category', '分类')"
          :min-width="$dim('page.data.tools.table.category', 120)"
          align="center"
        >
          <template #default="{ row }">{{ formatOption('category', row.category) }}</template>
        </el-table-column>
        <el-table-column
          prop="source"
          :label="$t('page.data.tools.field.source', '来源')"
          :min-width="$dim('page.data.tools.table.source', 120)"
          align="center"
        >
          <template #default="{ row }">{{ formatOption('source', row.source) }}</template>
        </el-table-column>
        <el-table-column
          prop="enabled"
          :label="$t('page.data.tools.field.enabled', '状态')"
          :min-width="$dim('page.data.tools.table.enabled', 100)"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-if="row.enabled === true" type="success">{{ $t('page.data.tools.status.enabled', '启用') }}</el-tag>
            <el-tag v-else-if="row.enabled === false" type="info">{{ $t('page.data.tools.status.disabled', '停用') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="updatedAt"
          :label="$t('page.data.tools.field.updatedAt', '更新时间')"
          :min-width="$dim('page.data.tools.table.updatedAt', 180)"
          align="center"
        />
        <el-table-column :label="$t('page.normal.operation', '操作')" :width="$dim('page.data.tools.table.operation', 100)" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">{{ $t('page.normal.detail', '详情') }}</el-button>
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

    <DetailDrawer v-model="state.detailVisible" :row="state.detailRow" />
  </section>
</template>

<style lang="scss" scoped>
.search-bar__select {
  width: 180px;
}
</style>
