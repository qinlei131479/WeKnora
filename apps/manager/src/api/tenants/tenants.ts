import { PageDomain, TableDataInfo, TenantsDTO, TenantsVO } from '@/types';
import request from '@/utils/request';

const PATH = '/business/tenants';

const list = (dto: TenantsDTO, page: PageDomain): Promise<TableDataInfo<TenantsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

export const Tenants = {
  list
};
