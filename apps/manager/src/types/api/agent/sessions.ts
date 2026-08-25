export interface SessionsDTO {
  id?: string;
  tenantId?: number;
  title?: string;
  description?: string;
  knowledgeBaseId?: string;
  maxRounds?: number;
  enableRewrite?: boolean;
  fallbackStrategy?: string;
  fallbackResponse?: string;
  keywordThreshold?: number;
  vectorThreshold?: number;
  rerankModelId?: string;
  embeddingTopK?: number;
  rerankTopK?: number;
  rerankThreshold?: number;
  summaryModelId?: string;
  summaryParameters?: string;
  agentConfig?: string;
  contextConfig?: string;
  createdAt?: string;
  updatedAt?: string;
  agentId?: string;
  userId?: string;
  isPinned?: boolean;
  pinnedAt?: string;
}

export interface SessionsPageDTO extends SessionsDTO {
  createdAtStart?: string;
  createdAtEnd?: string;
}

export interface SessionsVO extends SessionsDTO {
  deletedAt?: string;
  tenantName?: string;
  username?: string;
}
