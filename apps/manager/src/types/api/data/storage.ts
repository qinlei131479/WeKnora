export interface StorageBackendsDTO {
  id?: string;
  tenantId: number;
  name?: string;
  provider?: string;
  config?: string;
  source?: string;
  status?: string;
  legacyAlias?: boolean;
}

export interface StorageBackendsVO {
  id: string;
  tenantId: number;
  name: string;
  provider?: string;
  config?: string;
  source?: string;
  status?: string;
  legacyAlias?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
