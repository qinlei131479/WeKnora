import { BaseEntity } from '../common';

// Request DTO
export interface KnowledgeOptLogPageDTO {
  keyword?: string;
  start?: string;
  end?: string;
}

// Response VO
export interface KnowledgeOptLogVO extends BaseEntity {
  id: number;
  userName?: string;
  eventDesc?: string;
  knowledgeId?: number;
  knowledgeName?: string;
  userId?: number;
  postId?: number;
  postName?: string;
  ip?: string;
  delFlag?: 0 | 1;
}
