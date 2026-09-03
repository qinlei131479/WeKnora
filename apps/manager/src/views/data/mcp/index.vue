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
        <div class="action-toolbar">
        <div class="action-toolbar__left">
          <!-- <button type="button" class="toolbar-btn" :disabled="multiple" v-hasPermi="['system:dict:remove']"
            @click="handleDelete()">
            批量删除
          </button> -->
          <el-button class="toolbar-btn" :disabled="multiple" v-hasPermi="['business:mcpServices:edit']"
            @click="handleEnable()">
            {{ $t('page.normal.batchEnable', '批量启用') }}
          </el-button>
          <el-button class="toolbar-btn" :disabled="multiple" v-hasPermi="['business:mcpServices:edit']"
            @click="handleDisable()">
            {{ $t('page.normal.batchDisable', '批量停用') }}
          </el-button>
          <span class="selected-text">{{ $t('page.normal.selected', '共选中') }} <span>{{ ids.length }}</span> {{
            $t('page.normal.items', '条') }}</span>
        </div>

        <div class="action-toolbar__right">
          <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:export']" @click="handleExport">导出</button> -->
          <!-- <button type="button" class="toolbar-btn" v-hasPermi="['system:dict:remove']"
            @click="handleRefreshCache">刷新缓存</button> -->
          <!-- <right-toolbar v-model:showSearch="showSearch" @queryTable="loadTableData" /> -->
        </div>
      </div>
      </template>
      <el-table ref="tableRef" v-loading="loading" :data="tableData" height="100%"
        @selection-change="handleSelectionChange">
        <template #empty>
          <kjsc-empty />
        </template>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column :label="$t('page.mcp.id', '编号')" align="left" key="id" prop="id"
          :width="$dim('page.mcp.id', 320)"
          :show-overflow-tooltip="true" />
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
              {{ $t('page.normal.edit') }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)"
              v-hasPermi="['business:mcpServices:remove']">
              {{ $t('page.normal.remove') }}
            </el-button>
            <el-button v-if="!scope.row.enabled" link type="primary"
              @click="handleEnable(scope.row)" v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.enable') }}
            </el-button>
            <el-button v-else link type="danger" @click="handleDisable(scope.row)"
              v-hasPermi="['business:mcpServices:edit']">
              {{ $t('page.normal.disable') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <pagination v-show="total > 0" :total="total" v-model:page="pageParams.pageNum" v-model:limit="pageParams.pageSize" @pagination="loadTableData" />
      </template>
    </page-content>

    <!-- 添加或修改对话框 -->
    <KjscRtlDrawer :title="$t(title)" v-model="open" size="800px"
      custom-class="mcp-form-dialog" close-on-click-modal>
      <el-form :model="form" :rules="rules" ref="saveFormRef" label-position="top" class="user-form" >
        <!--
          从代码导入：粘贴标准 mcpServers JSON，纯前端解析后填回表单。
          不自动提交；用户检查后再点保存。
        -->
        <section class="setting-drawer__section code-import">
          <button type="button" class="code-import__toggle" @click="codeImportOpen = !codeImportOpen">
            <!-- <t-icon :name="codeImportOpen ? 'chevron-down' : 'chevron-right'" /> -->
            <el-icon class="code-import__icon">
              <ChevronDown v-if="codeImportOpen" />
              <ChevronRight v-else />
            </el-icon>
            <span>{{ t('page.mcp.mcpServiceDialog.codeImport.toggle') }}</span>
          </button>
          <div v-if="codeImportOpen" class="code-import__body">
            <p class="form-desc">{{ t('page.mcp.mcpServiceDialog.codeImport.hint') }}</p>
            <p v-if="mode === 'edit'" class="form-desc code-import__warn">
              {{ t('page.mcp.mcpServiceDialog.codeImport.editOverwriteHint') }}
            </p>
            <el-input type="textarea" v-model="codeImportText" :autosize="{ minRows: 5, maxRows: 14 }"
              :placeholder="codeImportPlaceholder" class="code-import__textarea" />
            <p v-if="codeImportError" class="code-import__error">{{ codeImportError }}</p>
            <div class="code-import__actions">
              <el-button type="primary" @click="handleCodeImport">
                {{ t('page.mcp.mcpServiceDialog.codeImport.parse') }}
              </el-button>
            </div>
          </div>
        </section>
        <!-- Section 1 — 基本信息 -->
        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.basicSection', '基本信息') }}</h4>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.name')" prop="name">
            <el-input v-model="form.name" :placeholder="t('page.mcp.mcpServiceDialog.namePlaceholder')" maxlength="999"
              :show-word-limit="false" />
          </el-form-item>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.description')" prop="description">
            <el-input v-model="form.description" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }"
              :placeholder="t('page.mcp.mcpServiceDialog.descriptionPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.enableService')" prop="enabled">
            <el-switch v-model="form.enabled" />
            <span class="form-desc form-desc--inline">
              {{ t('page.mcp.mcpServiceDialog.enableServiceDesc', '关闭后该服务不会被调用') }}
            </span>
          </el-form-item>
        </section>
        <!-- Section 2 — 连接配置（transport + url） -->
        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.connectionSection', '连接配置') }}</h4>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.transportType')" prop="transportType">
            <el-radio-group v-model="form.transportType">
              <el-radio-button value="sse">SSE</el-radio-button>
              <el-radio-button value="http-streamable">HTTP Streamable</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.serviceUrl')" prop="serviceUrl">
            <el-input v-model="form.serviceUrl" :placeholder="t('page.mcp.mcpServiceDialog.serviceUrlPlaceholder')"
              maxlength="9999" :show-word-limit="false" />
          </el-form-item>
          <el-form-item prop="custom_headers">
            <template #label>
              <div>
                <div>
                  <div>{{ t('page.mcp.mcpServiceDialog.customHeaders.label') }}</div>
                  <div>
                    <el-button text size="small" @click="addCustomHeader">
                      <el-icon>
                        <Plus />
                      </el-icon>
                      {{ t('page.mcp.mcpServiceDialog.customHeaders.add') }}
                    </el-button>
                  </div>
                </div>
                <p class="form-desc custom-headers-desc">{{ t('page.mcp.mcpServiceDialog.customHeaders.desc') }}</p>
              </div>
            </template>
            <div v-if="form.custom_headers.length > 0" class="custom-headers-list">
              <div v-for="(item, idx) in form.custom_headers" :key="idx" class="custom-header-row">
                <el-input v-model="item.key" :placeholder="t('page.mcp.mcpServiceDialog.customHeaders.keyPlaceholder')"
                  class="custom-header-key" />
                <el-input v-model="item.value" :placeholder="t('page.mcp.mcpServiceDialog.customHeaders.valuePlaceholder')"
                  class="custom-header-value" />
                <el-button text size="small" class="custom-header-remove" :aria-label="t('common.delete')"
                  @click="removeCustomHeader(idx)">
                  <el-icon>
                    <X />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>
        </section>
        <!-- Section 3 — 认证配置（无 / API Key / Bearer Token / OAuth） -->
        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.authConfig') }}</h4>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.authType')" prop="authType">
            <el-radio-group v-model="form.authType">
              <el-radio-button v-for="(item, idx) in authTypeOptions" :key="idx" :value="item.value"
                :disabled="item.disabled">{{ item.label }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <!-- OAuth 2.0：零配置（自动发现 + 动态客户端注册），按用户授权 -->
          <template v-if="form.authType === 'oauth'">
            <!-- <el-form-item :label="t('page.mcp.mcpServiceDialog.oauthScopes', 'Scopes（可选，空格分隔）')" prop="oauthClientId">
              <el-input v-model="form.oauthScopesText" :placeholder="t('page.mcp.mcpServiceDialog.optional')" />
            </el-form-item>
            <el-form-item :label="t('page.mcp.mcpServiceDialog.oauthAuthorization', '授权状态')">
              <div class="oauth-status">
                <el-tag v-if="oauthTokenState === 'authorized'" type="success" variant="light">
                  {{ t('page.mcp.mcpServiceDialog.oauthAuthorized', '已授权') }}
                </el-tag>
                <el-tag v-else-if="oauthTokenState === 'refreshable'" type="primary" variant="light">
                  {{ t('page.mcp.mcpServiceDialog.oauthRefreshable', 'Token 已过期，将自动刷新') }}
                </el-tag>
                <el-tag v-else type="warning" variant="light">
                  {{ t('page.mcp.mcpServiceDialog.oauthUnauthorized', '未授权') }}
                </el-tag>
                <el-button
                  size="small"
                  type="primary"
                  :loading="oauthAuthorizing || oauthChecking || submitting"
                  @click="handleAuthorize"
                >
                  {{ oauthTokenState === 'reauth_required' ? t('page.mcp.mcpServiceDialog.oauthAuthorize', '去授权') : t('page.mcp.mcpServiceDialog.oauthReauthorize', '重新授权') }}
                </el-button>
                <el-button
                  v-if="oauthTokenState !== 'reauth_required' && props.service?.id"
                  size="small"
                  type="danger"
                  variant="outline"
                  @click="handleRevokeOAuth"
                >
                  {{ t('page.mcp.mcpServiceDialog.oauthRevoke', '撤销授权') }}
                </el-button>
              </div>
              <p class="form-desc">
                {{ t('page.mcp.mcpServiceDialog.oauthAuthorizeHint', '点击「去授权」会先自动保存当前配置，再发起授权（每个用户独立授权）。') }}
              </p>
            </el-form-item>
             -->
          </template>

          <!--
            非 OAuth：Edit 模式下凭证由 CredentialResource 管理（独立的
            /credentials 子资源调用）；Create 模式下用 plain password input。
            两个字段都是 optional — MCP 服务可能完全不需要鉴权。
          -->
          <!-- 凭证 Header 策略：请求头名称 + 密钥值（其余 auth_type 不展示密钥字段） -->
          <template v-else-if="form.authType === 'api_key'">
            <el-form-item :label="t('page.mcp.mcpServiceDialog.apiKeyHeader', '请求头名称')" prop="api_key_header">
              <el-input v-model="form.api_key_header" placeholder="X-API-Key" />
              <p class="form-desc">{{ t('page.mcp.mcpServiceDialog.apiKeyHeaderDesc', '留空默认 X-API-Key。Bearer 方式请填 Authorization，并在下方密钥值中写 “Bearer<token>”；需要裸 token 时填 Authorization 并直接填入 token。') }}</p>
            </el-form-item>
            <!-- <CredentialResource v-if="mode === 'update'" :api="credentialApi" :fields="credentialFields"
              :meta="credentialMeta" /> -->
            <el-form-item :label="t('page.mcp.mcpServiceDialog.credentialValue', '密钥值 / Token')" prop="api_key">
              <el-input v-model="form.api_key" type="password" show-password autocomplete="new-password"
                :placeholder="t('page.mcp.mcpServiceDialog.optional')" prefix-icon="Lock" />
            </el-form-item>
          </template>
        </section>

        <!-- Section 4 — 高级配置（超时/重试），改用带后缀单位的轻量数字输入框，
           不再用 t-input-number 的加减器（步进按钮在这里没必要，用户更倾向直接键入）。 -->
        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.advancedConfig') }}</h4>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.timeoutSec')" prop="advancedConfig_timeout">
            <el-input-number v-model="form.advancedConfig_timeout" :min="1" :max="300" placeholder="30">
              <template #suffix>
                <span class="number-input__unit">{{ t('page.mcp.mcpServiceDialog.unitSecond', '秒') }}</span>
              </template>
            </el-input-number>
          </el-form-item>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.retryCount')" prop="advancedConfig_retry_count">
            <el-input-number v-model="form.advancedConfig_retry_count" :min="1" :max="3" placeholder="3">
              <template #suffix>
                <span class="number-input__unit">{{ t('page.mcp.mcpServiceDialog.unitTimes', '次') }}</span>
              </template>
            </el-input-number>
          </el-form-item>
          <el-form-item :label="t('page.mcp.mcpServiceDialog.retryDelaySec')" prop="advancedConfig_retry_delay">
            <el-input-number v-model="form.advancedConfig_retry_delay" :min="0" :max="60" placeholder="1">
              <template #suffix>
                <span class="number-input__unit">{{ t('page.mcp.mcpServiceDialog.unitSecond', '秒') }}</span>
              </template>
            </el-input-number>
          </el-form-item>
        </section>

        <!-- Section 5 — 测试结果（内联，避免在抽屉上再叠一个居中弹窗） -->
        <section v-if="testResult" ref="testResultSection" class="setting-drawer__section">
          <div class="test-result-header">
            <h4 class="setting-drawer__section-title">{{ t('page.mcp.mcpServiceDialog.testResultTitle', '测试结果') }}</h4>
            <el-button text shape="square" size="small" class="test-result-close" @click="testResult = null">
              <template #icon><el-icon>
                  <X />
                </el-icon></template>
            </el-button>
          </div>
          <McpTestResultBody :result="testResult" :service-id="form.id" />
        </section>
      </el-form>
      <template #footer>
        <div class="manage-dialog-footer">
          <el-button class="test-btn" :disabled="!form.id" @click="handleTestConnection">
            <template v-if="!testing && typeof lastTestOk === 'boolean'" #icon>
              <el-icon v-if="!testing && lastTestOk === true" class="status-icon available">
                <CircleCheck />
              </el-icon>
              <el-icon v-else-if="!testing && lastTestOk === false" class="status-icon unavailable">
                <CircleX />
              </el-icon>
            </template>{{ t('form.button.test', '测试连接') }}
          </el-button>
          <el-button class="close-btn" @click="closeDialog">
            {{ t('form.button.close', '取消') }}
          </el-button>
          <el-button type="primary" class="submit-btn" :disabled="submitDisabled" @click="submitForm">
            {{ t('form.button.submit', '保存') }}
          </el-button>
        </div>
      </template>
    </KjscRtlDrawer>

  </section>
