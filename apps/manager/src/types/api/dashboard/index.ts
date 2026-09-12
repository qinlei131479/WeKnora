/** 顶部数据总览 */
export interface DashboardStatsVO {
  /** 总对话数 */
  totalConversations?: number;
  /** 活跃对话数 */
  activeConversations?: number;
  /** 总消息数 */
  totalMessages?: number;
  /** 总用户数 */
  totalUsers?: number;
  /** 反馈统计 */
  feedbackStats?: FeedbackStats;
  /** 是否按系统分类 */
  splitBySystem?: boolean;
  /** 对话式会话数 */
  weknoraSessions?: number;
  /** 生成式会话数 */
  yuxiConversations?: number;
  /** 对话式会话消息数 */
  weknoraMessages?: number;
  /** 生成式会话消息数 */
  yuxiMessages?: number;
}

/** 反馈统计 */
export interface FeedbackStats {
  /** 反馈数 */
  totalFeedbacks?: number;
  /** 满意度 */
  satisfactionRate?: number;
}

/** 用户活跃度分析 */
export interface UserActivityStatsVO {
  /** 总用户数 */
  totalUsers?: number;
  /** 最近24小时活跃用户数 */
  activeUsers24h?: number;
  /** 最近30天活跃用户数 */
  activeUsers30d?: number;
  /** 最近7天每日活跃用户数 */
  dailyActiveUsers?: DailyActiveUser[];
}

/** 每日活跃用户数 */
export interface DailyActiveUser {
  /** 日期 yyyy-MM-dd */
  date?: string;
  /** 活跃用户数 */
  activeUsers?: number;
}

/** 工具调用监控 */
export interface ToolCallStatsVO {
  /** 总工具调用数 */
  totalCalls?: number;
  /** 成功调用数 */
  successfulCalls?: number;
  /** 失败调用数 */
  failedCalls?: number;
  /** 成功率 */
  successRate?: number;
  /** 最常用工具 */
  mostUsedTools?: MostUsedTool[];
  /** 工具调用错误分布 */
  toolErrorDistribution?: Record<string, number>;
  /** 最近7天每日工具调用数 */
  dailyToolCalls?: DailyToolCall[];
}

/** 最常用工具 */
export interface MostUsedTool {
  /** 工具名称 */
  toolName?: string;
  /** 调用次数 */
  count?: number;
}

/** 每日工具调用数 */
export interface DailyToolCall {
  /** 日期 yyyy-MM-dd */
  date?: string;
  /** 调用次数 */
  callCount?: number;
}

/** 知识库使用情况 */
export interface KnowledgeStatsVO {
  /** 总数据库数 */
  totalDatabases?: number;
  /** 总文件数 */
  totalFiles?: number;
  /** 总节点数 */
  totalNodes?: number;
  /** 总存储大小 */
  totalStorageSize?: number;
  /** 数据库类型分布 */
  databasesByType?: Record<string, number>;
  /** 文件类型分布 */
  fileTypeDistribution?: Record<string, number>;
  /** 是否按系统分类 */
  splitBySystem?: boolean;
  /** 系统分类 */
  source?: string;
}

/** 调用趋势统计 */
export interface TimeSeriesStatsVO {
  /** 总对话数 */
  totalCount?: number;
  /** 峰值日期 */
  peakDate?: string;
  /** 峰值对话数 */
  peakCount?: number;
  /** 活跃对话数统计 */
  data?: DataStats[];
  /** 分类统计 */
  categories?: string[];
  /** 平均活跃对话数统计 */
  averageCount?: number;
  /** 智能体id-名称关系 */
  agentNames?: AgentName[];
}

/** 单日调用统计 */
export interface DataStats {
  /** 总对话数 */
  total?: number;
  /** 日期 yyyy-MM-dd */
  date?: string;
  /** 分组-数量关系 */
  data?: CategoryCount[];
}

/** 分组统计 */
export interface CategoryCount {
  /** 分组 */
  category?: string;
  /** 数据量 */
  count?: number;
}

/** 智能体id-名称关系 */
export interface AgentName {
  /** 智能体id */
  id?: string;
  /** 智能体名称 */
  name?: string;
}

/** AI智能体分析 */
export interface AgentAnalyticsVO {
  /** 总智能体数 */
  totalAgents?: number;
  /** 智能体对话次数 */
  agentConversationCounts?: AgentConversationCount[];
  /** 智能体满意度 */
  agentSatisfactionRates?: AgentSatisfactionRate[];
  /** 智能体工具使用 */
  agentToolUsage?: AgentToolUsage[];
  /** 智能体性能排名 */
  topPerformingAgents?: TopPerformingAgent[];
  /** 智能体名称映射 */
  agentNames?: Record<string, string>;
  /** 是否按系统分类 */
  splitBySystem?: boolean;
  /** Yuxi智能体数 */
  yuxiTotalAgents?: number;
  /** Weknora智能体数 */
  weknoraTotalAgents?: number;
  /** Weknora智能体对话次数 */
  weknoraAgentConversationCounts?: WeknoraAgentConversationCount[];
  /** Weknora智能体名称映射 */
  weknoraAgentNames?: Record<string, string>;
}

/** 智能体对话次数 */
export interface AgentConversationCount {
  /** 智能体ID */
  agentId?: string;
  /** 次数 */
  conversationCount?: number;
}

/** 智能体满意度 */
export interface AgentSatisfactionRate {
  /** 智能体ID */
  agentId?: string;
  /** 满意度 */
  satisfactionRate?: number;
  /** 总反馈数 */
  totalFeedbacks?: number;
}

/** 智能体工具使用 */
export interface AgentToolUsage {
  /** 智能体ID */
  agentId?: string;
  /** 工具调用次数 */
  toolUsageCount?: number;
}

/** 智能体性能排名 */
export interface TopPerformingAgent {
  /** 智能体ID */
  agentId?: string;
  /** 对话次数 */
  conversationCount?: number;
  /** 满意度 */
  satisfactionRate?: number;
}

/** Weknora智能体对话次数 */
export interface WeknoraAgentConversationCount {
  /** 智能体ID */
  agentId?: string;
  /** 对话次数 */
  conversationCount?: number;
  /** 所属系统 */
  system?: string;
}
