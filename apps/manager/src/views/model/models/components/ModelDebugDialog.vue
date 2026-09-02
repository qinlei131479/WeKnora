<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import KJSCDialogV2 from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import { API } from '@/api';
import type { ModelDebugDTO, ModelDebugVO, ModelsVO } from '@/types/api/model/model';
import { modelTypeLabelKey } from '../constants';

const { proxy } = getCurrentInstance() as any;
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  model?: ModelsVO | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const running = ref(false);
const result = ref<ModelDebugVO | null>(null);

const form = reactive({
  input: '',
  systemPrompt: '',
  documentsText: '',
  temperature: 0.7,
  topP: 1,
  maxTokens: 512,
  thinking: false
});

const modelType = computed(() => props.model?.type ?? '');
const isChat = computed(() => modelType.value === 'KnowledgeQA');
const isRerank = computed(() => modelType.value === 'Rerank');

/**
 * 后端 debugVLLM / debugASR 强校验文件不能为空，但 debug 接口把
 * @RequestBody 和 @RequestParam MultipartFile 混用，Spring 无法同时绑定，
 * 前端没有办法把文件传进去。等后端改成 @RequestPart 再放开。
 */
const needsFile = computed(() => modelType.value === 'VLLM' || modelType.value === 'ASR');

const typeLabel = computed(() => {
  const key = modelTypeLabelKey(modelType.value);
  return key ? t(key) : modelType.value || '-';
});

const documents = computed(() =>
  form.documentsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
);

/** input 是后端必填项 */
const canRun = computed(() => !!props.model?.id && !!form.input.trim() && !needsFile.value);

const resetState = () => {
  form.input = '';
  form.systemPrompt = '';
  form.documentsText = '';
  form.temperature = 0.7;
  form.topP = 1;
  form.maxTokens = 512;
  form.thinking = false;
  result.value = null;
};

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) resetState();
  }
);

const stringify = (value: unknown) => {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const handleRun = () => {
  if (!props.model?.id) return;

  running.value = true;
  result.value = null;

  const payload: ModelDebugDTO = {
    modelId: props.model.id,
    input: form.input.trim()
  };

  if (isChat.value) {
    if (form.systemPrompt.trim()) payload.systemPrompt = form.systemPrompt.trim();
    payload.temperature = form.temperature;
    payload.topP = form.topP;
    payload.maxTokens = form.maxTokens;
    payload.thinking = form.thinking;
  }

  if (isRerank.value && documents.value.length > 0) {
    payload.documents = documents.value;
  }

  API.Models.debug(payload)
    .then((res) => {
      // 后端即使调用失败也返回 code=200，错误信息在 data.error 里
      result.value = res.data ?? { error: t('page.models.debug.emptyResult', '未返回调试结果') };
    })
    .catch((error) => {
      console.error('[Models] debug failed:', error);
      result.value = { error: t('page.models.debug.requestFail', '请求失败，请检查网络或后端服务') };
    })
    .finally(() => {
      running.value = false;
    });
};

const handleCopy = async () => {
  if (!result.value) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(result.value, null, 2));
    proxy?.$modal?.msgSuccess(t('page.normal.copySuccess', '复制成功'));
  } catch {
    proxy?.$modal?.msgError(t('page.normal.copyFailed', '复制失败'));
  }
};
</script>

