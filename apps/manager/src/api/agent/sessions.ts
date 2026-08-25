import type { PageDomain, SessionsPageDTO, SessionsVO, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/sessions';

const list = (dto: SessionsPageDTO, page: PageDomain): Promise<TableDataInfo<SessionsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

export const Sessions = {
  list
};
