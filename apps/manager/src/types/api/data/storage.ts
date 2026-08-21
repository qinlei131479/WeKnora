export interface StorageBackendsDTO {
  id?: string;
  tenantId?: number;
  name?: string;
  provider?: string;
  config?: string;
  source?: string;
  status?: 'active' | 'disabled';
  legacyAlias?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StorageBackendsPageDTO extends StorageBackendsDTO {}

export interface StorageBackendsVO extends StorageBackendsDTO {
  deletedAt?: string;
  tenantName?: string;
  isDefault?: boolean;
}
