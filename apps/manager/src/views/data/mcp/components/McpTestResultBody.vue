<template>
  <div v-if="result" class="mtr">
    <!-- 状态条 -->
    <div class="mtr-status" :class="result.success ? 'is-success' : 'is-error'">
      <!-- <t-icon :name="result.success ? 'check-circle-filled' : 'close-circle-filled'" /> -->
      <el-icon>
        <CircleCheck v-if="result.success" />
        <CircleX v-else />
      </el-icon>
      <span>{{ result.success ? $t('page.mcp.testResult.connectionSuccess') : $t('page.mcp.testResult.connectionFailed') }}</span>
    </div>
    <p v-if="result.message" class="mtr-message">{{ result.message }}</p>
    <div v-if="result.success && result.description" class="mtr-service-desc">
      <span>{{ $t('page.mcp.testResult.descriptionLabel') }}</span>
      <p>{{ result.description }}</p>
    </div>

    <template v-if="result.success">
      <!-- 工具列表 -->
      <div v-if="result.tools && result.tools.length > 0" class="mtr-group">
        <div class="mtr-group-title">
          <span>{{ $t('page.mcp.testResult.toolsTitle') }}</span>
          <el-tag type="primary" variant="light" size="small">{{ result.tools.length }}</el-tag>
        </div>
        <div class="mtr-list">
          <div v-for="(tool, index) in displayTools" :key="index" class="mtr-item" :class="{ 'is-open': expandedToolIndex === index }">
            <div class="mtr-item-head" @click="toggleTool(index)">
              <!-- <t-icon name="tools" class="mtr-item-icon" /> -->
              <el-icon class="mtr-item-icon"><Wrench /></el-icon>
              <span class="mtr-item-name">{{ tool.name }}</span>
              <div class="mtr-item-actions" @click.stop>
                <el-tooltip v-if="serviceId" :content="$t('page.mcp.testResult.requireApprovalTip')" placement="top">
                  <span class="mtr-approval">
                    <!-- <t-icon name="error-circle-filled" class="mtr-approval-icon" /> -->
                    <el-icon class="mtr-approval-icon"><CircleAlert /></el-icon>
                    <span class="mtr-approval-label">{{ $t('page.mcp.testResult.requireApproval') }}</span>
                    <el-switch
                      v-model="tool.requireApproval"
                      :loading="approvalLoading[tool.name]"
                      size="small"
                      @change="(v: boolean) => onRequireApprovalChange(tool.name, v)"
                    />
                  </span>
                </el-tooltip>
                <!-- <t-icon
                  :name="expandedToolIndex === index ? 'chevron-up' : 'chevron-down'"
                  class="mtr-chevron"
                /> -->
                <el-icon class="mtr-chevron">
                  <ChevronUp v-if="expandedToolIndex === index" />
                  <ChevronRight v-else />
                </el-icon>
              </div>
            </div>
            <div v-if="tool.description" class="mtr-item-desc" :class="{ 'is-clamped': expandedToolIndex !== index }">
              {{ tool.description }}
            </div>
            <div v-if="expandedToolIndex === index && tool.inputSchema" class="mtr-item-schema">
              <div class="mtr-schema-label">{{ $t('page.mcp.testResult.schemaLabel') }}</div>
              <pre>{{ formatSchema(tool.inputSchema) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源列表 -->
      <div v-if="result.resources && result.resources.length > 0" class="mtr-group">
        <div class="mtr-group-title">
          <span>{{ $t('page.mcp.testResult.resourcesTitle') }}</span>
          <el-tag type="primary" variant="light" size="small">{{ result.resources.length }}</el-tag>
        </div>
        <div class="mtr-list">
          <div v-for="(resource, index) in result.resources" :key="index" class="mtr-item">
            <div class="mtr-item-head is-static">
              <!-- <t-icon name="file" class="mtr-item-icon" /> -->
              <el-icon class="mtr-item-icon"><File /></el-icon>
              <span class="mtr-item-name">{{ resource.name || resource.uri }}</span>
              <el-tag v-if="resource.mimeType" type="default" variant="light-outline" size="small">
                {{ resource.mimeType }}
              </el-tag>
            </div>
            <div v-if="resource.description" class="mtr-item-desc">{{ resource.description }}</div>
            <div v-if="resource.uri" class="mtr-item-uri">
              <!-- <t-icon name="link" /> -->
              <el-icon><Link /></el-icon>
              <span>{{ resource.uri }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="(!result.tools || result.tools.length === 0) && (!result.resources || result.resources.length === 0)"
        :description="$t('page.mcp.testResult.emptyDescription')"
        class="mtr-empty"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import modal from '@/plugins/modal';
// import {
//   Close,
//   CircleCheckFilled,
//   CircleCloseFilled,
//   Tools,
//   WarningFilled,
//   ArrowUpBold,
//   ArrowDownBold,
//   Document,
//   Link
// } from '@element-plus/icons-vue';
import { X, CircleCheck, CircleX, Wrench, CircleAlert, ChevronUp, ChevronRight, File, Link } from 'lucide-vue-next';
import { API } from '@/api';
import type { McpTestResultVO, McpToolVO, McpToolApprovalsDTO } from '@/types';
// import { MessagePlugin } from 'tdesign-vue-next'

import { useI18n } from 'vue-i18n';

interface Props {
  result: McpTestResultVO | null;
  /** 按服务加载、保存工具审批状态 */
  serviceId?: string;
  /** 是否加载审批状态，默认启用 */
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), { active: true });

const getMCPToolApprovals = (id: string) => {
  return API.McpServices.listTools(id).then((res) => res.data ?? []);
};
const setMCPToolApproval = (id: string, toolName: string, value: boolean) => {
  const item: McpToolApprovalsDTO = {
    toolName: toolName,
    serviceId: id
  };
  if (value) {
    return API.McpServices.enableToolsBatch([item]);
  } else {
    return API.McpServices.disableToolsBatch([item]);
  }
};

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

//   'mcpServiceDialog.codeImport.toggle': '从代码导入',
//   'mcpServiceDialog.codeImport.hint': '粘贴标准 mcpServers JSON 配置，自动填充表单',
//   'mcpServiceDialog.codeImport.editOverwriteHint': '导入会覆盖当前表单内容（不影响已保存的凭证，需点保存生效）',
//   'mcpServiceDialog.codeImport.parse': '解析并填充',
//   'mcpServiceDialog.codeImport.errors.empty': '请先粘贴配置内容',
//   'mcpServiceDialog.codeImport.errors.invalidJson': '无法解析，请检查 JSON 格式'
// };
// const t = function (key: string, params?: Record<string, string> | string) {
//   let msg = pageLangConfig[key] || key;
//   if (params) {
//     if (typeof params == 'string') {
//       msg = pageLangConfig[key] || params;
//     } else {
//       Object.keys(params).forEach((key) => {
//         msg = msg.replace(`{${key}}`, params[key]);
//       });
//     }
//   }
//   return msg;
// };
// const $t = t;

const expandedToolIndex = ref<number | null>(null);
const { t } = useI18n();
interface DisplayTool extends McpToolVO {
  name: string;
  requireApproval: boolean;
}

const displayTools = ref<DisplayTool[]>([]);
const approvalLoading = ref<Record<string, boolean>>({});
let approvalRequestId = 0;

const mergeApprovals = () => {
  const requestId = ++approvalRequestId;
  const tools: DisplayTool[] = (props.result?.tools ?? []).map((tool) => ({
    ...tool,
    name: tool.name ?? '',
    requireApproval: false
  }));
  if (!tools.length) {
    displayTools.value = [];
    return;
  }
  if (!props.serviceId) {
    displayTools.value = tools.map((x) => ({ ...x }));
    return;
  }
  return getMCPToolApprovals(props.serviceId)
    .then((rows) => {
      if (requestId !== approvalRequestId) return;
      const map = new Map(rows.map((row) => [row.toolName, row.requireApproval]));
      displayTools.value = tools.map((tool) => ({
        ...tool,
        requireApproval: map.get(tool.name) ?? false
      }));
    })
    .catch(() => {
      if (requestId !== approvalRequestId) return;
      displayTools.value = tools;
    });
};

watch(
  () => [props.active, props.serviceId, props.result?.tools],
  () => {
    if (props.active) {
      void mergeApprovals();
    }
  },
  { deep: true, immediate: true }
);

const onRequireApprovalChange = (toolName: string, value: boolean) => {
  if (!props.serviceId || !toolName) return;
  const serviceId = props.serviceId;
  approvalLoading.value = { ...approvalLoading.value, [toolName]: true };
  return setMCPToolApproval(serviceId, toolName, value)
    .then(() => {
      if (props.serviceId !== serviceId) return;
      displayTools.value = displayTools.value.map((tool) => (tool.name === toolName ? { ...tool, requireApproval: value } : tool));
    })
    .catch((error) => {
      console.error(error);
      if (props.serviceId === serviceId) {
        displayTools.value = displayTools.value.map((tool) => (tool.name === toolName ? { ...tool, requireApproval: !value } : tool));
      }
      modal.msgError(t('page.mcp.testResult.approvalSaveFailed'));
    })
    .finally(() => {
      approvalLoading.value = { ...approvalLoading.value, [toolName]: false };
    });
};

const toggleTool = (index: number) => {
  expandedToolIndex.value = expandedToolIndex.value === index ? null : index;
};

const formatSchema = (schema?: string): string => {
  if (!schema?.trim()) return '';
  try {
    return JSON.stringify(JSON.parse(schema), null, 2);
  } catch {
    return schema;
  }
};
</script>

<style scoped lang="less">
.mtr {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 状态条 */
.mtr-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 10px;

  &.is-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9, var(--el-bg-color-page));
  }

  &.is-error {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9, var(--el-bg-color-page));
  }

  :deep(.t-icon) {
    font-size: 18px;
  }
}

