import type { AjaxResult, BaseEntity, PageDomain } from '../common'

export interface KnowledgeFaqBase extends BaseEntity {
  id?: number // 常见问题ID
  categoryId?: number // 分类ID
  name: string // 常见问题名称
  description: string // 常见问题描述
  knowledgeType: number // 知识库类型, 0:文档, 1:Q&A
}
export interface KnowledgeFaqSaveParams extends KnowledgeFaqBase {

}
export interface KnowledgeFaqEntity extends KnowledgeFaqBase {
  status: number // 状态 // 知识库状态，字典：rag_knowledge_status，0 文件未上传，1 文件解压中，2：文件解压成功，3：解压失败，4 待解析、5 解析中、6 解析完成
  message: string // 处理错误描述
  ragflowDatasetId?: number // RAGFlow数据集ID
  // embedding_model: string // 向量模型
  // rerank_model: string // 排序模型
}

export interface KnowledgeFaqQueryParams extends PageDomain {
  name?: string // 常见问题名称
  categoryId?: number // 分类ID
  knowledgeType?: number // 知识库类型, 0:文档, 1:Q&A
}

export interface KnowledgeFaqQuestionBase {
  id?: number // 常见问题ID
  knowledgeId?: number // 知识库ID
  knowledgeName?: string // 知识库名称
  question?: string // 常见问题
  answer?: string // 常见问题答案
  categoryId?: number // 分类ID
  categoryName?: string // 分类名称
}

export interface KnowledgeFaqQuestionSaveParams extends KnowledgeFaqQuestionBase {}

export interface KnowledgeFaqQuestionEntity extends KnowledgeFaqQuestionBase, BaseEntity {
}

export interface KnowledgeFaqQuestionQueryParams extends PageDomain {
  categoryId?: number // 分类ID
  keyword?: string // 搜索关键词
  knowledgeId?: number // 知识库ID
}

export interface KnowledgeFaqUploadResultItem {
  question: string;
  answer: string;
}
export interface KnowledgeFaqUploadResultData {
  fileName: string;
  items: KnowledgeFaqUploadResultItem[];
}
export interface KnowledgeFaqBatchAddParams extends KnowledgeFaqUploadResultData {
  knowledgeId: number // 知识库ID
  categoryId: number // 分类ID
  categoryCode: string // 分类编码
}
