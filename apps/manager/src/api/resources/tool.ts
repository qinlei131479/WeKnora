import { AjaxResult, PageDomain, TableDataInfo, ToolDTO, ToolPageDTO, ToolVO } from '@/types';
import request from '@/utils/request';

const path = '/business/agiTool';

// 列表
const list = (dto: ToolPageDTO, pg: PageDomain): Promise<TableDataInfo<ToolVO>> => {
  return request({
    url: `${path}/list`,
    method: 'GET',
    params: { ...dto, ...pg }
  });
};

// 详情
const single = (id: number): Promise<AjaxResult<ToolVO>> => {
  return request({
    url: `${path}/single`,
    method: 'GET',
    params: { id }
  });
};

// 新增
const insert = (data: ToolDTO): Promise<AjaxResult<ToolVO>> => {
  return request({
    url: `${path}/insert/single`,
    method: 'POST',
    data
  });
};

// 更新
const update = (data: ToolDTO): Promise<AjaxResult<ToolVO>> => {
  return request({
    url: `${path}/update/single`,
    method: 'POST',
    data
  });
};

// 删除
const deleteById = (id: number): Promise<AjaxResult> => {
  return request({
    url: `${path}/delete/single`,
    method: 'POST',
    params: { id }
  });
};

// 状态变更
const status = (id: number, status: 0 | 1 | 2): Promise<AjaxResult> => {
  return request({
    url: `${path}/status/single`,
    method: 'POST',
    params: { id, status }
  });
};

// 强制下线
const offlineByIdForce = (id: number): Promise<AjaxResult> => {
  return request({
    url: `${path}/offline/force`,
    method: 'POST',
    params: { id }
  });
};

export const agiTool = {
  list,
  single,
  insert,
  update,
  deleteById,
  status,
  offlineByIdForce
};
