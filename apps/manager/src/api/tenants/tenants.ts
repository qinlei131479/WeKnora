import { PageDomain, TableDataInfo } from '@/types';
import { TenantsDTO, TenantsVO } from '@/types/api/data/tenants';
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
