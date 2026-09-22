import type { CustomAgentsVO } from '../agent/customAgents';
import type { TenantsVO } from '../tenants';

/** 网页嵌入渠道新增/更新参数 */
export interface EmbedChannelsDTO {
  /** 主键 ID */
  id?: string;
  /** 所属工作空间（租户）ID */
  tenantId?: number;
  /** 智能体 ID */
  agentId?: string;
  /** 嵌入渠道名称 */
  name?: string;
  /** 是否启用该嵌入渠道 */
  enabled?: boolean;
  /** 嵌入发布令牌（机密） */
  publishToken?: string;
  /** 允许的来源 Origin 列表/模式 */
  allowedOrigins?: string;
  /** 嵌入页欢迎语 */
  welcomeMessage?: string;
  /** 每分钟速率限制 */
  rateLimitPerMinute?: number;
  /** 每日速率限制 */
  rateLimitPerDay?: number;
  /** 主题主色 */
  primaryColor?: string;
  /** 页面标题 */
  pageTitle?: string;
  /** 页头标题展示模式 */
  headerTitleMode?: string;
  /** 是否展示建议问题 */
  showSuggestedQuestions?: boolean;
  /** 嵌入挂件位置 */
  widgetPosition?: string;
  /** 是否允许联网搜索 */
  allowWebSearch?: boolean;
  /** 是否允许使用智能体记忆 */
  allowMemory?: boolean;
  /** 是否允许上传文件 */
  allowFileUpload?: boolean;
  /** 默认语言区域 */
  defaultLocale?: string;
  /** Webhook 回调地址 */
  webhookUrl?: string;
  /** Webhook 签名密钥 */
  webhookSecret?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
}

/** 网页嵌入渠道分页查询参数 */
export interface EmbedChannelsPageDTO extends EmbedChannelsDTO {}

/** 网页嵌入渠道返回数据 */
export interface EmbedChannelsVO extends EmbedChannelsDTO {
  /** 租户 */
  tenant?: TenantsVO;
  /** 智能体 */
  agent?: CustomAgentsVO;
  /** 软删除时间；非空表示已删除 */
  deletedAt?: string;
}
