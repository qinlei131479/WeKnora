import { BaseEntity } from '../common';

// Request DTO
export interface SkillPageDTO {
  categoryId?: number;
  categoryIdPath?: string;
  entryMethod?: number;
  keyword?: string;
  status?: 0 | 1 | 2;
}

// Request DTO
export interface SkillDTO {
  id?: number;
  categoryId?: number;
  entryMethod?: number;
  entryInfo?: string;
  name?: string;
  version?: string;
  domain?: string;
  owner?: string;
  description?: string;
  status?: 0 | 1 | 2;
}

export interface SkillImportGitDTO {
  categoryId?: number;
  url: string;
  branch?: string;
  skillRootPath?: string;
}

// Response VO
export interface SkillVO extends SkillDTO, BaseEntity {
  delFlag?: 0 | 1;
}

export interface SkillImportVO {
  name: string;
  description: string;
  uuid: string;
}
