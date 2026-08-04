<template>
  <el-card shadow="never" class="form-panel">
    <template #header>
      <div class="panel-header">
        <div class="panel-title">MCP (Model Context Protocol) 服务配置</div>
        <!-- <el-tag type="primary" effect="light" round>100% 托管兼容</el-tag> -->
      </div>
    </template>

    <div class="form-grid">
      <el-form-item label="连接模式 (Transport)" prop="mcpType" required>
        <el-select v-model="tool.mcpType" placeholder="选择连接模式">
          <el-option label="Streamable_http (流式 HTTP)" :value="2" />
          <el-option label="Stdio (标准方式)" :value="1" />
        </el-select>
      </el-form-item>

      <div class="section-title form-item--full-row">连接与会话参数 (Transport Params)</div>

      <el-form-item v-if="tool.mcpType === 2" label="MCP 端点地址 (SSE URL 或者标准 HTTP)" prop="baseUrl" required class="form-item--full-row">
        <input-radius v-model="tool.baseUrl" maxlength="255" placeholder="例如：http://localhost:8080/mcp/sse" />
      </el-form-item>
      <el-form-item v-if="tool.mcpType === 1" label="MCP 本地服务 JSON 配置" prop="mcpJson" required class="form-item--full-row">
        <el-input
          v-model="tool.mcpJson"
          type="textarea"
          :rows="5"
          :placeholder="`例如：
{
    &quot;command&quot;: &quot;npx&quot;,
    &quot;args&quot;: [&quot;-y&quot;, &quot;@modelcontextprotocol/server-demo&quot;]
}`"
          @blur="emit('mcpJsonBlur')"
        />
      </el-form-item>

      <el-form-item label="重试次数">
        <input-number-radius v-model="tool.mcpRetry" :min="0" :controls="false" placeholder="默认 3次重试" />
      </el-form-item>
      <el-form-item label="超时设置">
        <input-number-radius v-model="tool.mcpTimeOut" :min="0" :controls="false" placeholder="默认 30s超时" />
      </el-form-item>
      <el-form-item label="安全与能力管控 (Capabilities)">
        <el-checkbox-group v-model="mcpAbilities">
          <el-checkbox label="tools">允许该 MCP 节点返回注册扩展 Tools (Tools Capability)</el-checkbox>
          <el-checkbox label="resources">允许读取该 MCP 节点提供的上下文 (Resources Capability)</el-checkbox>
          <el-checkbox label="prompts">允许执行动态 Prompts (Prompts Capability)</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ToolVO } from '@/types';

const tool = defineModel<ToolVO>({ required: true });
const emit = defineEmits<{
  mcpJsonBlur: [];
}>();

const mcpAbilities = computed({
  get: () => {
    const values: string[] = [];
    if (tool.value.mcpToolFlag === 1) values.push('tools');
    if (tool.value.mcpResourcesFlag === 1) values.push('resources');
    if (tool.value.mcpPromptsFlag === 1) values.push('prompts');
    return values;
  },
  set: (values: string[]) => {
    tool.value.mcpToolFlag = values.includes('tools') ? 1 : 0;
    tool.value.mcpResourcesFlag = values.includes('resources') ? 1 : 0;
    tool.value.mcpPromptsFlag = values.includes('prompts') ? 1 : 0;
  }
});
</script>

<style lang="scss" scoped>
.form-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;

  :deep(.el-select),
  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: left;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  margin: 8px 0 18px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}
</style>
