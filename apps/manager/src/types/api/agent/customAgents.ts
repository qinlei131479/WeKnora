import type { TenantsVO } from '../data/tenants';

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

export interface CustomAgentsPageDTO extends CustomAgentsDTO {}

export interface CustomAgentsVO extends CustomAgentsDTO {
  deletedAt?: string;
  tenant?: TenantsVO;
  model?: unknown;
  asrModel?: unknown;
  vlmModel?: unknown;
  reRankModel?: unknown;
  knowledgeBasesList?: unknown[];
  mcpServicesList?: unknown[];
}
