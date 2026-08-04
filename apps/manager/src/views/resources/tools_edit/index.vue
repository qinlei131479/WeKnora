<template>
  <my-page class="tool-edit-my-page">
    <div class="page-header">
      <div class="header-title">
        <el-button :icon="ArrowLeft" text circle @click="handleCancel" />
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>将企业现有的业务系统、外部协议或者私有组件导入至平台中供智能体调用</p>
        </div>
      </div>

      <div class="header-actions">
        <btn @click="handleCancel">取消</btn>
        <btn type="primary" :icon="Save" :loading="saving" :disabled="!canSave" @click="handleSave">保存并发布</btn>
      </div>
    </div>

    <el-form ref="formRef" :model="tool" :rules="rules" :validate-on-rule-change="false" label-position="top" class="tool-edit-page">
      <BaseInfo v-model="tool" :categories="categories" />

      <MCPProfile v-if="tool.toolType === TOOL_TYPE_MCP" v-model="tool" @mcp-json-blur="handleMcpJsonBlur" />

      <Recommend v-if="tool.mcpType !== 1" :tool="tool" @checked="handleRecommendChecked" @skipped="handleRecommendSkipped" />
    </el-form>
  </my-page>
</template>

<script setup lang="ts">
import { agiTool } from '@/api/resources/tool';
import { agiCategory } from '@/api/settings/category';
import { ArrowLeft, Save } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import { JsonFormater } from '@/utils/jsonformater';
import type { FormInstance as ElFormInstance } from 'element-plus/es/components/form';
import type { FormRules as ElFormRules } from 'element-plus/es/components/form/src/types';
import type { CategoryVO, ToolDTO, ToolVO } from '@/types';
import BaseInfo from './components/BaseInfo.vue';
import MCPProfile from './components/MCPProfile.vue';
import Recommend from './components/Recommend.vue';

const router = useRouter();
const route = useRoute();
const stateTool = (history.state?.tool || {}) as ToolVO;
const tool = ref<ToolVO>({ ...stateTool });
const formRef = ref<ElFormInstance>();
const categories = ref<CategoryVO[]>([]);
const saving = ref(false);
const precheckPassed = ref(false);
const isEdit = computed(() => Boolean(tool.value.id));
const canSave = computed(() => tool.value.mcpType === 1 || precheckPassed.value);
const pageTitle = computed(() => (isEdit.value ? '编辑工具包' : '注册新建工具包 (Tool / 包含多个 Actions)'));

const TOOL_TYPE_MCP = 1;

const validateBaseUrl = (_rule: unknown, value: string | undefined, callback: (error?: Error) => void) => {
  if (tool.value.mcpType === 2 && !value?.trim()) {
    callback(new Error('请填写 MCP 端点地址'));
    return;
  }
  callback();
};

const validateMcpJson = (_rule: unknown, value: string | undefined, callback: (error?: Error) => void) => {
  if (tool.value.mcpType !== 1) {
    callback();
    return;
  }

  if (!value?.trim()) {
    callback(new Error('请填写 MCP 本地服务 JSON 配置'));
    return;
  }

  const result = JsonFormater.parse(value);
  const config = result.data;
  if (!result.valid) {
    callback(new Error('请输入正确的 JSON 格式'));
    return;
  }

  if (!config || typeof config !== 'object' || Array.isArray(config) || !('command' in config) || !('args' in config)) {
    callback(new Error('JSON 配置必须包含 command、args 两个参数'));
    return;
  }

  callback();
};

const rules = computed<ElFormRules<ToolVO>>(() => ({
  toolType: [{ required: true, message: '请选择工具类型', trigger: 'submit' }],
  name: [{ required: true, message: '请填写工具名称', trigger: 'submit' }],
  code: [{ required: true, message: '请填写唯一标识ID', trigger: 'submit' }],
  categoryId: [{ required: true, message: '请选择归属领域分类', trigger: 'submit' }],
  version: [{ required: true, message: '请填写版本号', trigger: 'submit' }],
  baseUrl: [{ validator: validateBaseUrl, trigger: 'submit' }],
  mcpType: [{ required: true, message: '请选择 MCP 连接模式', trigger: 'submit' }],
  mcpJson:
    tool.value.mcpType === 1 ? [{ validator: validateMcpJson, trigger: ['blur', 'submit'] }] : [{ validator: validateMcpJson, trigger: 'submit' }]
}));

const apiCategoryTree = () => {
  agiCategory
    .tree()
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      categories.value = res.data || [];
    })
    .catch((err) => {
      console.error('--> --> 获取工具分类失败', err);
      ElMessage.closeAll();
      ElMessage.warning('获取工具分类失败');
    });
};

const handleCancel = () => {
  router.back();
};

const handleMcpJsonBlur = () => {
  if (tool.value.mcpType !== 1 || !tool.value.mcpJson?.trim()) return;
  const result = JsonFormater.format(tool.value.mcpJson);
  if (result.valid && result.data) {
    tool.value.mcpJson = result.data;
  }
};

