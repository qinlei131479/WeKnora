export interface MessagesDTO {
  id?: string;
  requestId?: string;
  sessionId?: string;
  role?: string;
  content?: string;
  knowledgeReferences?: string;
  agentSteps?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  mentionedItems?: string;
  isFallback?: boolean;
  agentDurationMs?: number;
  knowledgeId?: string;
  images?: string;
  channel?: string;
  renderedContent?: string;
  attachments?: string;
  agentId?: string;
  agentTenantId?: number;
  modelId?: string;
  executionContext?: string;
}

export interface MessagesPageDTO extends MessagesDTO {}

export interface MessagesVO extends MessagesDTO {
  deletedAt?: string;
}
