/** 文档解析引擎新增/更新参数 */
export interface AmpParserEnginesDTO {
  id?: number;
  /** 引擎名称（唯一标识） */
  name?: string;
  /** 引擎描述 */
  description?: string;
  /** 支持的文件类型列表（JSON 数组） */
  fileTypes?: string;
  /** 引擎配置（JSON，未配置时为 null） */
  engineConfig?: string | null;
  /** 可用性检测方式：none/docreader/config/http_ping */
  checkType?: string;
  /** 检测所需的租户配置项名称 */
  configKey?: string;
  /** 排序序号 */
  sortOrder?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/** 文档解析引擎分页查询参数 */
export interface AmpParserEnginesPageDTO extends AmpParserEnginesDTO {}

/** 文档解析引擎返回数据 */
export interface AmpParserEnginesVO extends AmpParserEnginesDTO {}
