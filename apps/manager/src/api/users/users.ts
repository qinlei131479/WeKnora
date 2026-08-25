import type { PageDomain, TableDataInfo } from '@/types';
import type { UsersPageDTO, UsersVO } from '@/types/api/data/users';
import request from '@/utils/request';

const PATH = '/business/users';

const list = (dto: UsersPageDTO, page: PageDomain): Promise<TableDataInfo<UsersVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

export const Users = {
  list
};
