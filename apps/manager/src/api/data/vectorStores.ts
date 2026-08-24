import { AjaxResult, PageDomain, TableDataInfo } from '@/types';
import { VectorStoresDTO, VectorStoresPageDTO, VectorStoresVO } from '@/types/api/data/vectorStores';
import request from '@/utils/request';

const PATH = '/business/vectorStores';

const list = (dto: VectorStoresPageDTO, page: PageDomain): Promise<TableDataInfo<VectorStoresVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};
const single = (id: string): Promise<AjaxResult<VectorStoresVO>> => {
  return request({
    url: `${PATH}/single`,
    method: 'GET',
    params: { id }
  });
};
const insert = (data: VectorStoresDTO): Promise<AjaxResult<VectorStoresVO>> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};
const update = (data: VectorStoresDTO): Promise<AjaxResult<VectorStoresVO>> => {
  return request({
    url: `${PATH}/update/single`,
    method: 'POST',
    data
  });
};
const _delete = (id: string): Promise<AjaxResult<void>> => {
  return request({
    url: `${PATH}/delete/single`,
    method: 'POST',
    params: { id }
  });
};
const excel = (dto: VectorStoresPageDTO, page: PageDomain): Promise<Blob> => {
  return request({
    url: `${PATH}/excel`,
    method: 'GET',
    params: { ...dto, ...page },
    responseType: 'blob'
  });
};

export const VectorStores = {
  list,
  single,
  insert,
  update,
  delete: _delete,
  excel
};
