import { AjaxResult, PageDomain, StorageBackendsDTO, StorageBackendsVO, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/storage';

const list = (tenantId: number, page: PageDomain): TableDataInfo<StorageBackendsVO> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    param: { tenantId, ...page }
  });
};
const insert = (data: StorageBackendsDTO): AjaxResult<any> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};
const update = (data: StorageBackendsDTO): AjaxResult<any> => {
  return request({
    url: `${PATH}/update/single`,
    method: 'POST',
    data
  });
};
const _delete = (id: number): AjaxResult<any> => {
  return request({
    url: `${PATH}/delete/single`,
    method: 'POST',
    param: { id }
  });
};

export const storage = {
  list,
  insert,
  update,
  delete: _delete
};
