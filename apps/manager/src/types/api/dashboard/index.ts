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
  feedbackStats?: DashboardStatsVO.FeedbackStats;
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
export namespace DashboardStatsVO {
  /** 反馈统计 */
  export interface FeedbackStats {
    /** 反馈数 */
    totalFeedbacks?: number;
    /** 满意度 */
    satisfactionRate?: number;
  }
}

/** 用户活跃度分析 */
export interface DashboardUserActiveStatsVO {
  /** 总用户数 */
  totalUsers?: number;
  /** 最近24小时活跃用户数 */
  activeUsers24h?: number;
  /** 最近30天活跃用户数 */
  activeUsers30d?: number;
  /** 最近7天每日活跃用户数 */
  dailyActiveUsers?: DashboardUserActiveStatsVO.DailyActiveUser[];
  /** 最近30天活跃用户列表 */
  activeUsers?: DashboardUserActiveStatsVO.ActiveUser[];
}
export namespace DashboardUserActiveStatsVO {
  /** 最近30天活跃用户 */
  export interface ActiveUser {
    /** 活跃度 COUNT */
    score?: number;
    /** 用户ID */
    id?: string;
    /** 用户名 */
    username?: string;
    /** 登录邮箱 */
    email?: string;
    /** 头像/图标 */
    avatar?: string;
    /** 租户ID */
    tenantId?: number;
  }

  /** 每日活跃用户数 */
  export interface DailyActiveUser {
    /** 日期 yyyy-MM-dd */
    date?: string;
    /** 活跃用户数 */
    activeUsers?: number;
  }
}

/** 工具调用监控 */
export interface DashboardToolCallStatsVO {
  /** 总工具调用数 */
  totalCalls?: number;
  /** 成功调用数 */
  successfulCalls?: number;
  /** 失败调用数 */
  failedCalls?: number;
  /** 成功率 */
  successRate?: number;
  /** 最常用工具 */
  mostUsedTools?: DashboardToolCallStatsVO.MostUsedTool[];
  /** 工具调用错误分布 */
  toolErrorDistribution?: Record<string, number>;
  /** 最近7天每日工具调用数 */
  dailyToolCalls?: DashboardToolCallStatsVO.DailyToolCall[];
}
export namespace DashboardToolCallStatsVO {
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
}

/** 知识库使用情况 */
export interface DashboardKnowledgeStatsVO {
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
  /** 常用知识库列表 */
  activeKnowledgeBases?: DashboardKnowledgeStatsVO.ActiveKnowledgeBase[];
}
export namespace DashboardKnowledgeStatsVO {
  /** 常用知识库 */
  export interface ActiveKnowledgeBase {
    /** 活跃度 COUNT */
    score?: number;
    /** 知识库ID */
    id?: string;
    /** 知识库名称 */
    name?: string;
    /** 知识库描述 */
    description?: string;
    /** 知识库类型：document/faq/wiki */
    type?: string;
  }
}

/** 最近对话消息 */
export interface DashboardConversationVO {
  /** 对话ID */
  id?: string;
  /** 对话标题 */
  title?: string;
  /** 智能体ID */
  agentId?: string;
  /** 智能体名称 */
  agentName?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 调用趋势统计 */
export interface DashboardTimeSeriesStatsVO {
  /** 总对话数 */
  totalCount?: number;
  /** 峰值日期 */
  peakDate?: string;
  /** 峰值对话数 */
  peakCount?: number;
  /** 活跃对话数统计 */
  data?: DashboardTimeSeriesStatsVO.DataStats[];
  /** 分类统计 */
  categories?: string[];
  /** 平均活跃对话数统计 */
  averageCount?: number;
  /** 智能体id-名称关系 */
  agentNames?: DashboardTimeSeriesStatsVO.AgentName[];
}
export namespace DashboardTimeSeriesStatsVO {
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
}

/** AI智能体分析 */
export interface DashboardAgentAnalyticsVO {
  /** 总智能体数 */
  totalAgents?: number;
  /** 智能体对话次数 */
  agentConversationCounts?: DashboardAgentAnalyticsVO.AgentConversationCount[];
  /** 智能体满意度 */
  agentSatisfactionRates?: DashboardAgentAnalyticsVO.AgentSatisfactionRate[];
  /** 智能体工具使用 */
  agentToolUsage?: DashboardAgentAnalyticsVO.AgentToolUsage[];
  /** 智能体性能排名 */
  topPerformingAgents?: DashboardAgentAnalyticsVO.TopPerformingAgent[];
  /** 智能体名称列表 */
  agentNames?: DashboardAgentAnalyticsVO.AgentName[];
  /** 是否按系统分类 */
  splitBySystem?: boolean;
  /** Yuxi智能体数 */
  yuxiTotalAgents?: number;
  /** Weknora智能体数 */
  weknoraTotalAgents?: number;
  /** Weknora智能体对话次数 */
  weknoraAgentConversationCounts?: DashboardAgentAnalyticsVO.WeknoraAgentConversationCount[];
  /** Weknora智能体名称映射 */
  weknoraAgentNames?: Record<string, string>;
}
export namespace DashboardAgentAnalyticsVO {
  /** 智能体ID与名称 */
  export interface AgentName {
    /** 智能体id */
    id?: string;
    /** 智能体名称 */
    name?: string;
    /** 智能体描述 */
    description?: string;
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
}
