import type { AjaxResult, BaseEntity, PageDomain } from '../common'

export interface KnowledgeSearchBase extends BaseEntity {
  content?: string
  fileId?: number // 文件ID
  fileName?: string // 文件名称
  filePath?: string // 文件路径
  knowledgeId?: number // RAG知识库ID
  member?: string // 成员
  path?: string // 路径
  purview?: string // 权限
}
export interface KnowledgeSearchEntity extends KnowledgeSearchBase {}
