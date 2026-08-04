import type {
  AjaxResult,
  KnowledgeAuthBatchSaveParam,
  KnowledgeAuthDeptQueryParams,
  KnowledgeAuthEntity,
  KnowledgeAuthPostQueryParams,
  KnowledgeAuthQueryParams,
  KnowledgeAuthRoleQueryParams,
  KnowledgeAuthRowEntity,
  KnowledgeAuthSingleSave,
  KnowledgeAuthUserQueryParams,
  KnowledgePermQueryParams,
  TableDataInfo
} from '@/types';
import request from '@/utils/request';
// import qs from "qs";

const API = '/business/agiKnowledgeAuth';

export const AuthTypes = Object.freeze({
  DEPT: 0,
  POST: 1,
  USERGROUP: 2
});

export function getKnowledgeTypeName(knowledgeType: number, short: boolean = false) {
  return knowledgeType == 0 ? (short ? '文档' : '文档知识') : short ? 'FAQ' : 'FAQ知识';
}
export function getKnowledgeTypeBadgeStyle(knowledgeType: number) {
  return knowledgeType == 0 ? 'doc-icon-bg doc-icon-text' : 'faq-icon-bg faq-icon-text';
}
// const isDev = false;

// export const exportUrl = `${API}/export`
// export const uploadFileUrl = `/business/ragFileDecompressionTask/upload`
// export const batchDownloadUrl = `/business/ragFileManagement/batch/download/`

// 列表
export function listKnowledgeAuthApi(query: KnowledgeAuthQueryParams): Promise<TableDataInfo<KnowledgeAuthRowEntity>> {
  return request({
    url: `${API}/list`,
    method: 'get',
    params: query
  });
}
// // 新增
// export function addKnowledgeAuthApi(data: KnowledgeAuthSingleSave) {
//   return request({
//     url: `${API}/insert/single`,
//     method: 'post',
//     data: data
//   })
// }
// 通用授权知识库权限(选中/取消勾选框)
export function updateKnowledgeAuthApi(data: KnowledgeAuthSingleSave): Promise<AjaxResult<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/authorize/single`,
    method: 'post',
    data: data
  });
}
export function updateFaqAuthApi(data: KnowledgeAuthBatchSaveParam): Promise<AjaxResult<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/authorize/batch`,
    method: 'post',
    data: data
  });
}

// // 删除
// export function deleteKnowledgeAuthApi(id: number) {
//   return request({
//     url: `${API}/delete/single?id=${id}`,
//     method: 'get',
//   })
// }

// 详情
export function detailKnowledgeAuthApi(id: number | string): Promise<AjaxResult<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/single?knowledgeId=${id}`,
    method: 'get'
  });
}

// 用户权限审计
export function getUserAuditApi(params: KnowledgeAuthUserQueryParams): Promise<TableDataInfo<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/audit/user`,
    method: 'get',
    params: params
  });
}
// 角色权限审计
export function getRoleAuditApi(params: KnowledgeAuthRoleQueryParams): Promise<TableDataInfo<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/audit/role`,
    method: 'get',
    params: params
  });
}
// 岗位权限审计
export function getPostAuditApi(params: KnowledgeAuthPostQueryParams): Promise<TableDataInfo<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/audit/post`,
    method: 'get',
    params: params
  });
}
// 部门权限审计
export function getDeptAuditApi(params: KnowledgeAuthDeptQueryParams): Promise<TableDataInfo<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/audit/dept`,
    method: 'get',
    params: params
  });
}
// 根据知识库id查询权限
export function getKnowledgeLibPermissionsApi(params: KnowledgePermQueryParams): Promise<TableDataInfo<KnowledgeAuthEntity>> {
  return request({
    url: `${API}/queryByKnowledgeId`,
    method: 'get',
    params: params
  });
}
