<template>
  <el-card shadow="never" class="form-panel step1-panel">
    <template #header>
      <div class="panel-title">指定归属领域分类</div>
    </template>

    <div class="form-grid">
      <div class="category-field">
        <el-form-item label="归属领域分类" prop="categoryId" required>
          <el-cascader v-model="model.categoryId" :options="categories" :props="categoryProps" filterable clearable placeholder="选择归属领域分类" />
        </el-form-item>
        <p class="field-help">
          <CircleHelp />
          <span>选择该 Agent Skill 包的管控类别，分别决定该 Skill 包在资产中心及大模型微调、挂载时的可用管控范围与隔离策略。</span>
        </p>
      </div>

      <el-form-item label="维护者" prop="owner" required>
        <input-radius v-model="model.owner" maxlength="50" clearable placeholder="System" />
      </el-form-item>

      <el-form-item label="版本号" prop="version" required>
        <input-radius v-model="model.version" maxlength="50" clearable placeholder="v1.0.0" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next';
import type { CategoryVO } from '@/types';

type SkillImportForm = {
  categoryId?: number;
  owner: string;
  version: string;
  name: string;
  description: string;
  uuid: string;
};

defineProps<{
  categories: CategoryVO[];
}>();

const model = defineModel<SkillImportForm>({ required: true });

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
.step1-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;

  .form-grid {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-cascader) {
    width: 100%;
  }
}

.category-field {
  min-width: 0;
}

.field-help {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 4px 0;
  color: #b0bac6;
  font-size: 12px;
  line-height: 18px;

  svg {
    width: 12px;
    height: 12px;
    flex: none;
    margin-top: 3px;
  }
}

@media (max-width: 900px) {
  .step1-panel {
    .form-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
}
</style>
