import type { ModelType } from '@/types/api/model/model';

interface SelectOption {
  value: string;
  /** i18n key，第二个参数是兜底中文 */
  labelKey: string;
  label: string;
  example?: Record<string, string>;
  placeholderKey?: string;
  placeholder?: string;
}

/** 模型类型，值与后端落库的 type 一致 */
export const MODEL_TYPE_OPTIONS: SelectOption[] = [
  { value: 'KnowledgeQA', labelKey: 'page.models.type.KnowledgeQA', label: '对话', example: { name: 'gpt-4, claude-3-opus' } },
  { value: 'Embedding', labelKey: 'page.models.type.Embedding', label: 'Embedding', example: { name: 'gpt-4, claude-3-opus' } },
  { value: 'Rerank', labelKey: 'page.models.type.Rerank', label: 'ReRank', example: { name: 'gpt-4, claude-3-opus' } },
  { value: 'VLLM', labelKey: 'page.models.type.VLLM', label: '视觉', example: { name: 'gpt-4-vision-preview' } },
  { value: 'ASR', labelKey: 'page.models.type.ASR', label: '语音', example: { name: 'whisper-1' } }
];

/**
 * 模型来源。后端只做字符串存储，remote / local 是最常用的两个值，
 * 表单里允许自定义输入以兼容厂商专属来源。
 */
export const MODEL_SOURCE_OPTIONS: SelectOption[] = [
  { value: 'remote', labelKey: 'page.models.source.remote', label: 'API' },
  { value: 'local', labelKey: 'page.models.source.local', label: 'Ollama' }
];

const TYPE_LABEL_KEYS = MODEL_TYPE_OPTIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.labelKey;
  return acc;
}, {});

/** 列表里把落库的 type 翻译成中文，未知值原样展示 */
export const modelTypeLabelKey = (type?: string) => (type ? TYPE_LABEL_KEYS[type as ModelType] : undefined);

/** 思考模式 */
export const THINKING_CONTROL_OPTIONS: SelectOption[] = [
  {
    value: 'none',
    labelKey: 'page.models.form.thinkingControl.none',
    label: '不写入思考参数',
    placeholderKey: 'page.models.form.thinkingControl.nonePlaceholder',
    placeholder: '智能体「思考模式」开关不生效，不会在请求中写入思考相关参数'
  },
  {
    value: 'chat_template_kwargs',
    labelKey: 'page.models.form.thinkingControl.chatTemplateKwargs',
    label: 'chat_template_kwargs',
    placeholderKey: 'page.models.form.thinkingControl.chatTemplateKwargsPlaceholder',
    placeholder: '自定义 OpenAI 兼容、NVIDIA NIM、vLLM / 本地 Qwen 部署'
  },
  {
    value: 'enable_thinking',
    labelKey: 'page.models.form.thinkingControl.enableThinking',
    label: 'enable_thinking',
    placeholderKey: 'page.models.form.thinkingControl.enableThinkingPlaceholder',
    placeholder: '阿里云 DashScope：qwen3、qwen-plus、qwen-max、qwen-turbo'
  },
  {
    value: 'thinking_type',
    labelKey: 'page.models.form.thinkingControl.thinkingType',
    label: 'thinking.type',
    placeholderKey: 'page.models.form.thinkingControl.thinkingTypePlaceholder',
    placeholder: '火山引擎 Ark；腾讯云 LKEAP（DeepSeek V3 等，选 LKEAP 时默认此项；R1 请改「不写入」）'
  }
];
