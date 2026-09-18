<template>
  <section class="mcp-manage-page">
    <page-name class="page-name">
      <el-button type="primary" icon="Plus" v-hasPermi="['business:mcpServices:add']" @click="handleAdd">{{
        $t('page.normal.add')
      }}</el-button>
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <div class="search-bar__keyword">
            <el-input v-model="queryParams.name" class="search-bar__input" clearable
              :placeholder="$t('page.mcp.nameSearchPlaceholder')" @keyup.enter="resetPageSearch" />
          </div>

          <el-button @click="resetQuerySearch">{{ $t('page.normal.reset', '重置') }}</el-button>
          <el-button type="primary" @click="resetPageSearch">{{ $t('page.normal.search', '搜索') }}</el-button>

        </div>
      </template>
      <el-table ref="tableRef" v-loading="loading" :data="tableData" height="100%">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column :label="$t('page.mcp.name', '名称')" align="left" key="name" prop="name"
          :min-width="$dim('page.mcp.name', 120)"
          :show-overflow-tooltip="true" />
        <el-table-column :label="$t('page.mcp.description', '描述')" align="left" key="description" prop="description"
          :min-width="$dim('page.mcp.description', 120)"
          :show-overflow-tooltip="true" />
        <el-table-column :label="$t('page.mcp.enableddisabled', '启用/停用')" align="left" key="enabled" prop="enabled"
          :width="$dim('page.mcp.enableddisabled', 120)"
          :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.enabled ? $t('page.normal.enable', '启用') : $t('page.normal.disable', '停用') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('page.mcp.isBuiltin', '是否内置')" align="left" key="isBuiltin" prop="isBuiltin"
          :width="$dim('page.mcp.isBuiltin', 120)"
          :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.isBuiltin ? $t('page.mcp.yes', '是') : $t('page.mcp.no', '否') }}</span>
          </template>
        </el-table-column>

        <!-- <el-table-column v-if="columns.createBy.visible" label="创建人" key="createBy" prop="createBy" min-width="120"
          align="left" :show-overflow-tooltip="true" />
        <el-table-column v-if="columns.roleName.visible" label="所属角色" key="roleName" prop="roleName" min-width="120"
          align="left" />
        <el-table-column v-if="columns.tenantName.visible" label="所属租户" key="tenantName" prop="tenantName"
          min-width="120" align="left" />
        <el-table-column label="启用状态" align="center" key="status" width="100" v-if="columns.status.visible">
          <template #default="scope">
            <el-switch v-model="scope.row.status" style="--el-switch-on-color: #31aba0" active-value="0"
              inactive-value="1" @change="handleStatusChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="最新修改时间" align="left" prop="updateTime" min-width="170"
          v-if="columns.updateTime.visible">
          <template #default="scope">
            <span>{{ parseTime(scope.row.updateTime) }}</span>
          </template>
        </el-table-column> -->
        <el-table-column :label="$t('page.normal.operation', '操作')" align="left"
          :width="$dim('page.mcp.operation', 220)" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)"
              v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.edit', '编辑') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row.id, scope.row)"
              v-hasPermi="['business:mcpServices:remove']">
              {{ $t('page.normal.remove', '删除') }}
            </el-button>
            <el-button v-if="!scope.row.enabled" link type="primary"
              @click="handleEnable(scope.row)" v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.enable', '启用') }}
            </el-button>
            <el-button v-else link type="info" @click="handleDisable(scope.row)"
              v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.disable', '停用') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="loadTableData" />
      </template>
    </page-content>

    <AddEditDrawer ref="addEditDrawerRef" @success="loadTableData" />

  </section>
</template>

<script setup lang="ts" name="Models">
import modal from '@/plugins/modal';
import { useI18n } from 'vue-i18n';
import type { AjaxResult, McpEntity } from '@/types';
import { deleteMcpSingleApi, disableMcpBatchApi, enableMcpBatchApi, getMcplistApi } from '@/api/data/mcp';
import useTableData from '@/composables/useTableData.js';
import AddEditDrawer from './components/AddEditDrawer.vue';

// const pageLangConfig: Record<string, string> = {
//   'page.mcp.add': '新增MCP',
//   'page.mcp.searchPlaceholder': '通过模型ID、模型名称、创建人进行模糊搜索',
//   'page.mcp.range_separator': '至',
//   'page.mcp.start_date.placeholder': '开始时间',
//   'page.mcp.end_date.placeholder': '结束时间',
//   'page.mcp.reset': '重置',
//   'page.mcp.search': '搜索',
//   'form.button.reset': '重置',
//   'form.button.edit': '编辑',
//   'form.button.delete': '删除',
//   'form.button.enable': '启用',
//   'form.button.disable': '禁用',

// }
// const t = function (key: string, params?: Record<string, string> | string) {
//   let msg = pageLangConfig[key] || key
//   if (params) {
//     if (typeof params == 'string') {
//       msg = pageLangConfig[key] || params
//     } else {
//       Object.keys(params).forEach((key) => {
//         msg = msg.replace(`{${key}}`, params[key])
//       })
//     }
//   }
//   return msg
// }
// const $t = t;
const { t } = useI18n();

const {
  pageParams,queryParams,tableData,loading,total,loadTableData,resetPageSearch,resetQuerySearch,handleDelete
} = useTableData<McpEntity>({
  queryParams: {name: undefined},
  searchApi: getMcplistApi,
  deleteConfirmMessage: (row: McpEntity) => {
    return t('page.mcp.deleteConfirm', { id: row.id }, `是否确认删除MCP编号为 ${row.id} 的数据项？`)
  },
  deleteSuccessMessage: t('page.normal.confirmInfo.removeSuccess'),
  deleteApi: deleteMcpSingleApi,
})

// /** 导出按钮操作 */
// function handleExport() {
//   proxy.download("system/user/export", {
//     ...queryParams.value,
//   }, `user_${new Date().getTime()}.xlsx`)
// }

/** 启用按钮操作 */
function handleEnable(row: McpEntity) {
  if (!row.id) return;
  const message = t('page.mcp.enableConfirmSingle', { id: row.id }, `是否确认启用编号为 ${row.id} 的MCP服务？`);
  const saveIds = [row.id];
  modal.confirm(message).then(function () {
    return doEnable(saveIds)
  }, () => { });
}
function doEnable(saveIds: string[]) {
  return enableMcpBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.enableSuccess'))
      loadTableData()
    }
  })
}

/** 停用按钮操作 */
function handleDisable(row: McpEntity) {
  if (!row.id) return;
  const message = t('page.mcp.disableConfirmSingle', { id: row.id }, `是否确认停用编号为 ${row.id} 的MCP服务？`);
  const saveIds = [row.id];
  modal.confirm(message).then(function () {
    return doDisable(saveIds)
  }, () => { });
}
function doDisable(saveIds: string[]) {
  return disableMcpBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      modal.msgSuccess(t('page.normal.confirmInfo.disableSuccess'))
      loadTableData()
    }
  })
}

const addEditDrawerRef = ref<InstanceType<typeof AddEditDrawer>>();

function handleAdd() {
  addEditDrawerRef.value?.openAdd();
}

function handleUpdate(row: McpEntity) {
  if (row.id) addEditDrawerRef.value?.openEdit(row.id);
}

loadTableData()
</script>
