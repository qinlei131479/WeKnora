export interface ParserEngineEntity {
  // id: number;
  name: string; // 引擎名称
  description: string; // 引擎描述
  fileTypes: string[]; // 支持的文件类型
  available: boolean; // 是否可用
  unavailableReason: string; // 不可用原因
}

export interface ParserEngineListResp {
  engines: ParserEngineEntity[]; // 解析引擎列表
  docreaderAddr: string; // DocReader 服务地址
  docreaderTransport: string; // DocReader 传输协议
  connected: boolean; // DocReader 是否已连接
}
