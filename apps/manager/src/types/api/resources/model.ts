import { BaseEntity } from '../common';

// Request DTO
export interface ModelPageDTO {
  categoryId?: number;
  categoryIdPath?: string;
  modelType?: 1 | 2 | 3;
  status?: 0 | 1 | 2;
  keyword?: string;
}

export interface ModelDTO {
  id?: number;
  name?: string;
  description?: string;
  categoryId?: number;
  supplier?: string;
  modelType?: 1 | 2 | 3;
  version?: string;
  interfaceType?: 1 | 2 | 3;
  baseUrl?: string;
  modelCode?: string;
  apiKey?: string;
  param1?: string;
  param2?: string;
  deepThinkFlag?: 0 | 1;
  streamFlag?: 0 | 1;
  status?: 0 | 1 | 2;
  fastThinkFlag?: 0 | 1;
  slowThinkFlag?: 0 | 1;
}

// Response VO
export interface ModelVO extends ModelDTO, BaseEntity {
  delFlag?: 0 | 1;
}
