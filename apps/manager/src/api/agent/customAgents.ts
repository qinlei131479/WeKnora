import type { CustomAgentsPageDTO, CustomAgentsVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/customAgents';

const list = (dto: CustomAgentsPageDTO, page: PageDomain): Promise<TableDataInfo<CustomAgentsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

export const CustomAgents = {
  list
};
