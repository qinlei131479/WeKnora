import type { AjaxResult, PageDomain, TableDataInfo, TenantsVO, TenantsPageDTO, TenantsDTO } from '@/types';
import request from '@/utils/request';

const PATH = '/business/tenants';

const list = (dto: TenantsPageDTO, page: PageDomain): Promise<TableDataInfo<TenantsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

const single = (id: number | string): Promise<AjaxResult<TenantsVO>> => {
  return request({
    url: `${PATH}/single?id=${id}`,
    method: 'GET'
  });
};

const insert = (data: TenantsDTO): Promise<AjaxResult<TenantsVO>> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};

const update = (data: TenantsDTO): Promise<AjaxResult<TenantsVO>> => {
  return request({
    url: `${PATH}/update/single`,
    method: 'POST',
    data
  });
};

const _delete = (id: number | string): Promise<AjaxResult> => {
  return request({
    url: `${PATH}/delete/single?id=${id}`,
    method: 'POST'
  });
};

const enableBatch = (data: string[] | number[]): Promise<AjaxResult> => {
  return request({
    url: `${PATH}/enabled/batch`,
    method: 'POST',
    data
  });
};

const disableBatch = (data: string[] | number[]): Promise<AjaxResult> => {
  return request({
    url: `${PATH}/disabled/batch`,
    method: 'POST',
    data
  });
};

export const Tenants = {
  list,
  single,
  insert,
  update,
  delete: _delete,
  enableBatch,
  disableBatch
};
