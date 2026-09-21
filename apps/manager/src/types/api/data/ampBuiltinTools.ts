/** 内置工具分页查询参数 */
export interface AmpBuiltinToolsPageDTO {
  /** 查询关键字 */
  keyword?: string;
  /** 工具分类 */
  category?: string;
  /** 工具来源 */
  source?: string;
}

/** 内置工具目录返回数据 */
export interface AmpBuiltinToolsVO {
  /** 内置工具目录自增主键 */
  id?: number;
  /** 工具稳定标识 */
  toolSlug?: string;
  /** 统一能力标识 */
  capabilityKey?: string;
  /** 工具展示名称 */
  name?: string;
  /** 工具描述 */
  description?: string;
  /** 工具分类 */
  category?: string;
  /** 工具输入 JSON Schema */
  inputSchema?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 来源类型 */
  source?: string;
  /** 工具版本 */
  version?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
}
