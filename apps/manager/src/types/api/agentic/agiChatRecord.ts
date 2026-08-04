import type { BaseEntity } from '../common';
import { AgentBrainBase } from './agentBrain';

// Request DTO
export interface AgiChatRecordDTO {
  id?: number;
  msgId?: string;
  userId?: number;
  userName?: string;
  deptId?: number;
  deptName?: string;
  postId?: number;
  postName?: string;
  interactionContent?: string;
  categoryName?: string;
  clientId?: string;
  clientName?: string;
  question?: string;
  answer?: string;
  sessionId?: string;
  questionTime?: string;
  answerStartTime?: string;
  answerEndTime?: string;
  remark?: string;
  totalTime?: string;
  agenticId?: number;
  agenticName?: string;
}

export interface AgiChatRecordPageDTO {
  postId?: number;
  deptId?: number;
  agenticId?: number;
  keyword?: string;
  start?: string;
  end?: string;
  sessionIdList?: string[];
}

export interface AgiChatRecordHistoryDTO {
  id?: number;
  beforeNum?: number;
  afterNum?: number;
  userId?: number;
}

// Response VO
export interface AgiChatRecordVO extends AgiChatRecordDTO, BaseEntity {
  delFlag?: 0 | 1;
}