</template>

<script setup lang="ts" name="Models">
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus'
// import { Close, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ChevronDown, ChevronRight, X, CircleCheck, CircleX } from 'lucide-vue-next';
import McpTestResultBody from './components/McpTestResultBody.vue'
import CredentialResource, {
  type CredentialFieldDef,
  type CredentialResourceApi,
} from "@/components/credentials/CredentialResource.vue";
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { isEmpty } from "@/utils/common.js";
import { AjaxResult, McpEntity, McpListReq, TableShowColumns, MCPOAuthTokenState, McpCredentialField, McpAuthConfig, McpAdvancedConfig } from "@/types";
import { deleteMcpSingleApi, disableMcpBatchApi, enableMcpBatchApi, getMcplistApi, getMcpSingleApi, insertMcpSingleApi, updateMcpSingleApi, testMcpServiceApi, type MCPTestResult } from "@/api/data/mcp";
import useTableData from '@/composables/useTableData.js';


interface FormEntity extends McpEntity {
  custom_headers: { key: string; value: string }[];
  authType: string;
  oauthScopesText: string;
  api_key_header: string;
  api_key: string;
  authConfigToken?: string;
  auth_server_metadata_url?: string;
  advancedConfig_timeout: number;
  advancedConfig_retry_count: number;
  advancedConfig_retry_delay: number;
  // auth_config: {
  //   authType: string;
  //   apiKey: string;
  //   apiKeyHeader: string;
  //   token: string;
  //   scopes: string[];
  //   authServerMetadataUrl: string;
  // },
  // advanced_config: {
  //   timeout: number;
  //   retry_count: number;
  //   retry_delay: number;
  // }
}
const { proxy } = getCurrentInstance()

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

