import type { TenantsVO } from '../tenants';

/** 技能目录分页查询参数 */
export interface SkillCatalogPageDTO {
  /** 查询关键字 */
  keyword?: string;
  /** 租户 ID（为空查询全部租户） */
  tenantId?: number;
  /** 使用侧：chat 对话、work 工作、common 通用 */
  sourceType?: 'chat' | 'work' | 'common';
  /** 是否启用 */
  enabled?: boolean;
}

/** 远程拉取技能参数 */
export interface SkillCatalogSourceDTO {
  /** 技能来源：@slug、skills-sh:owner/repo/slug、GitHub/GitLab URL、zip 或 SKILL.md 直链 */
  source: string;
}

/** 保存技能文件参数 */
export interface SkillCatalogFileSaveDTO {
  /** 技能目录定义 ID */
  id: string;
  /** 相对技能根目录的文件路径（当前仅支持根级 SKILL.md） */
  path: string;
  /** 文件内容 */
  content: string;
}

/** 技能目录返回数据 */
export interface SkillCatalogVO {
  /** 主键 ID（UUID） */
  id?: string;
  /** 所属租户 ID */
  tenantId?: number;
  /** 技能名称 */
  name?: string;
  /** 版本号 */
  version?: string;
  /** 技能描述 */
  description?: string;
  /** SKILL.md 正文指令 */
  instructions?: string;
  /** 技能压缩包存储引用 */
  bundleRef?: string;
  /** 技能压缩包的 SHA256 摘要 */
  bundleSha256?: string;
  /** 使用侧：chat 对话、work 工作、common 通用 */
  sourceType?: string;
  /** 绑定的工具（JSON 数组，文档未限定元素结构） */
  toolDependencies?: unknown[];
  /** 绑定的 MCP（JSON 数组，文档未限定元素结构） */
  mcpDependencies?: unknown[];
  /** 绑定的其他技能（JSON 数组，文档未限定元素结构） */
  skillDependencies?: unknown[];
  /** 共享范围（JSON 对象） */
  shareConfig?: Record<string, unknown>;
  /** 是否启用 */
  enabled?: boolean;
  /** 创建人 */
  createdBy?: string;
  /** 最近更新人 */
  updatedBy?: string;
  /** 内置技能源目录最后修改时间 */
  sourceMtime?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
  /** 关联租户信息 */
  tenant?: TenantsVO;
  /** 技能压缩包内文件树（详情查询时返回） */
  fileTree?: SkillCatalogVO.FileNode[];
}

export namespace SkillCatalogVO {
  /** 技能文件树节点 */
  export interface FileNode {
    /** 节点名称 */
    name?: string;
    /** 相对技能根目录的路径 */
    path?: string;
    /** 是否为目录 */
    isDir?: boolean;
    /** 子节点（目录时存在） */
    children?: FileNode[];
  }
}
