import type { AjaxResult, AmpBuiltinToolsPageDTO, AmpBuiltinToolsVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/ampBuiltinTools';

/** 按条件分页查询内置工具 */
const list = (dto: AmpBuiltinToolsPageDTO, page: PageDomain): Promise<TableDataInfo<AmpBuiltinToolsVO>> => {
  return request({ url: `${PATH}/list`, method: 'GET', params: { ...dto, ...page } });
};

/** 按 ID 查询内置工具详情 */
const single = (id: string): Promise<AjaxResult<AmpBuiltinToolsVO>> => {
  return request({ url: `${PATH}/single`, method: 'GET', params: { id } });
};

export const AmpBuiltinTools = { list, single };
