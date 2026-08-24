export interface VectorStoresDTO {
  id?: string;
  name?: string;
  engineType?: string;
  connectionConfig?: string;
  indexConfig?: string;
  tenantId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VectorStoresPageDTO extends VectorStoresDTO {
  deletedAt?: string;
  tenantName?: string;
}

export interface VectorStoresVO extends VectorStoresDTO {
  deletedAt?: string;
  tenantName?: string;
}
