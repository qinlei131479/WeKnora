<template>
  <el-card shadow="never" class="form-panel">
    <template #header>
      <div class="panel-title">基础定义</div>
    </template>

    <div class="form-grid">
      <el-form-item label="模型名称显示" prop="name" required>
        <input-radius v-model="model.name" maxlength="50" clearable placeholder="例如：DeepSeek-R1-Turbo" />
      </el-form-item>
      <el-form-item label="归属领域分类" prop="categoryId" required>
        <el-cascader
          v-model="model.categoryId"
          :options="categories"
          :props="categoryProps"
          filterable
          clearable
          placeholder="选择负责的业务系统或分类"
        />
      </el-form-item>
      <el-form-item label="提供商/厂商标识" prop="supplier" required>
        <input-radius v-model="model.supplier" maxlength="50" clearable placeholder="例如：DeepSeek / 内部自研 / Google" />
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType" required>
        <el-select v-model="model.modelType" clearable @change="handleModelTypeChange">
          <el-option v-for="option in modelTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本号" prop="version" required>
        <input-radius v-model="model.version" maxlength="50" clearable placeholder="例如：v1.0.0" />
      </el-form-item>
      <div class="thinking-options">
        <el-form-item prop="fastThinkFlag">
          <template #label>
            <span>&nbsp;</span>
          </template>
          <el-checkbox v-model="model.fastThinkFlag" label="可用于快思考" :true-value="1" :false-value="0" />
        </el-form-item>
        <el-form-item prop="slowThinkFlag">
          <template #label>
            <span>&nbsp;</span>
          </template>
          <el-checkbox v-model="model.slowThinkFlag" label="可用于慢思考" :true-value="1" :false-value="0" />
        </el-form-item>
      </div>
      <el-form-item label="简介" class="form-item--full-row">
        <input-radius v-model="model.description" maxlength="30" show-word-limit clearable placeholder="请输入" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { CategoryVO, ModelVO } from '@/types';

defineProps<{
  categories: CategoryVO[];
}>();

const model = defineModel<ModelVO>({ required: true });
const emit = defineEmits<{
  'model-type-change': [];
}>();

const modelTypeOptions: { label: string; value: ModelVO['modelType'] }[] = [
  { label: '大语言模型 (LLM)', value: 1 },
  { label: '向量模型 (Embedding)', value: 2 },
  { label: '排序模型 (Reranker)', value: 3 }
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

const handleModelTypeChange = () => {
  emit('model-type-change');
};
</script>

<style lang="less" scoped>
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

.thinking-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