const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)

// /** 导出按钮操作 */
// function handleExport() {
//   proxy.download("system/user/export", {
//     ...queryParams.value,
//   }, `user_${new Date().getTime()}.xlsx`)
// }

/** 选择条数  */
function handleSelectionChange(selection: McpEntity[]) {
  ids.value = selection.map(item => item.id!)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 启用按钮操作 */
function handleEnable(row?: McpEntity) {
  let message = '';
  let saveIds: string[] = [];
  if (row) {
    message = t('page.mcp.enableConfirmSingle', { id: row.id }, `是否确认启用编号为 ${row.id} 的MCP服务？`)
    saveIds.push(row.id!)
  } else {
    if (ids.value.length === 0) {
      proxy.$modal.msgError(t('page.mcp.confirmMultiError'))
      return
    }
    message = t('page.mcp.enableConfirmMulti', {}, '是否确认启用选中的MCP服务？')
    saveIds = ids.value
  }
  proxy.$modal.confirm(message).then(function () {
    return doEnable(saveIds)
  }, () => { });
}
function doEnable(saveIds: string[]) {
  return enableMcpBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.normal.confirmInfo.enableSuccess'))
      loadTableData()
    }
  })
}

/** 停用按钮操作 */
function handleDisable(row?: McpEntity) {
  let message = '';
  let saveIds: string[] = [];
  if (row) {
    message = t('page.mcp.disableConfirmSingle', { id: row.id }, `是否确认停用编号为 ${row.id} 的MCP服务？`)
    saveIds.push(row.id!)
  } else {
    if (ids.value.length === 0) {
      proxy.$modal.msgError(t('page.mcp.confirmMultiError'))
      return
    }
    message = t('page.mcp.disableConfirmMulti', {}, '是否确认停用选中的MCP服务？')
    saveIds = ids.value
  }
  proxy.$modal.confirm(message).then(function () {
    return doDisable(saveIds)
  }, () => { });
}
function doDisable(saveIds: string[]) {
  return disableMcpBatchApi(saveIds).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess(t('page.normal.confirmInfo.disableSuccess'))
      loadTableData()
    }
  })
}

