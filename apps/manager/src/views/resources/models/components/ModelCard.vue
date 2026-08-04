<template>
  <el-card shadow="hover" class="model-card">
    <div class="card-header">
      <div class="tag-line">
        <el-tag :type="typeMeta[model.modelType || 1].type" effect="light" round>
          {{ typeMeta[model.modelType || 1].label }}
        </el-tag>
        <el-tag type="info" effect="plain" round>{{ categoryLabel }}</el-tag>
        <el-tag :type="statusMeta[model.status ?? 0].type" effect="light" round>
          {{ statusMeta[model.status ?? 0].label }}
        </el-tag>
      </div>

      <el-dropdown trigger="click" popper-class="model-card-dropdown" @command="handleCommand">
        <el-button circle text><svg-icon icon-class="more-up" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit" :disabled="model.status !== 2"> 编辑 </el-dropdown-item>
            <el-dropdown-item :command="model.status === 1 ? 'offline' : 'online'">
              {{ model.status === 1 ? '下线' : '上线' }}
            </el-dropdown-item>
            <el-dropdown-item command="delete" class="delete" :disabled="model.status !== 2"> 删除 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="model-main">
      <div class="model-name text-ellipsis" v-html="getHighlightedText(model.name)"></div>
      <p class="description-text" :title="model.description || ''">{{ model.description || '' }}</p>
    </div>

    <div class="model-meta">
      <div class="model-meta-item model-meta-item--full">
        <span class="model-meta-label">厂家：</span
        ><strong class="model-meta-value" :title="model.supplier || ''" v-html="getHighlightedText(model.supplier)"></strong>
      </div>
      <div class="model-meta-item">
        <span class="model-meta-label">版本：</span><strong class="model-meta-value" :title="model.version || ''">{{ model.version || '' }}</strong>
      </div>
      <div v-if="model.modelType === 1" class="model-meta-item model-meta-item--right">
        <span class="model-meta-label">最大窗口：</span><strong class="model-meta-value">{{ capabilityText }}</strong>
      </div>
    </div>

    <div class="card-actions">
      <btn icon="InfoFilled" plain @click="showApi">集成详情</btn>
      <btn type="primary" :disabled="model.modelType !== 1" @click="showPreview">
        <el-icon>
          <svg-icon icon-class="play-filled" :color="model.modelType !== 1 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff'" />
        </el-icon>
        效果测试
      </btn>
    </div>
  </el-card>

  <el-dialog
    v-model="apiVisible"
    :title="`集成对接规范：${model.name}`"
    width="800px"
    append-to-body
    align-center
    class="model-card-dialog"
    modal-class="model-card-dialog-overlay"
  >
    <div class="api-dialog">
      <div class="api-summary">
        <div class="api-summary-item">
          <span>模型版本</span>
          <strong>{{ model.version }}</strong>
        </div>
        <div class="api-summary-item">
          <span>可用度状态</span>
          <el-tag class="api-summary-status" :type="statusMeta[model.status ?? 0].type" :effect="statusMeta[model.status ?? 0].effect" round>
            {{ statusMeta[model.status ?? 0].label }}
          </el-tag>
        </div>
        <div class="api-summary-item">
          <span>源接口运营商</span>
          <strong>{{ model.supplier }}</strong>
        </div>
        <div v-if="model.modelType === 1" class="api-summary-item">
          <span>最大上下文限制</span>
          <strong>{{ capabilityText }}</strong>
        </div>
      </div>

      <div class="api-endpoint-section">
        <h3>API 服务接入点 (Internal Proxy Endpoint)</h3>
        <div class="api-endpoint-box">
          <code>POST {{ model.baseUrl }}</code>
          <btn type="primary" :icon="CopyDocument" @click="copyApi">复制</btn>
        </div>
      </div>

      <div class="curl-example-section">
        <h3>安全请求通信示例 (cURL)</h3>
        <pre>{{ curlExample }}</pre>
      </div>
    </div>
  </el-dialog>

  <el-dialog
    v-model="previewVisible"
    width="800px"
    append-to-body
    align-center
    class="model-card-dialog model-card-preview-dialog"
    modal-class="model-card-dialog-overlay"
  >
    <template #header>
      <div class="preview-dialog-header">
        <h2>大解构 - 效果测试预览：{{ model.name }}</h2>
      </div>
    </template>
    <div class="preview-dialog-meta">
      <div class="preview-dialog-meta-main">
        <el-tag type="primary" round>沙盒测试</el-tag>
        <strong>{{ model.name }}</strong>
      </div>
      <div class="preview-dialog-meta-extra">
        <em class="preview-dialog-meta-divider">提供商：{{ model.supplier || '' }}</em>
        <em>吞吐窗口：{{ capabilityText }}</em>
      </div>
    </div>
    <div class="preview-dialog">
      <el-scrollbar ref="chatScrollbarRef" height="360px" class="chat-scroll">
        <div v-for="(msg, index) in chatLog" :key="index" :class="['chat-item', msg.role]">
          <el-avatar v-if="msg.role === 'user'" :src="mockUserAvatar" :size="32" />
          <el-avatar v-else class="cpu-avatar" :size="32">
            <span class="cpu-avatar-icon"></span>
          </el-avatar>
          <div class="chat-bubble markdown-body" v-html="renderMarkdown(msg.content)"></div>
        </div>
        <div v-if="isTyping" class="chat-item model">
          <el-avatar class="cpu-avatar" :size="32">
            <span class="cpu-avatar-icon"></span>
          </el-avatar>
          <div class="chat-bubble muted">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            正在思考...
          </div>
        </div>
      </el-scrollbar>
      <div class="chat-input">
        <input-round v-model="message" placeholder="向模型发送消息测试..." @keyup.enter="sendMessage" />
        <btn type="primary" circle @click="sendMessage">
          <el-icon>
            <Promotion />
          </el-icon>
        </btn>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type ElScrollbar } from 'element-plus';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { CopyDocument, Loading, Promotion } from '@element-plus/icons-vue';
