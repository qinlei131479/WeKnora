export interface TenantsDTO {
  id?: number;
  name?: string;
  description?: string;
  retrieverEngines?: string;
  status?: 'active' | 'disabled';
  business?: string;
  storageQuota?: bigint;
  storageUsed?: bigint;
  agentConfig?: string;
  createdAt?: string;
  updatedAt?: string;
  contextConfig?: string;
  conversationConfig?: string;
  webSearchConfig?: string;
  parserEngineConfig?: string;
  storageEngineConfig?: string;
  chatHistoryConfig?: string;
  retrievalConfig?: string;
  credentials?: string;
  apiPrincipalConfig?: string;
  defaultStorageBackendId?: string;
}

export interface TenantsPageDTO extends TenantsDTO {}

export interface TenantsVO extends TenantsDTO {
  deletedAt?: string;
}