// // 校验登录账号
// const validateUserName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("登录账号不能为空"));
//   } else {
//     if (form.value.userId) {
//       callback();
//     } else {
//       const reg = /^[0-9a-zA-Z]*$/;
//       if (reg.test(value)) {
//         // 接口调用
//         checkUserNameValue({ name: value })
//           .then((res: any) => {
//             if (!res.data) {
//               callback();
//             } else {
//               callback(new Error("该登陆账号已被占用、请重新输入"));
//             }
//           })
//           .catch((err: any) => {
//             console.log(err);
//           });
//       } else {
//         callback(new Error("只能输入数字和字母"));
//       }
//     }
//   }
// };
// // 校验用户昵称
// const validateNickName = (rule: any, value: string, callback: Function) => {
//   if (!value) {
//     callback(new Error("用户昵称不能为空"));
//   } else {
//     const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
//     if (regex.test(value)) {
//       callback();
//     } else {
//       callback(new Error("只能输入中文、数字、字母"));
//     }
//   }
// };

const open = ref<boolean>(false)
let mode = '';
const title = ref<string>("page.mcp.addTitle")
const saveFormRef = ref(null);
const data = reactive({
  form: {
    custom_headers: [],
    authType: '',
    oauthScopesText: '',
    api_key_header: '',
    api_key: '',
    advancedConfig_timeout: 0,
    advancedConfig_retry_count: 0,
    advancedConfig_retry_delay: 0,
    // auth_config: {
    //   authType: '',
    //   apiKey: '',
    //   apiKeyHeader: '',
    //   token: '',
    //   scopes: [],
    //   authServerMetadataUrl: '',
    // },
    // advanced_config: {
    //   timeout: 0,
    //   retry_count: 0,
    //   retry_delay: 0,
    // }
  } as FormEntity,
  queryParams: {
    name: undefined,
    // tenantId: undefined,
    // phonenumber: undefined,
    // status: undefined,
    // deptId: undefined
  } as McpListReq,
  pageParams: {
    orderByColumn: 'createTime',
    isAsc: 'desc',
    pageNum: 1,
    pageSize: 10,
  },
  // orginPwd: "a123456",
  rules: {
    // nickName: [
    //   { required: true, validator: validateNickName, trigger: "blur" },
    // ],
    // name: [
    //   { required: true, validator: validateUserName, trigger: "blur" },
    // ],
    // tenantId: [{ required: true, message: "租户不能为空", trigger: "change" }],
    // roleIds: [
    //   { required: true, message: "所属角色不能为空", trigger: "change" },
    // ],
    // deptIds: [
    //   { required: true, message: "所属部门不能为空", trigger: "change" },
    // ],
    // postIds: [
    //   { required: true, message: "岗位不能为空", trigger: "change" },
    // ],
  }
})