import type { ModelVO, ProxyDTO } from '@/types';
import { agiProxy } from '@/api/proxy/proxy';
import mockUserAvatar from '@/assets/images/model/avatar-mockuser.png';

const typeMeta: Record<1 | 2 | 3, { label: string; type: 'primary' | 'success' | 'warning' }> = {
  1: { label: 'LLM 大语言', type: 'primary' },
  2: { label: 'Embedding 向量', type: 'success' },
  3: { label: 'Reranker 排序', type: 'warning' }
};

const statusMeta: Record<0 | 1 | 2, { label: string; type: 'success' | 'warning' | 'info' }> = {
  0: { label: '部署中', type: 'warning' },
  1: { label: '已上线', type: 'success' },
  2: { label: '已下线', type: 'info' }
};

const props = defineProps<{
  model: ModelVO;
  categoryLabel: string;
  keyword?: string;
}>();

const emit = defineEmits<{
  edit: [model: ModelVO];
  delete: [id: number];
  'status-change': [id: number, status: 1 | 2];
}>();

const apiVisible = ref(false);
const previewVisible = ref(false);
const message = ref('');
type ChatMessage = { role: 'user' | 'model'; content: string };
const chatLog = ref<ChatMessage[]>([]);
const isTyping = ref(false);
const chatScrollbarRef = ref<InstanceType<typeof ElScrollbar>>();

const formatQuantity = (value?: string) => {
  const rawValue = value?.trim();
  if (!rawValue) return '-';

  const numericValue = Number(rawValue.replace(/,/g, ''));
  if (!Number.isFinite(numericValue)) return rawValue;

  const formatScaledValue = (scaledValue: number, suffix: 'K' | 'M') => {
    const roundedValue = Math.round(scaledValue * 10) / 10;
    return `${roundedValue}${suffix}`;
  };

  if (Math.abs(numericValue) >= 1_000_000) {
    return formatScaledValue(numericValue / 1_000_000, 'M');
  }

  if (Math.abs(numericValue) >= 1_000) {
    return formatScaledValue(numericValue / 1_000, 'K');
  }

  return String(numericValue);
};

const capabilityText = computed(() => formatQuantity(props.model.param1 || props.model.param2));
const markdown = new MarkdownIt({
  breaks: true
});

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entityMap[char];
  });

const getHighlightedText = (value?: string | null) => {
  const text = value ?? '';
  const keyword = props.keyword?.trim();
  if (!keyword) return escapeHtml(text);

  const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let html = '';
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    html += escapeHtml(text.slice(lastIndex, index));
    html += `<mark class="keyword-highlight">${escapeHtml(match[0])}</mark>`;
    lastIndex = index + match[0].length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
};

const renderMarkdown = (value?: string) => DOMPurify.sanitize(markdown.render(value || ''));

const curlExample = computed(() => {
  if (props.model.modelType === 2) {
    return `curl -X POST ${props.model.baseUrl} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "待分析向量的特征长句文本"}'`;
  }

  if (props.model.modelType === 3) {
    return `curl -X POST ${props.model.baseUrl} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "我的检索词",
    "documents": ["段落1", "段落2"]
  }'`;
  }

  return `curl -X POST ${props.model.baseUrl} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "我的大语言模型提问"}
    ]
  }'`;
});

