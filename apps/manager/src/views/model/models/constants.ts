import type { ModelType } from '@/types/api/model/model';

interface SelectOption {
  value: string;
  /** i18n key，第二个参数是兜底中文 */
  labelKey: string;
  label: string;
  example?: Record<string, string>;
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