const { form, rules } = toRefs(data)

// 是否必填为空
const submitDisabled = computed(() => {
  const formValue: McpEntity = form.value
  return (
    // isEmpty(formValue.nickName) ||
    isEmpty(formValue.name)
    // isEmpty(formValue.tenantId)
    // isEmpty(formValue.roleIds)
  );
});

/** 重置操作表单 */
function reset() {
  form.value = {
    custom_headers: [],
    name: undefined
  }
  proxy.resetForm("saveFormRef")
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  title.value = "page.mcp.addTitle"
  // getTanentList();
  open.value = true
  mode = 'add';
}

/** 修改按钮操作 */
function handleUpdate(row: McpEntity) {
  reset()
  title.value = "page.mcp.updateTitle"
  const id = row?.id || ids.value[0]
  mode = 'update';
  getMcpSingleApi(id).then(res => {
    // const response: any = res
    // form.value = response.data
    // postOptions.value = response.posts
    // roleOptions.value = response.roles
    // form.value.postIds = response.postIds
    // form.value.roleIds = response.roleIds
    // open.value = true
    // title.value = "修改用户"
    // form.value.password = ""
    if (res?.code === 200) {
      const response: any = res.data;
      form.value = serverDataToFormData(response || {});
      open.value = true;
      // getTanentList();
    }
  })
}