.mtr-message {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  word-break: break-word;
}

.mtr-service-desc {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);

  span {
    display: block;
    margin-bottom: 4px;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.6;
    word-break: break-word;
  }
}

/* 分组 */
.mtr-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mtr-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

/* 列表：扁平卡片，靠分隔与圆角，无重阴影，贴合抽屉 */
.mtr-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.mtr-item {
  padding: 12px 14px;
  background: var(--el-bg-color-container);

  & + .mtr-item {
    border-top: 1px solid var(--el-border-color);
  }

  &.is-open {
    background: var(--el-fill-color-light);
  }
}

.mtr-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  &.is-static {
    cursor: default;
  }
}

.mtr-item-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--el-color-primary);
}

.mtr-item-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mtr-item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.mtr-approval {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .mtr-approval-icon {
    font-size: 15px;
    color: var(--el-color-warning);
  }

  .mtr-approval-label {
    white-space: nowrap;
  }
}

.mtr-chevron {
  font-size: 16px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

/* 描述：独占整行，绝不与右侧开关挤在一起 */
.mtr-item-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  line-height: 1.6;
  word-break: break-word;

  &.is-clamped {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.mtr-item-schema {
  margin-top: 10px;

  .mtr-schema-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  pre {
    margin: 0;
    padding: 10px 12px;
    border-radius: 6px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    overflow-x: auto;
    font-size: 12px;
    // font-family: var(--app-font-family-mono);
    color: var(--el-text-color-primary);
    line-height: 1.6;
  }
}

.mtr-item-uri {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.mtr-empty {
  padding: 24px 0;
}
</style>
