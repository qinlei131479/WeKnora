import type { AjaxResult, PageDomain, TableDataInfo, UsersDTO, UsersPageDTO, UsersVO } from '@/types';
import request from '@/utils/request';

const PATH = '/business/users';

const list = (dto: UsersPageDTO, page: PageDomain): Promise<TableDataInfo<UsersVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

const single = (id: number | string): Promise<AjaxResult<UsersVO>> => {
  return request({
    url: `${PATH}/single?id=${id}`,
    method: 'GET'
  });
};

const insert = (data: UsersDTO): Promise<AjaxResult<UsersVO>> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};

const update = (data: UsersDTO): Promise<AjaxResult<UsersVO>> => {
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

const enable = (userId: number | string): Promise<AjaxResult> => {
  return request({
    url: `${PATH}/enable?userId=${userId}`,
    method: 'GET'
  });
};

const disable = (userId: number | string): Promise<AjaxResult> => {
  return request({
    url: `${PATH}/disable?userId=${userId}`,
    method: 'GET'
  });
};

export const Users = {
  list,
  single,
  insert,
  update,
  delete: _delete,
  enable,
  disable
};
