import type {
  AjaxResult,
  McpServicesDTO,
  McpServicesPageDTO,
  McpServicesVO,
  McpTestResultVO,
  McpToolApprovals,
  McpToolApprovalsDTO,
  PageDomain,
  TableDataInfo
} from '@/types';
import request from '@/utils/request';

const PATH = '/business/mcpServices';

/** 按条件分页查询 MCP 服务 */
const list = (dto: McpServicesPageDTO, page: PageDomain): Promise<TableDataInfo<McpServicesVO>> => {
  return request({ url: `${PATH}/list`, method: 'GET', params: { ...dto, ...page } });
};

/** 按 ID 查询 MCP 服务 */
const single = (id: string): Promise<AjaxResult<McpServicesVO>> => {
  return request({ url: `${PATH}/single`, method: 'GET', params: { id } });
};

/** 新增 MCP 服务 */
const insert = (data: McpServicesDTO): Promise<AjaxResult<McpServicesVO>> => {
  return request({ url: `${PATH}/insert/single`, method: 'POST', data });
};

/** 按 ID 修改 MCP 服务 */
const update = (data: McpServicesDTO): Promise<AjaxResult<McpServicesVO>> => {
  return request({ url: `${PATH}/update/single`, method: 'POST', data });
};

/** 按 ID 删除 MCP 服务 */
const _delete = (id: string): Promise<AjaxResult<void>> => {
  return request({ url: `${PATH}/delete/single`, method: 'GET', params: { id } });
};

/** 批量启用 MCP 服务 */
const enableBatch = (data: string[]): Promise<AjaxResult<void>> => {
  return request({ url: `${PATH}/enabled/batch`, method: 'POST', data });
};

/** 批量停用 MCP 服务 */
const disableBatch = (data: string[]): Promise<AjaxResult<void>> => {
  return request({ url: `${PATH}/disabled/batch`, method: 'POST', data });
};

/** 查询 MCP 服务的工具审批记录 */
const listTools = (mcpId: string): Promise<AjaxResult<McpToolApprovals[]>> => {
  return request({ url: `${PATH}/tool/list`, method: 'POST', params: { mcpId } });
};

/** 批量启用 MCP 工具审批 */
const enableToolsBatch = (data: McpToolApprovalsDTO[]): Promise<AjaxResult<void>> => {
  return request({ url: `${PATH}/tool/enabled/batch`, method: 'POST', data });
};

/** 批量停用 MCP 工具审批 */
const disableToolsBatch = (data: McpToolApprovalsDTO[]): Promise<AjaxResult<void>> => {
  return request({ url: `${PATH}/tool/disabled/batch`, method: 'POST', data });
};

/** 测试 MCP 服务连接 */
const test = (id: string): Promise<AjaxResult<McpTestResultVO>> => {
  return request({ url: `${PATH}/test`, method: 'GET', params: { id } });
};

export const McpServices = {
  list,
  single,
  insert,
  update,
  delete: _delete,
  enableBatch,
  disableBatch,
  listTools,
  enableToolsBatch,
  disableToolsBatch,
  test
};
