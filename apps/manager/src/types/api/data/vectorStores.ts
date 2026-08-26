export interface VectorStoresDTO {
  id?: string;
  name?: string;
  engineType?: string;
  connectionConfig?: string;
  indexConfig?: string;
  tenantId?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  source?: string;
}

export interface VectorStoresPageDTO extends VectorStoresDTO {
  deletedAt?: string;
  tenantName?: string;
}

export interface VectorStoresVO extends VectorStoresDTO {
  deletedAt?: string;
  tenantName?: string;
}
