import request from "@/utils/request";
import type {
  AjaxResult,
  KnowledgeLibFileAddFolderApiParams,
  KnowledgeLibFileDetailEntity,
  KnowledgeLibFileFolderMoveApiParams,
  KnowledgeLibFileListEntity,
  KnowledgeLibFileQueryParams,
  KnowledgeLibFileSaveParams,
  KnowledgeLibFileUpdateFolderPermissionParams,
  KnowledgeLibFileUpdateLevelParams
} from '@/types';

const API = "/business/ragKnowledge";
const API_FILE = "/business/agiKnowledgeFile";

export const exportUrl = `${API}/export`
export const uploadFileUrl = `/business/ragFileDecompressionTask/upload`
export const batchDownloadUrl = `/business/ragFileManagement/batch/download/`


// 文件/文件夹层级更改
export function updateFileLevelApi(data: KnowledgeLibFileUpdateLevelParams): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/updateFileLevel`,
    method: 'post',
    data: data
  })
}
// 按id更新
export function updateSingleApi(data: KnowledgeLibFileSaveParams): Promise<AjaxResult<KnowledgeLibFileDetailEntity>> {
  return request({
    url: `${API_FILE}/update/single`,
    method: 'post',
    data: data
  })
}
// 修改文件夹权限继承控制方法
export function updateFolderPermissionApi(data: KnowledgeLibFileUpdateFolderPermissionParams): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/update/folder/permission`,
    method: 'post',
    data: data
  })
}
// 重新解析文件
export function reparseApi(dataList: number[]): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/reparse`,
    method: 'post',
    data: {
      dataList
    }
  })
}
// 新建子文件夹
export function addFolderApi(data: KnowledgeLibFileAddFolderApiParams): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/folder/insert`,
    method: "post",
    data: data,
  });
}
// 文件夹移动
export function moveFolderApi(data: KnowledgeLibFileFolderMoveApiParams): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/folder/move`,
    method: "post",
    data: data,
  });
}
// 按id删除
export function delSingleApi(id: number): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/delete/single?id=${id}`,
    method: "post",
  });
}
// 批量修改状态
export function updateBatchStatusApi(dataList: number[], status: number): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/batch/update/status`,
    method: 'post',
    data: {
      dataList,
      status
    }
  })
}
// // 文件/文件夹批量下载
// export function batchDownloadApi(dataList: number[]): Promise<AjaxResult> {
//   return request({
//     url: `${batchDownloadUrl}${dataList.join(',')}`,
//     method: 'get',
//     responseType: 'blob'
//   })
// }

// 文件/文件夹批量删除
export function batchDeleteApi(knowledgeId: number, dataList: number[]): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/batch/delete/${knowledgeId}`,
    method: 'post',
    data: {
      dataList
    }
  })
}
// 批量删除文件
export function batchDeleteFileApi(dataList: number[]): Promise<AjaxResult> {
  return request({
    url: `${API_FILE}/batch/delete/file`,
    method: 'post',
    data: {
      dataList
    }
  })
}
// 按id查询
export function getSingleApi(id: number): Promise<AjaxResult<KnowledgeLibFileDetailEntity>> {
  return request({
    url: `${API_FILE}/single?id=${id}`,
    method: 'get',
  })
}
// 搜索树
export function searchTreeApi(data: KnowledgeLibFileQueryParams): Promise<AjaxResult<KnowledgeLibFileListEntity[]>> {
  return request({
    url: `${API_FILE}/search/tree`,
    method: 'get',
    params: data
  })
}
// 文件夹树查询
export function folderTreeApi(id: number): Promise<AjaxResult<KnowledgeLibFileListEntity[]>> {
  return request({
    url: `${API_FILE}/fileTree?knowledgeId=${id}`,
    method: 'get',
  })
}
// 通过code获取文件列表
export function fileListByCodeApi(data: KnowledgeLibFileQueryParams): Promise<AjaxResult<KnowledgeLibFileListEntity[]>> {
  return request({
    url: `${API_FILE}/fileListByCode`,
    method: 'get',
    params: data
  })
}