function serverDataToFormData(data: McpEntity) {
  const formData = { ...data } as FormEntity;
  formData.custom_headers = []
  if (formData.headers) {
    try {
      formData.custom_headers = JSON.parse(formData.headers);
    } catch (error) {
      console.log('解析headers失败', formData.headers, error)
    }
  }
  if (formData.authConfig) {
    let authConfigSouce: any = formData.authConfig;
    let authConfig: McpAuthConfig = {};
    if (typeof authConfigSouce == 'string') {
      try {
        authConfig = JSON.parse(authConfigSouce);
      } catch (error) {
        console.log('解析authConfig失败', authConfigSouce, error)
      }
    } else {
      authConfig = authConfigSouce;
    }
    if (authConfig.auth_type) {
      formData.authType = authConfig.auth_type;
    }
    if (authConfig.api_key) {
      formData.api_key = authConfig.api_key;
    }
    if (authConfig.api_key_header) {
      formData.api_key_header = authConfig.api_key_header;
    }
    if (authConfig.scopes) {
      let scopes: any = authConfig.scopes;
      if (typeof scopes == 'string') {
        try {
          scopes = JSON.parse(scopes);
        } catch (error) {
          console.log('解析scopes失败', scopes, error)
          scopes = scopes.split(' ');
        }
      }
      formData.oauthScopesText = scopes.join(' ');
    } else {
      formData.oauthScopesText = '';
    }
    if (authConfig.token) {
      formData.authConfigToken = authConfig.token;
    }
    if (authConfig.auth_server_metadata_url) {
      formData.auth_server_metadata_url = authConfig.auth_server_metadata_url;
    }
  }
  formData.advancedConfig_timeout = 30;
  formData.advancedConfig_retry_count = 3;
  formData.advancedConfig_retry_delay = 1;
  if (formData.advancedConfig) {
    let advancedConfigSource: any = formData.advancedConfig;
    let advancedConfig: McpAdvancedConfig = {};
    if (typeof advancedConfigSource == 'string') {
      try {
        advancedConfig = JSON.parse(advancedConfigSource);
      } catch (error) {
        console.log('解析advancedConfig失败', advancedConfigSource, error)
      }
    } else {
      advancedConfig = advancedConfigSource;
    }
    if (advancedConfig.timeout) {
      formData.advancedConfig_timeout = +advancedConfig.timeout || 30;
    }
    if (advancedConfig.retry_count) {
      formData.advancedConfig_retry_count = +advancedConfig.retry_count || 3;
    }
    if (advancedConfig.retry_delay) {
      formData.advancedConfig_retry_delay = +advancedConfig.retry_delay || 0;
    }
  }
  return formData
}
function formDataToServerData(formData: FormEntity) {
  const {
    custom_headers, authType, oauthScopesText,
    api_key_header, api_key, authConfigToken,
    auth_server_metadata_url,
    advancedConfig_timeout, advancedConfig_retry_count, advancedConfig_retry_delay,
    ...serverData
  } = formData;
  serverData.headers = JSON.stringify(custom_headers);
  const authConfig: McpAuthConfig = {
    auth_type: authType,
    api_key,
    api_key_header,
    scopes: oauthScopesText.split(' ')
  }
  if (authConfigToken) {
    authConfig.token = authConfigToken;
  }
  if (auth_server_metadata_url) {
    authConfig.auth_server_metadata_url = auth_server_metadata_url;
  }
  serverData.authConfig = JSON.stringify(authConfig);
  const advancedConfig: McpAdvancedConfig = {
    timeout: advancedConfig_timeout,
    retry_count: advancedConfig_retry_count,
    retry_delay: advancedConfig_retry_delay,
  }
  serverData.advancedConfig = JSON.stringify(advancedConfig);
  return serverData
}

function doUpdate() {
  const params = formDataToServerData(form.value);
  return updateMcpSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess("修改成功")
      loadTableData()
      open.value = false
    }
  })
}

