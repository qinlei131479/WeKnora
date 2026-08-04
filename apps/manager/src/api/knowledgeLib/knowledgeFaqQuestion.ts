import type { AjaxResult, KnowledgeFaqBatchAddParams, KnowledgeFaqQuestionEntity, KnowledgeFaqQuestionQueryParams, KnowledgeFaqQuestionSaveParams, TableDataInfo } from "@/types";
import request from "@/utils/request";
// import qs from "qs";

const API = "/business/agiKnowledgeFile/faq";

// const isDev = false;

// export const exportUrl = `${API}/export`
// export const uploadFileUrl = `/business/ragFileDecompressionTask/upload`
// export const batchDownloadUrl = `/business/ragFileManagement/batch/download/`

// 列表
export function listKnowledgeFaqQuestionApi(query: KnowledgeFaqQuestionQueryParams): Promise<TableDataInfo<KnowledgeFaqQuestionEntity>> {
  return request({
    url: `${API}/list`,
    method: 'get',
    params: query
  })
}
// 新增
export function addKnowledgeFaqQuestionApi(data: KnowledgeFaqQuestionSaveParams) {
  return request({
    url: `${API}/insert`,
    method: 'post',
    data: data
  })
}
// 修改
export function updateKnowledgeFaqQuestionApi(data: KnowledgeFaqQuestionSaveParams) {
  return request({
    url: `${API}/update`,
    method: 'post',
    data: data
  })
}

// 删除
export function deleteKnowledgeFaqQuestionApi(id: number|string) {
  return request({
    url: `${API}/delete?id=${id}`,
    method: 'get',
  })
}

// 详情
export function detailKnowledgeFaqQuestionApi(id: number|string): Promise<AjaxResult<KnowledgeFaqQuestionEntity>> {
  return request({
    url: `${API}/query?id=${id}`,
    method: 'get'
  })
}

export function batchAddFaqQuestionsApi(data: KnowledgeFaqBatchAddParams) {
  return request({
    url: `/business/agiKnowledgeFileTask/faq/save`,
    method: 'post',
    data: data
  })
}