const handleRecommendChecked = () => {
  precheckPassed.value = true;
};

const handleRecommendSkipped = () => {
  precheckPassed.value = true;
  ElMessage.success('已跳过预检');
};

watch(
  () => tool.value.mcpType,
  (mcpType: any, oldMcpType: any) => {
    if (mcpType === oldMcpType) return;
    precheckPassed.value = false;
    formRef.value?.clearValidate(['baseUrl', 'mcpJson']);
  }
);

const handleSave = async () => {
  if (!canSave.value) return;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('校验未通过，请检查');
    return;
  }
  if (saving.value) return;

  const minifiedMcpJson = tool.value.mcpType === 1 ? JsonFormater.minify(tool.value.mcpJson || '').data || undefined : undefined;

  const data: ToolDTO = {
    id: tool.value.id,
    toolType: tool.value.toolType,
    name: tool.value.name?.trim(),
    code: tool.value.code?.trim(),
    categoryId: tool.value.categoryId,
    description: tool.value.description?.trim(),
    version: tool.value.version?.trim(),
    mcpType: tool.value.mcpType,
    baseUrl: tool.value.mcpType === 2 ? tool.value.baseUrl?.trim() : undefined,
    mcpJson: minifiedMcpJson,
    mcpTimeOut: tool.value.mcpTimeOut,
    mcpRetry: tool.value.mcpRetry,
    mcpToolFlag: tool.value.mcpToolFlag,
    mcpResourcesFlag: tool.value.mcpResourcesFlag,
    mcpPromptsFlag: tool.value.mcpPromptsFlag,
    apiEntryMethod: tool.value.apiEntryMethod,
    apiEntryInfo: tool.value.apiEntryInfo?.trim(),
    apiAuthMethod: tool.value.apiAuthMethod,
    apiAuthParam: tool.value.apiAuthParam,
    status: isEdit.value ? (tool.value.status ?? 0) : 2
  };

  if (!isEdit.value) {
    delete data.id;
  }

  saving.value = true;
  const saveRequest = isEdit.value ? agiTool.update : agiTool.insert;
  saveRequest(data)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      ElMessage.success(isEdit.value ? '工具变更已保存' : '工具配置已保存');
      router.push('/resources/tools');
    })
    .catch((err) => {
      console.error('--> --> 保存工具配置失败', err);
      // ElMessage.closeAll();
      // ElMessage.warning(`保存工具配置失败：${err}`);
    })
    .finally(() => {
      saving.value = false;
    });
};

onMounted(() => {
  if (route.path.includes('/edit') && !stateTool.id) {
    ElMessage.warning('编辑数据已失效，请从工具列表重新进入');
    router.push('/resources/tools');
    return;
  }
  tool.value.toolType = tool.value.toolType ?? TOOL_TYPE_MCP;
  tool.value.mcpType = tool.value.mcpType ?? 2;
  tool.value.apiEntryMethod = tool.value.apiEntryMethod ?? 1;
  tool.value.apiAuthMethod = tool.value.apiAuthMethod ?? 0;
  tool.value.status = tool.value.status ?? (isEdit.value ? 0 : 2);
  if (tool.value.mcpType === 1 && tool.value.mcpJson?.trim()) {
    const result = JsonFormater.format(tool.value.mcpJson);
    if (result.valid && result.data) {
      tool.value.mcpJson = result.data;
    }
  }
  apiCategoryTree();
});
</script>

<style lang="scss" scoped>
:deep(.el-card__header) {
  padding: 20px 40px !important;
  border-width: 0 !important;
}

:deep(.el-card__body) {
  padding: 0 60px 32px !important;
}

:deep(.el-card__header .panel-title) {
  color: #2b2f33;
  font-size: 16px;
  font-weight: bold;
}

div.my-page.tool-edit-my-page {
  height: auto;
  min-height: 100%;

  & > :deep(.my-page-content) {
    height: auto;
    overflow: visible;
  }
}

.page {
  &-header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
  }
}

.header {
  &-title {
    display: flex;
    align-items: center;
    gap: 20px;

    :deep(.el-button) {
      width: 36px;
      height: 36px;
      padding: 0;
    }

    :deep(.el-button .el-icon) {
      font-size: 24px;
    }

    h1 {
      margin: 0;
      color: #2b2f33;
      font-size: 20px;
      font-weight: bold;
    }

    p {
      margin-top: 8px;
      color: #77838f;
      font-size: 14px;
    }
  }

  &-actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;

    :deep(.el-button span) {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
}

.tool-edit-page {
  display: flex;
  width: 100%;
  min-width: 860px;
  max-width: 1420px;
  margin: 0 auto;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item__label) {
    color: #77838f;
    font-size: 14px;
    font-weight: 400;
  }

  :deep(.form-item--full-row) {
    grid-column: 1 / -1;
  }

  :deep(.form-grid) {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 20px;
  }
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .tool-edit-page {
    :deep(.form-grid) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
