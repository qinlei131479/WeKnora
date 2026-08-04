import type { BaseEntity } from '../common';
import { AgentBrainBase } from './agentBrain';

// Request DTO
export interface AgiClientDTO {
  id?: number;
  name?: string;
  type?: 1 | 2 | 3 | 4;
  icon?: string | null;
  agenticId?: number;
  appKey?: string;
  appSecret?: string;
  address?: string;
  clientToken?: string;
}

export interface AgiClientPageDTO {
  type?: 1 | 2 | 3 | 4;
  status?: number;
  keyword?: string;
}

export interface AgiClientInfoDTO {
  id: number;
  name?: string;
  type?: 1 | 2 | 3 | 4;
  icon?: string;
}

export interface AgiClientAgenticDTO {
  id: number;
  agenticId?: number;
}

export interface AgiClientSecretDTO {
  id: number;
  appKey?: string;
  appSecret?: string;
  address?: string;
  clientToken?: string;
}

// Response VO
export interface AgiClientVO extends AgiClientDTO, BaseEntity {
  baseAgentic?: AgentBrainBase;
  businessAgentic?: AgentBrainBase;
  status: 0 | 1;
  delFlag: 0 | 1;
}