const showApi = () => {
  apiVisible.value = true;
};

const showPreview = () => {
  previewVisible.value = true;
  message.value = '';
  chatLog.value = [
    {
      role: 'model',
      content: `你好，我是 ${props.model.name}，基于 ${props.model.supplier} 提供的模型服务。请发送你的测试问题。`
    }
  ];
};

const handleCommand = (command: string | number | object) => {
  if (command === 'edit') {
    if (props.model.status === 1) return;
    emit('edit', props.model);
    return;
  }

  if (command === 'online' || command === 'offline') {
    const isOnline = command === 'online';
    ElMessageBox.confirm(`确定将模型「${props.model.name}」标记${isOnline ? '上线' : '下线'}吗？`, '状态变更确认', {
      type: 'warning'
    }).then(() => {
      emit('status-change', props.model.id, isOnline ? 1 : 2);
    });
    return;
  }

  if (command === 'delete') {
    if (props.model.status !== 2) return;
    ElMessageBox.confirm(`确定删除模型「${props.model.name}」吗？删除后不可恢复。`, '删除确认', {
      type: 'warning'
    }).then(() => {
      emit('delete', props.model.id);
    });
  }
};

const copyApi = async () => {
  const text = props.model.baseUrl?.trim();
  if (!text) {
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }
    ElMessage.success('API 地址已复制');
  } catch (err) {
    try {
      fallbackCopy(text);
      ElMessage.success('API 地址已复制');
    } catch (fallbackErr) {
      console.error('--> --> 复制 API 地址失败', err, fallbackErr);
    }
  }
};
const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error('execCommand copy failed');
  }
};

