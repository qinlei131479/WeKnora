<template>
  <el-card shadow="never" class="form-panel recommend-panel" :class="{ 'is-result': showResult }">
    <template v-if="showResult" #header>
      <div class="panel-header result-header">
        <div class="panel-title result-title">
          原子动作 (Actions) 自动拆解结果
          <el-icon>
            <Info />
          </el-icon>
        </div>
        <el-tag v-if="actions.length" class="success-tag" type="success" effect="light" round>
          <el-icon>
            <Check />
          </el-icon>
          成功提炼 {{ actions.length }} 个子动作
        </el-tag>
      </div>
    </template>

    <div v-if="!showResult" class="recommend-inner">
      <div class="recommend-icon">
        <el-icon>
          <Zap />
        </el-icon>
      </div>

      <h2>强烈建议：能力自动拆解与提示词精调</h2>
      <p>
        智能体（Agent）能否准确调用该工具，
        <strong>完全取决于提示词的精准度。</strong>
      </p>
      <p>
        系统将把您的业务 API 配置拆解为多个独立的细粒度原子动作（Actions），并由后台模型尝试为您自动提取润色提示词。
        建议您预先检查，并在必要时补充人工规则约束。
      </p>

      <el-button type="primary" class="recommend-action" :loading="checking" @click="handleCheck">
        <el-icon v-if="!checking">
          <Zap />
        </el-icon>
        预检并手动精调提示词
      </el-button>

      <div class="skip-line">
        或
        <el-button text class="skip-action" @click="handleSkip">跳过预检，直接后台异步抽取并发布</el-button>
      </div>
    </div>

    <div v-else class="action-result">
      <div v-if="actions.length" class="action-list">
        <div v-for="action in actions" :key="action.name" class="action-card">
          <div class="action-main">
            <strong>{{ action.name }}</strong>
          </div>
          <div class="prompt-label">专属提示词配置（大模型阅读此段文字理解能力）：</div>
          <div class="action-description">{{ action.description }}</div>
        </div>
      </div>
      <div v-else class="skip-result">已跳过预检，系统将在发布后进行后台异步抽取。</div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Check, Info, Zap } from 'lucide-vue-next';
import type { ProxyDTO, ToolVO } from '@/types';
import { ElMessage } from 'element-plus';
import { agiProxy } from '@/api/proxy/proxy';

const emit = defineEmits<{
  checked: [count: number];
  skipped: [];
}>();
const props = defineProps<{
  tool: ToolVO;
}>();

const checking = ref(false);
const showResult = ref(false);
const actions = ref<any[]>([]);

const handleCheck = () => {
  if (!props.tool.baseUrl) {
    ElMessage.warning('请填写 MCP 端点地址');
    return;
  }
  if (!props.tool.baseUrl.startsWith('http://') && !props.tool.baseUrl.startsWith('https://')) {
    ElMessage.warning('MCP 端点地址必须以 http:// 或 https:// 开头');
    return;
  }

  const dto: ProxyDTO = {
    url: `${import.meta.env.VITE_APP_PY_SERVER}/mcp/tool/list`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ server_url: props.tool.baseUrl })
  };
  checking.value = true;
  agiProxy
    .requestNonStream(dto)
    .then((res) => {
      if (res.code !== 200) {
        return Promise.reject(res.msg);
      }
      if (res.data && res.data.length) {
        actions.value = res.data;
        showResult.value = true;
        emit('checked', actions.value.length);
      }
    })
    .catch((err) => {
      console.error('--> --> 预检失败', err);
      ElMessage.closeAll();
      ElMessage.warning('预检失败，请检查 MCP 端点地址');
    })
    .finally(() => {
      checking.value = false;
    });
};

const handleSkip = () => {
  actions.value = [];
  showResult.value = true;
  emit('skipped');
};
</script>

<style lang="less" scoped>
.recommend-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  overflow: hidden;
  border: 2px dashed var(--el-color-primary-light-5);
  border-radius: 24px;
  // background: var(--el-color-primary-light-9);
  background: var(--color-white);

  &.is-result {
    // border-style: solid;
    border-width: 0px;
  }

  .recommend-inner {
    display: flex;
    min-height: 300px;
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    text-align: center;
  }

  .recommend-icon {
    display: inline-flex;
    width: 56px;
    height: 56px;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    border-radius: 50%;
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    font-size: 28px;
  }

  h2 {
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
  }

  p {
    max-width: 640px;
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 24px;

    strong {
      color: var(--el-color-danger);
      font-weight: 700;
    }
  }

  .recommend-action {
    height: 40px;
    margin-top: 24px;
    padding: 0 32px;
    font-weight: 700;
    border-radius: 6px;

    :deep(span) {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  }

  .skip-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 20px;
  }

  .skip-action {
    height: auto;
    padding: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-decoration: underline;

    &:hover,
    &:focus {
      color: var(--el-color-primary);
    }
  }
}

.result {
  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &-title {
    display: inline-flex;
    align-items: center;
    gap: 16px;

    .el-icon {
      color: var(--el-text-color-secondary);
    }
  }
}

.success-tag {
  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.action-result {
  padding: 0;
  .action-list {
    display: flex;
    flex-direction: column;
  }

  .action-card {
    padding: 20px 16px;
    border-top: 1px solid var(--el-border-color);
    // background: var(--color-white);
  }

  .action-main {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    strong {
      color: #2b2f33;
    }

    code {
      flex: none;
      color: var(--el-text-color-secondary);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 12px;
    }
  }

  .prompt-label {
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .action-description,
  .skip-result {
    box-sizing: border-box;
    width: 100%;
    padding: 8px 11px;
    border-radius: 12px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }

  .action-description {
    background: var(--el-fill-color-lighter);
  }

  .skip-result {
    min-height: 80px;
    margin: 0;
    padding: 24px 18px;
    color: var(--el-text-color-secondary);
    box-shadow: none;
  }
}

@media (max-width: 768px) {
  .recommend-panel {
    .recommend-inner {
      min-height: 260px;
      padding: 32px 16px;
    }

    h2 {
      font-size: 18px;
    }

    .recommend-action {
      width: 100%;
      max-width: 320px;
      padding: 0 16px;
    }
  }

  .result-header,
  .action-result .action-main {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
