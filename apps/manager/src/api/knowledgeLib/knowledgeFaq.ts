import type { AjaxResult, KnowledgeAuthEntity, KnowledgeFaqQueryParams, KnowledgeFaqSaveParams } from "@/types";
import request from "@/utils/request";
// import qs from "qs";

const API = "/business/agiKnowledge";

// const isDev = false;

// export const exportUrl = `${API}/export`
// export const uploadFileUrl = `/business/ragFileDecompressionTask/upload`
// export const batchDownloadUrl = `/business/ragFileManagement/batch/download/`

// 列表
export function listKnowledgeFaqApi(query: KnowledgeFaqQueryParams) {
  query.knowledgeType = 1;
  return request({
    url: `${API}/list`,
    method: 'get',
    params: query
  })
}
// 新增
export function addKnowledgeFaqApi(data: KnowledgeFaqSaveParams) {
  return request({
    url: `${API}/insert/single`,
    method: 'post',
    data: data
  })
}
// 修改
export function updateKnowledgeFaqApi(data: KnowledgeFaqSaveParams) {
  return request({
    url: `${API}/update/single`,
    method: 'post',
    data: data
  })
}

// 删除
export function deleteKnowledgeFaqApi(id: number) {
  return request({
    url: `${API}/delete/single?id=${id}`,
    method: 'get',
  })
}

// 详情
export function detailKnowledgeFaqApi(id: number) {
  return request({
    url: `${API}/single?id=${id}`,
    method: 'get'
  })
}

// 权限
export function getKnowledgeFaqPermissionsApi(id: number|string) : Promise<AjaxResult<KnowledgeAuthEntity[]>> {
  return request({
    url: `/business/agiKnowledgeAuth/faq/queryByKnowledgeId?knowledgeId=${id}`,
    method: 'get'
  })
}