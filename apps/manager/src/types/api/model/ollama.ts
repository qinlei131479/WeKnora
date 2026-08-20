// import type { PageDomain, BaseEntity } from "../common";

// export interface OllamaQueryParams extends PageDomain {}


export interface OllamaStatusResp {
  available: boolean;
  endpoint: string;
  version: string;
}
export interface OllamaDownloadReq {
  model: string;
}
export interface OllamaDownloadResp {
  id: string; // 任务 ID
  modelName: string; // 模型名称
  status: string; // 任务状态
  progress: number; // 下载进度（0-100）
  message: string; // 状态消息
  startTime: string; // 开始时间
  endTime: string; // 结束时间
}
export interface OllamaRemoteCheckReq {
  url: string; // 模型服务 URL
  apiKey: string; // API Key
  modelName: string; // 模型名称
}
export interface OllamaRemoteCheckResp {
  success: boolean; // 是否成功
  message: string; // 消息
}
export interface OllamaModelsCheckReq {
  models: string[]; // 模型名称列表
}
export interface OllamaModelsCheckResp {
  models: Record<string, boolean>; // 模型检查结果，键为模型名称，值为是否可用
}

export interface OllamaBase {
  name: string; // 模型名称
  size: number; // 模型大小（字节）
  modifiedAt: string; // 修改时间
  digest: string; // 模型摘要
}

export interface OllamaModelsResp extends OllamaBase {
  
}




// export interface OllamaDownloadTaskResp {
//   id: string; // 任务 ID
//   modelName: string; // 模型名称
//   status: string; // 任务状态
//   progress: number; // 下载进度（0-100）
//   message: string; // 状态消息
//   startTime: string; // 开始时间
//   endTime: string; // 结束时间
// }