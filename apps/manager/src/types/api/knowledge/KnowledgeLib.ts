import type { AjaxResult, BaseEntity, PageDomain } from '../common'

interface KnowledgeAuthFlag {
  manageFlag?: number // 管理与上传配置权标识 0-无 1-有
  queryFlag?: number // 允许智能问答与检索标识 0-不允许 1-允许
  downloadFlag?: number // 允许原文件下载导出标识 0-不允许 1-允许
}

interface KnowledgeLibBase {
  id?: number // ID
  categoryId?: number // 分类ID
  name?: string // 常见问题名称
  description?: string // 常见问题描述
  knowledgeType?: number // 知识库类型, 0:文档, 1:Q&A
  embeddingModel?: string // 向量模型
  rerankModel?: string // 排序模型
}
export interface KnowledgeLibSaveParams extends KnowledgeLibBase {

}
export interface KnowledgeLibEntity extends KnowledgeLibBase, KnowledgeAuthFlag, BaseEntity {
  categoryName?: string // 分类名称
  status?: number // 知识库状态，字典：rag_knowledge_status，0 文件未上传，1 文件解压中，2：文件解压成功，3：解压失败，4 待解析、5 解析中、6 解析完成
  message?: string // 处理错误描述
}

export interface KnowledgeLibQueryParams extends PageDomain {
  name?: string // 常见问题名称
  categoryId?: number // 分类ID
  knowledgeType?: number // 知识库类型, 0:文档, 1:Q&A
}


