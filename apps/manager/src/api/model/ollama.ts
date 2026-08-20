import { AjaxResult, OllamaDownloadReq, OllamaDownloadResp, OllamaModelsCheckReq, OllamaModelsCheckResp, OllamaModelsResp, OllamaRemoteCheckReq, OllamaRemoteCheckResp, OllamaStatusResp } from '@/types'
import request from '@/utils/request'

const API = "/business";
// 检查 Ollama 服务是否可用
export function getOllamaStatusApi(): Promise<AjaxResult<OllamaStatusResp>> {
  return request({
    url: `${API}/ollama/status`,
    method: 'get'
  })
}

// /ollama/models
// 获取已安装的 Ollama 模型列表
export function getOllamaModelsApi(): Promise<AjaxResult<OllamaModelsResp[]>> {
  return request({
    url: `${API}/ollama/models`,
    method: 'get'
  })
}

// /ollama/models/download
// 异步下载指定的 Ollama 模型
export function downloadOllamaModelApi(req: OllamaDownloadReq): Promise<AjaxResult<OllamaDownloadResp>> {
  return request({
    url: `${API}/ollama/models/download`,
    method: 'post',
    data: req
  })
}
// /ollama/models/check
// 批量检查指定模型是否已安装
export function checkOllamaModelsApi(req: OllamaModelsCheckReq): Promise<AjaxResult<OllamaModelsCheckResp>> {
  return request({
    url: `${API}/ollama/models/check`,
    method: 'post',
    data: req
  })
}

// /ollama/remote/check
// 检查远程模型 API 是否可访问
export function checkOllamaRemoteModelsApi(req: OllamaRemoteCheckReq): Promise<AjaxResult<OllamaRemoteCheckResp>> {
  return request({
    url: `${API}/ollama/remote/check`,
    method: 'post',
    data: req
  })
}

// /ollama/download/tasks
// 获取所有下载任务列表
export function getOllamaDownloadTasksApi(): Promise<AjaxResult<OllamaDownloadResp[]>> {
  return request({
    url: `${API}/ollama/download/tasks`,
    method: 'get'
  })
}

// /ollama/download/progress/{taskId}
// 获取指定下载任务的进度
export function getOllamaDownloadProgressApi(taskId: string): Promise<AjaxResult<OllamaDownloadResp>> {
  return request({
    url: `${API}/ollama/download/progress/${taskId}`,
    method: 'get'
  })
}
