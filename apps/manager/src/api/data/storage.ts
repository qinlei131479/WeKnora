import { AjaxResult, PageDomain, StorageBackendsDTO, StorageBackendsPageDTO, StorageBackendsVO, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/storageBackends';

const list = (dto: StorageBackendsPageDTO, page: PageDomain): Promise<TableDataInfo<StorageBackendsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};
const insert = (data: StorageBackendsDTO): Promise<AjaxResult<StorageBackendsVO>> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};
const update = (data: StorageBackendsDTO): Promise<AjaxResult<StorageBackendsVO>> => {
  return request({
    url: `${PATH}/update/single`,
    method: 'POST',
    data
  });
};
const _delete = (id: number): Promise<AjaxResult<void>> => {
  return request({
    url: `${PATH}/delete/single`,
    method: 'POST',
    params: { id }
  });
};

export const Storage = {
  list,
  insert,
  update,
  delete: _delete
};
