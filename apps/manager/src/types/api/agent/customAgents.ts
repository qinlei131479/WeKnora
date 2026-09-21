import type { KnowledgeBaseEntity, McpServicesVO } from '../data';
import type { TenantsVO } from '../data/tenants';
import type { ModelEntity } from '../model';

export type CustomAgentMode = 'quick-answer' | 'smart-reasoning';

export type CustomAgentType = 'rag-qa' | 'wiki-qa' | 'hybrid-rag-wiki' | 'data-analysis' | 'custom';

export interface CustomAgentParserEngineRule {
  file_types?: string[];
  engine?: string;
}

export interface CustomAgentQuestionSuggestions {
  starters?: {
    enabled?: boolean;
    mode?: 'curated' | 'knowledge' | 'hybrid';
    items?: string[];
    count?: number;
  };
  follow_ups?: {
    enabled?: boolean;
    mode?: 'generated' | 'knowledge' | 'hybrid';
    count?: number;
    model_id?: string;
    additional_instruction?: string;
    categories?: Array<'clarify' | 'deepen' | 'action'>;
    max_context_turns?: number;
    suppress_on_fallback?: boolean;
    suppress_when_answer_asks_question?: boolean;
    knowledge_fallback?: boolean;
    allow_regenerate?: boolean;
  };
}

export interface CustomAgentConfig {
  agent_mode?: CustomAgentMode;
  agent_type?: CustomAgentType;
  system_prompt?: string;
  system_prompt_id?: string;
  context_template?: string;
  context_template_id?: string;
  model_id?: string;
  rerank_model_id?: string;
  temperature?: number;
  max_completion_tokens?: number;
  thinking?: boolean;
  citation_enabled?: boolean;
  max_iterations?: number;
  llm_call_timeout?: number;
  allowed_tools?: string[];
  mcp_selection_mode?: 'all' | 'selected' | 'none' | '';
  mcp_services?: string[];
  mcp_auth_wait_timeout?: number;
  skills_selection_mode?: 'all' | 'selected' | 'none' | '';
  selected_skills?: string[];
  kb_selection_mode?: 'all' | 'selected' | 'none';
  knowledge_bases?: string[];
  retrieve_kb_only_when_mentioned?: boolean;
  retain_retrieval_history?: boolean;
  image_upload_enabled?: boolean;
  vlm_model_id?: string;
  audio_upload_enabled?: boolean;
  asr_model_id?: string;
  image_storage_provider?: string;
  supported_file_types?: string[];
  chat_parser_engine_rules?: CustomAgentParserEngineRule[];
  attachment_image_understanding?: boolean;
  attachment_ocr_max_pages?: number;
  attachment_parse_wait_timeout_sec?: number;
  data_analysis_enabled?: boolean;
  faq_priority_enabled?: boolean;
  faq_direct_answer_threshold?: number;
  faq_score_boost?: number;
  web_search_enabled?: boolean;
  web_search_max_results?: number;
  web_search_provider_id?: string;
  web_fetch_enabled?: boolean;
  web_fetch_top_n?: number;
  multi_turn_enabled?: boolean;
  history_turns?: number;
  embedding_top_k?: number;
  keyword_threshold?: number;
  vector_threshold?: number;
  rerank_top_k?: number;
  rerank_threshold?: number;
  enable_query_expansion?: boolean;
  enable_rewrite?: boolean;
  rewrite_prompt_system?: string;
  rewrite_prompt_user?: string;
  query_understand_model_id?: string;
  fallback_strategy?: 'fixed' | 'model';
  fallback_response?: string;
  fallback_prompt?: string;
  intent_prompts?: Record<string, string>;
  question_suggestions?: CustomAgentQuestionSuggestions;
}

export interface CustomAgentsDTO {
  id?: string;
  name?: string;
  description?: string;
  avatar?: string;
  isBuiltin?: boolean;
  tenantId?: number;
  createdBy?: string;
  config?: string;
  createdAt?: string;
  updatedAt?: string;
  runnableByViewer?: boolean;
}

export interface CustomAgentsPageDTO extends CustomAgentsDTO {
  createdAtStart?: string;
  createdAtEnd?: string;
}

export interface CustomAgentsVO extends CustomAgentsDTO {
  deletedAt?: string;
  tenant?: TenantsVO;
  model?: ModelEntity;
  asrModel?: ModelEntity;
  vlmModel?: ModelEntity;
  reRankModel?: ModelEntity;
  knowledgeBasesList?: KnowledgeBaseEntity[];
  mcpServicesList?: McpServicesVO[];
}
