import type { AjaxResult, BaseEntity, PageDomain } from '../common'

export type KnowledgeLibFilePermission = 'parent' | 'child'
export type KnowledgeLibFileFolderMoveAction = 'top' | 'bottom' | 'move'
export type KnowledgeLibFileFolderMoveType = 'same' | 'child'

interface KnowledgeLibFileBase {
  id?: number // ID
  code?: string // 文件code
  parentCode?: string // 父级code
  fileName: string // 原文件名称
  filePath?: string // 文件路径
  fileType?: number // 类型, 1文件, 2文件夹
  knowledgeId?: number // 知识库ID
  status?: number // 状态 1 正常 2 回收站 3 删除
  statusName?: string // 状态名称
  deleteTime?: string // 删除时间
  fileStatus?: number // 文件上传ragflow状态：0 已上传，待 Markdown 转换 1 Markdown 转换完成 2 Ragflow上传成功 3 Ragflow解析完成 4 已失败
  message?: string // 处理错误描述
  versionCode?: string // 版本号
  enabled?: number // 是否启用 0 启用 1 停用 2强制停用
  createType?: string // 创建方式
  parseStatus?: string // 解析状态
  permissionMethod?: string // 权限控制方法（parent父级、child子级），多个以,分隔
  // children?: KnowledgeLibFileBase[] // 子目录
}
interface KnowledgeLibFileBaseSave extends KnowledgeLibFileBase {
  fileSize?: number // 文件大小,kb
  ragflowFileId?: string // ragflow的文件id
  hidden?: boolean // 是否为隐藏文件 1是 0否
  weight?: number // 排序权重
  uploadFileStatus?: number // 文件上传状态 0 待上传, 1 上传中, 2 上传成功, 3 上传失败, 4 暂停上传
  uploadFileProgress?: number // 文件上传进度百分比
  parseFileId?: string // 通义-上传文件id
  parseFilePath?: string // 通义-解析后的文件路径
  syncMilvus?: number // 是否同步到milvus 0否1是
  syncTime?: string // 同步到milvus时间
  
}
export interface KnowledgeLibFileListEntity extends KnowledgeLibFileBase, BaseEntity {
  children?: KnowledgeLibFileListEntity[] // 子目录
}
export interface KnowledgeLibFileDetailEntity extends KnowledgeLibFileBaseSave, BaseEntity {
  // children?: KnowledgeLibFileDetailEntity[] // 子目录
  
}
export interface KnowledgeLibFileSaveParams extends KnowledgeLibFileBaseSave {

}
export interface KnowledgeLibFileEntity extends KnowledgeLibFileListEntity {}

export interface KnowledgeLibFileQueryParams extends PageDomain {
  id?: number // 知识库id
  code?: string // 文件code
  name?: string // 文件名称
}

export interface KnowledgeLibFileUpdateLevelParams {
  knowledgeId: number // 知识库ID
  code: string // 文件code
  parentCode: string // 父级code
}
export interface KnowledgeLibFileUpdateFolderPermissionParams {
  flolderId: number // 文件夹id
  knowledgeId: number // 知识库ID
  permissions: KnowledgeLibFilePermission[] // 权限 父级 子级
}
export interface KnowledgeLibFileAddFolderApiParams {
  knowledgeId: number // 知识库ID
  parentCode?: string // 父文件夹code, 如果为空, 则为顶层文件夹
  name: string // 文件夹名称
}
export interface KnowledgeLibFileFolderMoveApiParams {
  action: KnowledgeLibFileFolderMoveAction // 操作类型 支持 置顶(top)、置底(bottom)、移动(move)
  sourceKnowledgeId: number // 源知识库id
  sourceFloderId: number // 源文件夹id
  targetFloderId: number // 目标文件夹id
  type: KnowledgeLibFileFolderMoveType // same(同级)/child(子级)
}