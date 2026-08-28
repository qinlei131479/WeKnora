import { AjaxResult, ParserEngineListResp } from '@/types';
import request from '@/utils/request';

const API = '/business';

// 返回当前租户可用的解析引擎列表及 DocReader 连接状态
export function getParserEngineListApi(): Promise<AjaxResult<ParserEngineListResp>> {
  return request.get(`${API}/system/parser-engines`);
}

// 使用给定配置参数检测解析引擎可用性（不保存）
export function checkParserEngineApi(req: any): Promise<AjaxResult<ParserEngineListResp>> {
  return request.post(`${API}/system/parser-engines/check`, req);
}
