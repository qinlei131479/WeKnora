import type { AjaxResult, ImChannelsPageDTO, ImChannelsVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/imChannels';

const list = (dto: ImChannelsPageDTO, page: PageDomain): Promise<TableDataInfo<ImChannelsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

const single = (id: string): Promise<AjaxResult<ImChannelsVO>> => {
  return request({
    url: `${PATH}/single`,
    method: 'GET',
    params: { id }
  });
};

export const ImChannels = {
  list,
  single
};
