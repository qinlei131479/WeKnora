import type { CustomAgentsVO } from '../agent/customAgents';
import type { KnowledgeBaseEntity } from '../data';
import type { TenantsVO } from '../tenants';

/** IM 渠道基础交互参数 */
export interface ImChannelsDTO {
  /** 主键 ID */
  id?: string;
  /** 所属工作空间（租户）ID */
  tenantId?: number;
  /** 智能体 ID */
  agentId?: string;
  /** 平台标识 */
  platform?: string;
  /** IM 渠道展示名称 */
  name?: string;
  /** 是否启用该 IM 渠道 */
  enabled?: boolean;
  /** 连接/工作模式 */
  mode?: string;
  /** 输出模式（如 stream） */
  outputMode?: string;
  /** 凭证配置（JSON，通常加密） */
  credentials?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
  /** 可选绑定的知识库 ID */
  knowledgeBaseId?: string;
  /** 机器人身份标识（非空时唯一） */
  botIdentity?: string;
  /** 会话模式（如按用户） */
  sessionMode?: string;
}

/** IM 渠道分页查询参数 */
export interface ImChannelsPageDTO extends ImChannelsDTO {}

/** IM 渠道返回数据 */
export interface ImChannelsVO extends ImChannelsDTO {
  /** 租户 */
  tenant?: TenantsVO;
  /** 智能体 */
  agent?: CustomAgentsVO;
  /** 软删除时间；非空表示已删除 */
  deletedAt?: string;
  /** 知识库 */
  knowledgeBase?: KnowledgeBaseEntity;
}
