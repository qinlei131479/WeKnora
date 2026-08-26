import type { MessagesPageDTO, MessagesVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/messages';

const list = (dto: MessagesPageDTO, page: PageDomain): Promise<TableDataInfo<MessagesVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

export const Messages = {
  list
};
