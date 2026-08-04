<template>
  <section class="step2-panel">
    <div class="success-title">
      <CircleCheckBig />
      <span>解析成功：复核能力包关键信息</span>
    </div>

    <div class="review-panel">
      <el-form-item label="解析名称" required>
        <input-radius v-model="model.name" readonly />
      </el-form-item>

      <el-form-item label="能力描述清单">
        <input-radius v-model="model.description" readonly />
      </el-form-item>

      <p class="field-help">
        <Info />
        <span>本字段由底层 <code>SKILL.md</code> 解析而来，用于向大语言模型介绍本能力包的作用。您可以在本地修改原文件后重新解析。</span>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CircleCheckBig, Info } from 'lucide-vue-next';

type ParsedInfo = {
  name: string;
  version: string;
  owner: string;
  description: string;
};

defineProps<{
  sourceType: 1 | 2;
  domainLabel: string;
}>();

const model = defineModel<ParsedInfo>({ required: true });
</script>

<style lang="scss" scoped>
.step2-panel {
  margin-top: 16px;
  padding: 20px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: var(--el-color-white);
}

.success-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #2b2f33;
  font-size: 14px;
  font-weight: bold;
  line-height: 20px;

  svg {
    width: 20px;
    height: 20px;
    flex: none;
    color: var(--el-color-success);
  }
}

.review-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.field-help {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: -4px 4px 0;
  color: #b0bac6;
  font-size: 12px;
  line-height: 18px;

  > svg {
    width: 12px;
    height: 12px;
    flex: none;
    margin-top: 3px;
  }

  code {
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--el-fill-color);
    color: #77838f;
    font-family: inherit;
  }
}
</style>
