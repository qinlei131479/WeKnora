<template>
  <el-card shadow="never" class="form-panel">
    <template #header>
      <div class="panel-title">负载及能力约束</div>
    </template>

    <div class="restriction-note">
      <el-icon class="restriction-note-icon">
        <MessageCircleQuestion />
      </el-icon>
      <div class="restriction-note-content">
        <div class="restriction-note-title">LLM 负载与能力说明</div>
        <div class="restriction-note-desc">用于约束对话模型的上下文窗口、单词输出上限，以及流式传输和深度思考等专属能力。</div>
      </div>
    </div>

    <div class="restriction-form">
      <div class="form-grid">
        <el-form-item label="最大上下文窗口 (Tokens)" prop="param1" required>
          <input-number-radius v-model="maxContextWindow" :min="0" :controls="false" />
        </el-form-item>
        <el-form-item label="全局单次最大输出限制 (Tokens)" prop="param2" required>
          <input-number-radius v-model="maxOutputTokens" :min="0" :controls="false" />
        </el-form-item>
      </div>

      <el-checkbox v-model="supportDeepThinking" border class="capability-check">
        <div class="capability-content">
          <div class="capability-title">
            <span>支持深度思考/Reasoning Output</span>
            <el-tag size="small" type="primary" effect="light" round>LLM专属</el-tag>
          </div>
          <p>开启后，系统会识别并渲染模型返回的思考过程，便于调试推理链路。</p>
        </div>
      </el-checkbox>
      <el-checkbox v-model="supportStreaming" border class="capability-check">
        <div class="capability-content">
          <div class="capability-title">
            <span>模型接口原生支持流式传输/Streaming</span>
          </div>
          <p>用于对话测试和在线调用时的实时增量输出，提升首字响应速度和交互反馈。</p>
        </div>
      </el-checkbox>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ModelVO } from '@/types';
import { MessageCircleQuestion } from 'lucide-vue-next';

const model = defineModel<ModelVO>({ required: true });

const toInputNumber = (value?: string) => {
  if (value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const maxContextWindow = computed({
  get: () => toInputNumber(model.value.param1),
  set: (value?: number) => {
    model.value.param1 = value === undefined ? undefined : String(value);
  }
});

const maxOutputTokens = computed({
  get: () => toInputNumber(model.value.param2),
  set: (value?: number) => {
    model.value.param2 = value === undefined ? undefined : String(value);
  }
});

const supportDeepThinking = computed({
  get: () => model.value.deepThinkFlag === 1,
  set: (value: boolean) => {
    model.value.deepThinkFlag = value ? 1 : 0;
  }
});

const supportStreaming = computed({
  get: () => model.value.streamFlag === 1,
  set: (value: boolean) => {
    model.value.streamFlag = value ? 1 : 0;
  }
});
</script>

<style scoped lang="less">
.form-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  border: 0;
  border-radius: 24px;

  :deep(.el-card__header) {
    padding: 20px 40px;
    border: 0;
  }

  :deep(.el-card__body) {
    padding: 0 60px 32px 60px;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: left;
  }
}

.panel-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
}

.panel-subtitle {
  padding-top: 8px;
  color: #b0bac6;
  font-size: 12px;
  font-weight: 400;
}

.restriction-note {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 18px;
  padding: 8px 16px;
  border: 1px solid var(--el-color-info-light-7);
  border-radius: var(--radius-lg);
  background: var(--el-color-info-light-9);
}

.note-icon {
  flex: none;
  margin-top: 8px;
  color: var(--el-color-primary);
  font-size: 24px;
}

.note-content {
  min-width: 0;
  padding: 8px 0;
}

.note-title {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 18px;
}

.note-desc {
  margin-top: 2px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
}

.restriction-form {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  flex-direction: column;
  gap: 14px;
}

.capability-check {
  height: auto;
  margin-right: 0;
  padding: 12px 14px;
  border: 1px solid #e1e6ec;
  border-radius: 8px;
  background: rgba(235, 243, 245, 0.6);

  :deep(.el-checkbox__input) {
    transform: translateY(-11px);
  }

  :deep(.el-checkbox__label) {
    min-width: 0;
    white-space: normal;
  }
}

.capability-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.capability-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-weight: 600;

  > span:first-child {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
  }
}

.capability-content p {
  margin: 0;
  color: #77838f;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .restriction-note {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}

.restriction-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 18px;
  padding: 12px 16px;
  border: 1px solid #e1e6ec;
  border-radius: 8px;
  background: rgba(235, 243, 245, 0.6);

  &--two-columns {
    grid-column: span 2;
    padding-top: 22px;
  }

  &-icon {
    flex: none;
    color: var(--el-color-primary);
    font-size: 24px;
    margin-top: 6px;
  }

  &-content {
    padding-top: 8px;
  }

  &-title {
    color: #2b2f33;
    font-size: 14px;
    font-weight: bold;
  }

  &-desc {
    margin-top: 8px;
    color: #77838f;
    font-size: 12px;
  }
}
</style>
