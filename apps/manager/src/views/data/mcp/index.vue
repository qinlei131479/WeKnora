<template>
  <section class="mcp-manage-page">
    <page-name class="page-name">
      <el-button type="primary" icon="Plus" v-hasPermi="['business:mcpServices:add']" @click="handleAdd">{{ $t('page.mcp.addTitle') }}</el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <el-button-group>
            <el-button @click="$router.push('./tools')">{{ $t('page.mcp.tools', '工具') }}</el-button>
            <el-button type="primary">{{ $t('page.mcp.mcp', 'MCP') }}</el-button>
          </el-button-group>

          <div class="search-bar__keyword">
            <el-input
              v-model="state.dto.keyword"
              class="search-bar__input"
              clearable
              :placeholder="$t('page.mcp.keywordSearchPlaceholder')"
              @keyup.enter="resetPageSearch"
            />
          </div>

          <el-button @click="resetQuerySearch">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="resetPageSearch">{{ $t('page.normal.search', '搜索') }}</el-button>
        </div>
      </template>
      <el-table ref="tableRef" v-loading="state.loading" :data="state.rows" height="100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column
          :label="$t('page.mcp.name', '名称')"
          align="left"
          key="name"
          prop="name"
          :min-width="$dim('page.mcp.name', 120)"
          show-overflow-tooltip
        />
        <el-table-column
          :label="$t('page.mcp.description', '描述')"
          align="left"
          key="description"
          prop="description"
          :min-width="$dim('page.mcp.description', 120)"
          show-overflow-tooltip
        />
        <el-table-column :label="$t('page.mcp.enableddisabled', '启用/停用')" align="center" :width="$dim('page.mcp.enableddisabled', 120)">
          <template #default="{ row }">
            <el-tag v-if="row.enabled" type="success">{{ $t('page.normal.enable', '启用') }}</el-tag>
            <el-tag v-else type="info">{{ $t('page.normal.disable', '停用') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('page.mcp.isBuiltin', '是否内置')"
          align="center"
          key="isBuiltin"
          prop="isBuiltin"
          :width="$dim('page.mcp.isBuiltin', 120)"
          :show-overflow-tooltip="true"
        >
          <template #default="{ row }">
            <el-tag v-if="row.isBuiltin" type="primary">{{ $t('page.mcp.yes', '是') }}</el-tag>
            <el-tag v-else type="info">{{ $t('page.mcp.no', '否') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('page.normal.operation', '操作')" align="left" :width="$dim('page.mcp.operation', 220)" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['business:mcpServices:remove']">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
            <el-button v-if="!scope.row.enabled" link type="primary" @click="handleEnable(scope.row)" v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.enable', '启用') }}
            </el-button>
            <el-button v-else link type="info" @click="handleDisable(scope.row)" v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.disable', '停用') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <pagination
          v-show="state.total > 0"
          :total="state.total"
          v-model:page="state.page.pageNum"
          v-model:limit="state.page.pageSize"
          @pagination="loadTableData"
        />
      </template>
    </page-content>

    <AddEditDrawer ref="addEditDrawerRef" @success="loadTableData" />
  </section>
</template>

<script setup lang="ts">
import modal from '@/plugins/modal';
import type { AjaxResult, McpServicesPageDTO, McpServicesVO, PageDomain } from '@/types';
import { t } from '@/i18n/index.js';
import { API } from '@/api';
import AddEditDrawer from './components/AddEditDrawer.vue';

const state = reactive({
  dto: { keyword: undefined } as McpServicesPageDTO,
  page: { pageNum: 1, pageSize: 10 } satisfies PageDomain,
  rows: [] as McpServicesVO[],
  loading: false,
  total: 0
});

const loadTableData = () => {
  state.loading = true;
  const dto: McpServicesPageDTO = {};
  if (state.dto.keyword) dto.keyword = state.dto.keyword;
  return API.McpServices.list(dto, { ...state.page })
    .then((res) => {
      state.rows = res.rows || [];
      state.total = Number(res.total) || 0;
    })
    .catch(() => {})
    .finally(() => {
      state.loading = false;
    });
};

const resetPageSearch = () => {
  state.page = { pageNum: 1, pageSize: 10 };
  loadTableData();
};

const resetQuerySearch = () => {
  state.dto.keyword = undefined;
  state.page.pageNum = 1;
  loadTableData();
};

/** 删除按钮操作 */
function handleDelete(row: McpServicesVO) {
  const id = row.id;
  if (!id) return;
  return modal
    .confirm(t('page.mcp.deleteConfirm', { id }, `是否确认删除MCP编号为 ${id} 的数据项？`))
    .then(() => API.McpServices.delete(id))
    .then((res: AjaxResult<void>) => {
      if (res.code === 200) {
        modal.msgSuccess(t('page.normal.confirmInfo.removeSuccess'));
        if (state.rows.length === 1 && state.page.pageNum > 1) {
          state.page.pageNum--;
        }
        return loadTableData();
      }
    })
    .catch(() => {});
}

/** 启用按钮操作 */
function handleEnable(row: McpServicesVO) {
  if (!row.id) return;
  const message = t('page.mcp.enableConfirmSingle', { id: row.id }, `是否确认启用编号为 ${row.id} 的MCP服务？`);
  const saveIds = [row.id];
  modal.confirm(message).then(
    function () {
      return doEnable(saveIds);
    },
    () => {}
  );
}
function doEnable(saveIds: string[]) {
  return API.McpServices.enableBatch(saveIds).then((res) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.enableSuccess'));
      loadTableData();
    }
  });
}

/** 停用按钮操作 */
function handleDisable(row: McpServicesVO) {
  if (!row.id) return;
  const message = t('page.mcp.disableConfirmSingle', { id: row.id }, `是否确认停用编号为 ${row.id} 的MCP服务？`);
  const saveIds = [row.id];
  modal.confirm(message).then(
    function () {
      return doDisable(saveIds);
    },
    () => {}
  );
}
function doDisable(saveIds: string[]) {
  return API.McpServices.disableBatch(saveIds).then((res) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.disableSuccess'));
      loadTableData();
    }
  });
}

const addEditDrawerRef = ref<InstanceType<typeof AddEditDrawer>>();

function handleAdd() {
  addEditDrawerRef.value?.openAdd();
}

function handleUpdate(row: McpServicesVO) {
  if (row.id) addEditDrawerRef.value?.openEdit(row.id);
}

onMounted(loadTableData);
</script>

<style lang="scss" scoped></style>
