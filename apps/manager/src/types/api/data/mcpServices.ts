
export interface McpServicesBase {
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
  /** stdio配置 */
  stdioConfig?: string;
  /** 环境变量 */
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

export interface McpServicesListReq extends McpServicesBase {

}

export interface McpServicesEntity extends McpServicesBase {

}

export interface McpServicesSaveReq extends McpServicesBase {

}

export interface McpServicesToolResp {
  /**
   * 审批记录主键
   */
  id?: string;

  /**
   * 所属工作空间（租户）ID
   */
  tenantId?: number;

  /**
   * 关联 MCP 服务 ID
   */
  serviceId?: string;

  /**
   * 待审批的 MCP 工具名
   */
  toolName?: string;

  /**
   * 加入是否需要审批
   */
  requireApproval?: boolean;

  /**
   * 创建时间
   */
  createdAt?: string;

  /**
   * 最后更新时间
   */
  updatedAt?: string;
}

export interface McpServicesToolBatchReqItem {
  /** 关联 MCP 服务 ID */
  serviceId?: string;
  /** 待审批的 MCP 工具名 */
  toolName?: string;
}