<template>
  <KJSCDialogV2
    v-model="dialogVisible"
    :title="$t('page.models.debug.title', '模型调试')"
    width="760px"
    append-to-body
    custom-class="model-debug-dialog"
    :show-close-btn="false"
    :show-subit-btn="false"
  >
    <div class="debug-body">
      <div class="debug-model">
        <span class="debug-model__name">{{ props.model?.displayName || props.model?.name || '-' }}</span>
        <el-tag size="small" type="info">{{ typeLabel }}</el-tag>
      </div>

      <el-alert
        v-if="needsFile"
        class="debug-alert"
        type="warning"
        show-icon
        :closable="false"
        :title="$t('page.models.debug.fileUnsupported', '该类型模型调试需要上传文件，当前后端调试接口暂不支持，请先用「测试连接」验证连通性')"
      />

      <el-form :model="form" label-position="top">
        <el-form-item :label="$t('page.models.debug.input', '输入内容')">
          <el-input
            v-model="form.input"
            type="textarea"
            :rows="4"
            :placeholder="$t('page.models.debug.inputPlaceholder', '请输入用于调试的文本')"
          />
        </el-form-item>

        <el-form-item v-if="isRerank" :label="$t('page.models.debug.documents', '候选文档')">
          <el-input
            v-model="form.documentsText"
            type="textarea"
            :rows="4"
            :placeholder="$t('page.models.debug.documentsPlaceholder', '每行一条文档，用于重排序打分')"
          />
        </el-form-item>

        <template v-if="isChat">
          <el-form-item :label="$t('page.models.debug.systemPrompt', '系统提示词')">
            <el-input
              v-model="form.systemPrompt"
              type="textarea"
              :rows="2"
              :placeholder="$t('page.models.debug.systemPromptPlaceholder', '可选')"
            />
          </el-form-item>

          <div class="param-grid">
            <el-form-item label="Temperature">
              <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" controls-position="right" />
            </el-form-item>
            <el-form-item label="Top P">
              <el-input-number v-model="form.topP" :min="0" :max="1" :step="0.1" controls-position="right" />
            </el-form-item>
            <el-form-item label="Max Tokens">
              <el-input-number v-model="form.maxTokens" :min="1" :max="8192" :step="128" controls-position="right" />
            </el-form-item>
          </div>

          <el-form-item :label="$t('page.models.debug.thinking', '思考模式')">
            <el-switch v-model="form.thinking" />
          </el-form-item>
        </template>
      </el-form>

      <template v-if="result">
        <h4 class="section-title">{{ $t('page.models.debug.resultTitle', '调试结果') }}</h4>

        <div class="result-meta">
          <el-tag :type="result.error ? 'danger' : 'success'">
            {{ result.error ? $t('page.models.debug.failed', '调用失败') : $t('page.models.debug.succeeded', '调用成功') }}
          </el-tag>
          <span v-if="result.elapsedMs !== undefined" class="form-desc form-desc--inline">
            {{ $t('page.models.debug.elapsed', '耗时') }}: {{ result.elapsedMs }} ms
          </span>
        </div>

        <div v-if="result.error" class="result-block result-block--error">{{ result.error }}</div>

        <div v-if="result.response !== undefined && result.response !== null" class="result-section">
          <span class="result-section__label">{{ $t('page.models.debug.response', '响应内容') }}</span>
          <pre class="result-block">{{ stringify(result.response) }}</pre>
        </div>

        <div v-if="result.observations && Object.keys(result.observations).length" class="result-section">
          <span class="result-section__label">{{ $t('page.models.debug.observations', '观察指标') }}</span>
          <pre class="result-block">{{ stringify(result.observations) }}</pre>
        </div>

        <div v-if="result.requestPreview && Object.keys(result.requestPreview).length" class="result-section">
          <span class="result-section__label">{{ $t('page.models.debug.requestPreview', '请求预览') }}</span>
          <pre class="result-block">{{ stringify(result.requestPreview) }}</pre>
        </div>
      </template>
    </div>

    <template #prefixFooter>
      <div class="dialog-footer">
        <el-button v-if="result" @click="handleCopy">{{ $t('page.models.debug.copy', '复制结果') }}</el-button>
        <el-button @click="dialogVisible = false">{{ $t('page.normal.close', '关闭') }}</el-button>
        <el-button type="primary" :loading="running" :disabled="!canRun" @click="handleRun">
          {{ $t('page.models.debug.run', '开始调试') }}
        </el-button>
      </div>
    </template>
  </KJSCDialogV2>
</template>

<style lang="scss" scoped>
.debug-body {
  max-height: 62vh;
  overflow-y: auto;
}

.debug-model {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: #2b2f33;
  }
}

.section-title {
  margin: 20px 0 12px;
  padding-top: 16px;
  border-top: 1px solid #ececec;
  font-size: 14px;
  font-weight: 600;
  color: #2b2f33;
}

.param-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.debug-alert {
  margin-bottom: 16px;
}

.form-desc {
  display: block;
  width: 100%;
  color: #77838f;
  font-size: 12px;
  line-height: 18px;

  &--inline {
    display: inline;
    width: auto;
  }
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.result-section {
  margin-bottom: 12px;

  &__label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #2b2f33;
  }
}

.result-block {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  background-color: #f5f7fa;
  color: #2b2f33;
  font-size: 12px;
  line-height: 20px;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;

  &--error {
    background-color: #fef0f0;
    color: #c45656;
  }
}

.dialog-footer {
  display: inline-flex;
  gap: 16px;
}
</style>