const sendMessage = () => {
  const content = message.value.trim();
  if (!content) return;

  if (props.model.interfaceType !== 1) return;

  chatLog.value.push({ role: 'user', content });
  message.value = '';
  isTyping.value = true;

  const baseUrl = props.model.baseUrl?.trim().replace(/\/+$/, '') || '';
  const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const body: any = {
    model: props.model.modelCode,
    // enable_thinking: props.model.deepThinkFlag === 1,
    // stream: props.model.streamFlag === 1,
    messages: [{ role: 'user', content }]
  };
  const dto: ProxyDTO = {
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${props.model.apiKey}`
    },
    body: JSON.stringify(body),
    extra: { logType: 'model', content: props.model.name }
  };

  agiProxy
    .requestNonStream(dto)
    .then((res) => {
      const message = res?.choices?.[0]?.message;
      const content = message?.content || message?.reasoning_content;
      if (content) {
        chatLog.value.push({ role: message.role || 'assistant', content });
      }
    })
    .catch((err) => {
      console.error('--> --> 模型测试请求失败', err);
      ElMessage.closeAll();
      ElMessage.warning('模型测试请求失败');
    })
    .finally(() => {
      isTyping.value = false;
    });
};

watch([chatLog, isTyping], async () => {
  await nextTick();
  chatScrollbarRef.value?.setScrollTop(99999);
});
</script>

<style scoped lang="less">
/* Model card */
.model-card {
  border-width: 0;
  border-radius: 24px;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    padding: 24px !important;
  }
}

.card-header,
.tag-line,
.card-actions {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
}

.tag-line {
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  gap: 12px;
  overflow: hidden;

  :deep(.el-tag) {
    min-width: 0;
    flex: 0 1 auto;
  }

  :deep(.el-tag__content) {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.model-main {
  min-width: 0;
  margin-top: 20px;

  .model-name {
    margin: 0 0 16px;
    color: #2b2f33;
    font-size: 18px;
    font-weight: bold;
  }

  p {
    margin: 0;
    color: var(--color-slate-400);
    font-size: 12px;
  }

  .description-text {
    display: -webkit-box;
    height: 32px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.text-ellipsis {
  display: block;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.keyword-highlight) {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--el-color-danger-light-8);
  color: var(--el-color-danger);
  font-weight: inherit;
}

.model-meta {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin: 20px 0 0;
  padding: 12px;
  background: rgba(235, 243, 245, 0.6);
  border-radius: 16px;
  border: 1px solid #ebf3f5;
  font-size: 14px;
  font-weight: bold;

  .model-meta-item {
    white-space: nowrap;
  }

  .model-meta-item--full {
    grid-column: 1 / -1;
  }

  .model-meta-item--right {
    text-align: right;
  }

  .model-meta-label {
    color: #77838f;
  }

  .model-meta-value {
    color: #2b2f33;
  }
}

.card-actions {
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;

  :deep(.el-button) {
    flex: 1 0 calc(50% - 10px);
    min-width: 100px;
    margin-left: 0;
    white-space: nowrap;
  }
}

/* API dialog */
.api-dialog,
.api-endpoint-section,
.curl-example-section,
.preview-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.api-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 20px;
  padding: 0;
  border: 0;
  background: transparent;
}

.api-endpoint-section {
  margin-top: 24px;
  background: var(--el-color-white);
}

.api-summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    font-size: 14px;
    font-weight: 400;
  }

  strong {
    color: #2b2f33;
    font-size: 16px;
    font-weight: bold;
  }
}

.api-summary-status {
  align-self: flex-start;
}

.api-endpoint-section h3,
.curl-example-section h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #2b2f33;
}

.api-endpoint-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-color-white);
  padding: 8px 16px;

  code {
    min-width: 0;
    overflow: hidden;
    color: #2b2f33;
    font-size: 14px;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .el-button {
    height: 32px;
    border-radius: 8px !important;
  }
}

.curl-example-section {
  margin-top: 24px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: rgba(235, 243, 245, 0.6);
  padding: 20px 16px;
  color: #2b2f33;

  pre {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: clip;
  }
}

/* Preview dialog */
.chat-scroll {
  border: 0;
  padding: 0 10px;
}

.chat-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;

  &.user {
    flex-direction: row-reverse;

    .chat-bubble {
      background: rgba(255, 255, 255, 0.6);
    }
  }
}

.cpu-avatar {
  background: rgba(235, 243, 245, 0.6);
}

.cpu-avatar-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: none;
  background-color: var(--el-color-primary);
  -webkit-mask: url('@/assets/icons/svg/robot.svg') center / contain no-repeat;
  mask: url('@/assets/icons/svg/robot.svg') center / contain no-repeat;
}

.chat-bubble {
  max-width: 72%;
  border: 1px solid #e1e6ec;
  border-radius: 12px;
  background: rgba(235, 243, 245, 0.6);
  padding: 20px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.markdown-body {
  :deep(p) {
    margin: 0 0 8px;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }
}

.muted {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 10px;
}

.preview-dialog-header {
  min-width: 0;
  flex: 1 1 auto;

  h2 {
    color: #2b2f33;
    font-size: 20px;
    font-weight: bold;
  }
}

.preview-dialog-meta {
  display: grid;
  box-sizing: border-box;
  grid-template-columns: minmax(0, 1fr) max-content;
  min-width: 0;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 0 10px;

  .preview-dialog-meta-main {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }

  strong {
    display: block;
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
    color: #2b2f33;
    font-size: 16px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-dialog-meta-extra {
    display: flex;
    align-items: center;
    justify-self: end;
    color: #2b2f33;
    font-size: 14px;
    font-weight: 400;
    white-space: nowrap;
  }

  em {
    font-style: normal;
  }

  .preview-dialog-meta-divider {
    margin-right: 10px;
    padding-right: 10px;
    border-right: 1px solid var(--el-border-color);
  }
}

/* Teleported Element Plus layers */
:global(.model-card-dialog-overlay) {
  background-color: var(--el-overlay-color);
  backdrop-filter: blur(4px);
}

:global(.model-card-dialog) {
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 24px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow);
}

:global(.model-card-dialog .el-dialog__header) {
  display: flex;
  align-items: center;
  min-height: 57px;
  margin: 0;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.model-card-dialog .el-dialog__title) {
  color: #2b2f33;
  font-size: 20px;
  font-weight: bold;
}

:global(.model-card-dialog .el-dialog__headerbtn) {
  top: 13px;
  right: 18px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

:global(.model-card-dialog .el-dialog__headerbtn:hover) {
  background: var(--el-fill-color-light);
}

:global(.model-card-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--el-text-color-secondary);
  font-size: 16px;
}

:global(.model-card-dialog .el-dialog__body) {
  padding: 24px;
  overflow-y: auto;
}

:global(.model-card-preview-dialog .el-dialog__body) {
  display: flex;
  height: 543px;
  flex-direction: column;
  padding: 24px 4px;
}

:global(.model-card-preview-dialog .preview-dialog) {
  min-height: 0;
  flex: 1;
}

:global(.model-card-dropdown .el-dropdown-menu__item) {
  color: var(--el-color-primary) !important;
  font-weight: 400 !important;
  font-size: 12px !important;
}

:global(.model-card-dropdown .el-dropdown-menu__item.delete) {
  color: var(--el-text-color-danger) !important;
}

:global(.model-card-dropdown .el-dropdown-menu__item.is-disabled) {
  color: var(--el-text-color-disabled) !important;
}
</style>
