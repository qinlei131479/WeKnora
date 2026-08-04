<template>
  <el-card shadow="never" class="form-panel">
    <template #header>
      <div class="panel-title">基本信息</div>
    </template>

    <div class="form-grid">
      <el-form-item label="工具类型" prop="toolType" required>
        <el-select v-model="tool.toolType" placeholder="选择工具类型">
          <el-option v-for="option in toolTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本号" prop="version" required>
        <input-radius v-model="tool.version" maxlength="50" clearable placeholder="例如：v1.0.0" />
      </el-form-item>

      <el-form-item label="工具名称" prop="name" required>
        <input-radius v-model="tool.name" maxlength="50" clearable placeholder="例如：OA系统请假审批查询" />
      </el-form-item>
      <el-form-item label="唯一标识 ID" prop="code" required>
        <input-radius v-model="tool.code" maxlength="200" clearable placeholder="例如：oa_leave_checker" />
      </el-form-item>

      <el-form-item label="归属领域分类" prop="categoryId" required class="form-item--full-row">
        <el-cascader v-model="tool.categoryId" :options="categories" :props="categoryProps" filterable clearable placeholder="选择工具归属领域分类" />
      </el-form-item>

      <el-form-item label="简介" class="form-item--full-row">
        <input-radius
          v-model="tool.description"
          maxlength="255"
          clearable
          placeholder="告知大模型这组接口的整体业务边界：例如「这是关于OA财务报销与请假审批的系列接口集合，当用户询问报销进度或请假时可用...」"
        />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { CategoryVO, ToolVO } from '@/types';

defineProps<{
  categories: CategoryVO[];
}>();

const tool = defineModel<ToolVO>({ required: true });

const TOOL_TYPE_MCP = 1;
const toolTypeOptions: { label: string; value: ToolVO['toolType'] }[] = [
  // { label: 'API 工具', value: 0 },
  { label: 'MCP (Model Context Protocol)', value: TOOL_TYPE_MCP }
  // { label: '混合工具', value: 2 }
];

const categoryProps = {
  value: 'id',
  label: 'name',
  children: 'childrenList',
  checkStrictly: true,
  checkOnClickNode: true,
  showPrefix: false,
  emitPath: false
};
</script>

<style lang="scss" scoped>
.form-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;

  :deep(.el-select),
  :deep(.el-cascader) {
    width: 100%;
  }
}
</style>
