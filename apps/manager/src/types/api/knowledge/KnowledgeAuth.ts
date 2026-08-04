import type { AjaxResult, BaseEntity, PageDomain } from '../common'

interface KnowledgeAuthFlag {
  knowledgeId?: number // 知识库ID
  knowledgeType?: number // 知识库类型 0-文档知识 1-FAQ知识
  manageFlag?: number // 管理与上传配置权标识 0-无 1-有
  queryFlag?: number // 允许智能问答与检索标识 0-不允许 1-允许
  downloadFlag?: number // 允许原文件下载导出标识 0-不允许 1-允许
}
export interface KnowledgeAuthType {
  authId?: number // 权限对象(关联sys_dept.id、knowledge_role.id、sys_post.id)
  authType?: number // 权限类别 0-部门 1-岗位 2-用户组
}
interface KnowledgeAuthBase extends KnowledgeAuthFlag, KnowledgeAuthType {
  id?: number // 常见问题ID
}
// 通用授权知识库权限(选中/取消勾选框)
export interface KnowledgeAuthSingleSave extends KnowledgeAuthBase {
  // 权限对象必填
  authId: number // 权限对象(关联sys_dept.id、knowledge_role.id、sys_post.id)
}
// FAQ知识库批量权限修改
export interface KnowledgeAuthBatchSaveParam extends KnowledgeAuthFlag {
  authList: KnowledgeAuthType[] // 权限对象列表
}
export interface KnowledgeAuthSaveParams extends KnowledgeAuthBase {

}
export interface KnowledgeAuthEntity extends KnowledgeAuthBase, BaseEntity {
  authTypeName?: string // 权限类别名称
  authName?: string // 权限对象名称
}
export interface KnowledgeAuthRowEntity extends BaseEntity {
  knowledgeId: number // 知识库ID
  knowledgeName: string // 知识库名称
  authList: KnowledgeAuthEntity[] // 权限对象列表
}

export interface KnowledgeAuthQueryParams extends PageDomain {
  authType?: number // 权限类别 0-部门 1-岗位 2-用户组
  categoryId?: number // 分类ID,agi_category.id
}

export interface KnowledgeAuthAuditEntity extends KnowledgeAuthFlag, BaseEntity {
  id?: number // ID
  knowledgeName?: string // 知识库名称
}

export interface KnowledgeAuthDeptQueryParams extends PageDomain {
  deptId?: number // 部门ID
  keyword?: string // 搜索关键词
}
export interface KnowledgeAuthPostQueryParams extends PageDomain {
  postId?: number // 岗位ID
  keyword?: string // 搜索关键词
}
export interface KnowledgeAuthRoleQueryParams extends PageDomain {
  roleId?: number // 角色ID
  keyword?: string // 搜索关键词
}
export interface KnowledgeAuthUserQueryParams extends PageDomain {
  userId?: number // 用户ID
  keyword?: string // 搜索关键词
}
export interface KnowledgePermQueryParams extends PageDomain {
  authType?: number // 权限类别 0-部门 1-岗位 2-用户组
  knowledgeId?: number // 知识库ID
}