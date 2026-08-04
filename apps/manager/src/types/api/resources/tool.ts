import { BaseEntity } from '../common';

// Request DTO
export interface ToolPageDTO {
  categoryId?: number;
  categoryIdPath?: string;
  toolType?: number;
  status?: 0 | 1 | 2;
  keyword?: string;
}

// Request DTO
export interface ToolDTO {
  id?: number;
  toolType?: number;
  name?: string;
  code?: string;
  categoryId?: number;
  description?: string;
  version?: string;
  baseUrl?: string;
  apiEntryMethod?: number;
  apiEntryInfo?: string;
  apiAuthMethod?: number;
  apiAuthParam?: number;
  mcpType?: number;
  mcpJson?: string;
  mcpTimeOut?: number;
  mcpRetry?: number;
  mcpToolFlag?: number;
  mcpResourcesFlag?: number;
  mcpPromptsFlag?: number;
  status?: 0 | 1 | 2;
}

// Response VO
export interface ToolVO extends ToolDTO, BaseEntity {
  delFlag?: 0 | 1;
}
