/** MCP 服务分页查询参数 */
export interface McpServicesPageDTO {
  /** 查询关键字 */
  keyword?: string;
}

/** MCP 服务新增、修改参数 */
export interface McpServicesDTO {
  /** 唯一ID */
  id: string;
  /** 租户ID */
  tenantId?: number;
  /** 服务名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 启用服务 true-启用 false-停用 */
  enabled?: boolean;
  /** 传输类型 http-streamable、SSE */
  transportType?: string;
  /** 服务URL */
  url?: string;
  /** 请求头 */
  headers?: string;
  /** 认证配置 */
  authConfig?: string;
  /** 高级配置 */
  advancedConfig?: string;
  stdioConfig?: string;
  envVars?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 是否内置 */
  isBuiltin?: boolean;
}

/** MCP 服务返回数据 */
export interface McpServicesVO {
  /** 唯一ID */
  id?: string;
  /** 租户ID */
  tenantId?: number;
  /** 服务名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 启用服务 true-启用 false-停用 */
  enabled?: boolean;
  /** 传输类型 http-streamable、SSE */
  transportType?: string;
  /** 服务URL */
  url?: string;
  /** 请求头 */
  headers?: string;
  /** 认证配置 */
  authConfig?: string;
  /** 高级配置 */
  advancedConfig?: string;
  stdioConfig?: string;
  envVars?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 删除时间 */
  deletedAt?: string;
  /** 是否内置 */
  isBuiltin?: boolean;
}

/** MCP 工具审批批量操作参数 */
export interface McpToolApprovalsDTO {
  /** 关联 MCP 服务 ID */
  serviceId?: string;
  /** 待审批的 MCP 工具名 */
  toolName?: string;
}

/** MCP 工具审批记录 */
export interface McpToolApprovals {
  /** 审批记录主键 */
  id?: string;
  /** 所属工作空间（租户）ID */
  tenantId?: number;
  /** 关联 MCP 服务 ID */
  serviceId?: string;
  /** 待审批的 MCP 工具名 */
  toolName?: string;
  /** 加入是否需要审批 */
  requireApproval?: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
}

/** MCP 服务测试结果 */
export interface McpTestResultVO {
  /** 测试是否成功 */
  success?: boolean;
  /** 测试消息 */
  message?: string;
  /** 服务器描述 */
  description?: string;
  /** 工具列表 */
  tools?: McpToolVO[];
  /** 资源列表 */
  resources?: McpResourceVO[];
}

/** MCP 工具 */
export interface McpToolVO {
  /** 工具名称 */
  name?: string;
  /** 工具描述 */
  description?: string;
  /** 输入模式 */
  inputSchema?: string;
}

/** MCP 资源 */
export interface McpResourceVO {
  /** 资源URI */
  uri?: string;
  /** 资源名称 */
  name?: string;
  /** 资源描述 */
  description?: string;
  /** MIME类型 */
  mimeType?: string;
}