function doAdd() {
  const params = formDataToServerData(form.value);
  return insertMcpSingleApi(params).then((res: AjaxResult) => {
    if (res.code === 200) {
      proxy.$modal.msgSuccess("新增成功")
      loadTableData()
      open.value = false
    }
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["saveFormRef"].validate((valid: boolean) => {
    if (valid) {
      if (mode === 'update') {
        doUpdate()
      } else {
        doAdd()
      }
    }
  })
}
function closeDialog() {
  open.value = false
}


// ---- Code import (paste standard mcpServers JSON) ----
const codeImportOpen = ref(false)
const codeImportText = ref('')
const codeImportError = ref('')
const codeImportPlaceholder = `{
  "mcpServers": {
    "my-server": {
      "url": "https://example.com/sse"
    }
  }
}`

// Map a raw MCP server config object onto the form. Stdio is rejected.
function applyServerConfig(name: string, cfg: Record<string, unknown>) {
  if (cfg.command) {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.stdioUnsupported')
    return false
  }
  const url = typeof cfg.url === 'string' ? cfg.url.trim() : ''
  if (!url) {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.missingUrl')
    return false
  }

  // Transport: explicit type/transport wins, else guess from the URL shape.
  const rawType = String(cfg.type ?? cfg.transport ?? '').toLowerCase()
  let transport: 'sse' | 'http-streamable'
  if (rawType === 'sse') {
    transport = 'sse'
  } else if (['http', 'http-streamable', 'streamable-http', 'streamablehttp', 'streamable_http'].includes(rawType)) {
    transport = 'http-streamable'
  } else {
    transport = /\/sse\/?($|\?)/i.test(url) ? 'sse' : 'http-streamable'
  }

  // Auth: recognise Bearer / API-key headers; every other header lands in the
  // custom-headers editor so nothing is silently dropped.
  // Map a recognised auth header onto the unified credential strategy: the raw
  // header value is the secret (encrypted), carried in the given header name.
  // Bearer keeps its "Bearer " prefix inside the value; Authorization with a
  // raw token and X-API-Key all collapse to the same shape.
  let authType: '' | 'api_key' = ''
  let apiKey = ''
  let apiKeyHeader = ''
  const custom_headers: { key: string; value: string }[] = []
  const headers = (cfg.headers && typeof cfg.headers === 'object')
    ? (cfg.headers as Record<string, unknown>)
    : {}
  for (const [key, val] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    const strVal = typeof val === 'string' ? val : String(val ?? '')
    if (lowerKey === 'authorization' || ['x-api-key', 'api-key', 'apikey'].includes(lowerKey)) {
      authType = 'api_key'
      apiKey = strVal.trim()
      apiKeyHeader = lowerKey === 'x-api-key' ? '' : key
    } else {
      custom_headers.push({ key, value: strVal })
    }
  }

  const formData = form;
  formData.value.name = name || formData.value.name
  formData.value.url = url
  // formData.value.transport_type = transport
  if (typeof cfg.description === 'string') formData.value.description = cfg.description
  // formData.value.headers = custom_headers
  // No recognised auth header → none (custom headers carry the rest).
  // formData.value.auth_config.auth_type = authType
  // formData.value.auth_config.token = ''
  // formData.value.auth_config.api_key = apiKey
  // formData.value.auth_config.api_key_header = apiKeyHeader
  // formData.value.auth_config.scopes = []

  const formValue: FormEntity = formData.value
  formValue.transportType = transport
  formValue.custom_headers = custom_headers
  formValue.authType = authType
  formValue.oauthScopesText = ''
  formValue.api_key_header = apiKeyHeader
  formValue.api_key = apiKey
  return true
}

const handleCodeImport = () => {
  codeImportError.value = ''
  const raw = codeImportText.value.trim()
  if (!raw) {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.empty')
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.invalidJson')
    return
  }
  if (!parsed || typeof parsed !== 'object') {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
    return
  }

  const obj = parsed as Record<string, unknown>
  let name = ''
  let cfg: Record<string, unknown> | null = null
  let multiple = false

  const servers = obj.mcpServers
  if (servers && typeof servers === 'object') {
    const entries = Object.entries(servers as Record<string, unknown>)
    if (entries.length === 0) {
      codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
      return
    }
    multiple = entries.length > 1
    name = entries[0][0]
    cfg = entries[0][1] as Record<string, unknown>
  } else if (obj.url || obj.command) {
    // Bare single-server object (no mcpServers wrapper).
    cfg = obj
  } else {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
    return
  }

  if (!cfg || typeof cfg !== 'object') {
    codeImportError.value = t('page.mcp.mcpServiceDialog.codeImport.errors.noServer')
    return
  }

  if (!applyServerConfig(name, cfg)) return

  saveFormRef.value?.clearValidate()
  if (multiple) {
    proxy.$modal.msgInfo(
      t('page.mcp.mcpServiceDialog.codeImport.toasts.multipleServers', { name }) as string,
    )
  } else {
    proxy.$modal.msgSuccess(t('page.mcp.mcpServiceDialog.codeImport.toasts.filled') as string)
  }
}

// ---- Custom headers (key/value editor, same UX as ModelEditorDialog) ----
const addCustomHeader = () => {
  form.value.custom_headers.push({ key: '', value: '' })
}
const removeCustomHeader = (idx: number) => {
  form.value.custom_headers.splice(idx, 1)
}

// Comma/space separated text binding for OAuth scopes.
const oauthScopesText = computed({
  get: () => (form.value.auth_config.scopes || []).join(' '),
  set: (val: string) => {
    form.value.auth_config.scopes = val
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  },
})
const authTypeOptions = computed(() => [
  { value: '', disabled: false, label: t('page.mcp.mcpServiceDialog.authTypeNone', '无 / 自定义 Header') },
  { value: 'api_key', disabled: false, label: t('page.mcp.mcpServiceDialog.authTypeApiKey', 'API Key / Token') },
  { value: 'oauth', disabled: true, label: t('page.mcp.mcpServiceDialog.authTypeOAuth', 'OAuth 2.0（首次连接授权）') },
])

// Field metadata for the credential subresource. Keep label keys local to
// MCP so other resources don't accidentally inherit "API Key" / "Bearer
// Token" labels via the shared component.
// The unified credential strategy stores its secret in the api_key field
// (placed verbatim into the configured header). None / OAuth carry no static
// secret, so the credential card is only shown for the api_key strategy.
const credentialFields = computed<CredentialFieldDef<McpCredentialField>[]>(() => {
  if (form.value.authType === 'api_key') {
    return [{ key: 'api_key', label: t('page.mcp.mcpServiceDialog.credentialValue', '密钥值 / Token') }]
  }
  return []
})

// Adapter that binds the generic CredentialResource component to the MCP
// credential endpoints. Recomputed if the user opens a different service.
const credentialApi = computed<CredentialResourceApi<McpCredentialField>>(() => {
  // const id = form.value.id ?? ''
  return {
    save: async (patch: any) => {
      // const meta = await putMCPCredentials(id, patch)
      // return meta.fields
      const newValue: any = {};
      for(var key in patch) {
        newValue[key] = {
          configured: true,
          value: patch[key],
        }
      }
      Object.assign(form.value, patch)
      return newValue
    },
    remove: async (field: McpCredentialField) => {
      // await deleteMCPCredentialField(id, field)
      form.value[field] = '';
    },
  }
})

const credentialMeta = computed(() => {
  // return form.value.credentials ?? {
  //   api_key: { configured: false },
  //   token: { configured: false },
  // }
  return {
    api_key: { configured: !!form.value.api_key }
  }
})



// ---- Test connection state (in-drawer) ----
const testing = ref(false)
// Tri-state icon hint on the test button: null=neutral, true=just succeeded,
// false=just failed. Cleared when transport/url change so a stale ✓/✗
// doesn't sit next to a config the user is now editing.
const lastTestOk = ref<boolean | null>(null)
// In-drawer test result, rendered inline (no centered dialog stacked on the
// drawer). Cleared when the target config changes so a stale result doesn't
// sit next to edited config.
const testResult = ref<MCPTestResult | null>(null)
const testResultSection = ref<HTMLElement | null>(null)

// 结果区在抽屉最底部，测试完成后主动滚动到可见，免得用户以为没反应。
function scrollToTestResult() {
  void nextTick(() => {
    testResultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

watch(
  () => [form.value.transportType, form.value.url],
  () => {
    lastTestOk.value = null
    testResult.value = null
  },
)

async function handleTestConnection() {
  if (!form.value.id) return
  testing.value = true
  ElMessage.info({
    message: t('page.mcp.toasts.testing', { name: form.value.name || '' }),
    duration: 0,
    showClose: false,
  })
  try {
    const result = await testMcpServiceApi(form.value.id)
    ElMessage.closeAll()
    const safe: MCPTestResult = result?.data ?? {
      success: false,
      message: t('page.mcp.toasts.noResponse') as string,
    }
    lastTestOk.value = safe.success === true
    testResult.value = safe
    const discoveredDescription = typeof safe.description === 'string' ? safe.description.trim() : ''
    if (safe.success === true && discoveredDescription) {
      form.value.description = discoveredDescription
    }
    // // Server told us it needs OAuth (RFC 9728): guide the user by switching the
    // // auth strategy to OAuth. We intentionally do NOT prefill
    // // auth_server_metadata_url — the discovered URL is the RFC 9728
    // // protected-resource metadata (not the RFC 8414 authorization-server
    // // metadata), and the client library discovers the right endpoints from the
    // // base URL on its own.
    // // oauth_required 接口无此字段
    // if (safe.oauth_required === true && form.value.authType !== 'oauth') {
    //   form.value.authType = 'oauth'
    //   ElMessage.warning(
    //     t('page.mcp.mcpServiceDialog.toasts.oauthRequired', '该服务需要 OAuth 授权，已自动切换为 OAuth 2.0，请保存后点击「去授权」。') as string,
    //   )
    // }
    scrollToTestResult()
  } catch (error: any) {
    ElMessage.closeAll()
    const errorMessage =
      error?.response?.data?.error?.message ||
      error?.message ||
      (t('page.mcp.toasts.testFailed') as string)
    console.error('Failed to test MCP service:', error)
    lastTestOk.value = false
    testResult.value = { success: false, message: errorMessage }
    scrollToTestResult()
  } finally {
    testing.value = false
  }
}

loadTableData()
</script>

<style scoped lang="scss">
.el-input-number {
  width: 100%;
}

// ---- 从代码导入 ----
.code-import {
  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-color-primary);

    &:hover {
      color: var(--el-color-primary-light-3);
    }
  }

  &__body {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__warn {
    color: var(--el-color-warning);
  }

  &__textarea :deep(textarea) {
    font-family: monospace;
    font-size: 12px;
  }

  &__error {
    margin: 0;
    font-size: 12px;
    color: var(--el-color-danger);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}

// ---- 自定义请求头（与 ModelEditorDialog 同款 key/value 行） ----
.custom-headers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.custom-headers-desc {
  margin: 4px 0 8px;
}

.custom-headers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-header-key {
  flex: 0 0 38%;
}

.custom-header-value {
  flex: 1;
  min-width: 0;
}

.custom-header-remove {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);

  &:hover,
  &:focus-visible {
    color: var(--el-color-danger);
  }
}

.setting-drawer__section {
  .setting-drawer__section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.test-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .setting-drawer__section-title {
    margin-bottom: 0;
  }

  .test-result-close {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
  }
}

.manage-dialog-footer {
  // .test-btn {
  //   margin-right: auto;
  // }

  // .close-btn {
  //   margin-right: 12px;
  // }
}
// ---- footer-left 测试按钮的状态 icon ----
.status-icon {
  font-size: 16px;
  flex-shrink: 0;

  &.available {
    color: var(--el-color-success);
  }

  &.unavailable {
    color: var(--el-color-danger);
  }
}
</style>

<style lang="scss">
</style>
