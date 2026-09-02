import type { AjaxResult, EmbedChannelsDTO, EmbedChannelsPageDTO, EmbedChannelsVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/embedChannels';

const list = (dto: EmbedChannelsPageDTO, page: PageDomain): Promise<TableDataInfo<EmbedChannelsVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

const single = (id: string): Promise<AjaxResult<EmbedChannelsVO>> => {
  return request({
    url: `${PATH}/single`,
    method: 'GET',
    params: { id }
  });
};

const insert = (data: EmbedChannelsDTO): Promise<AjaxResult<EmbedChannelsVO>> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};

const update = (data: EmbedChannelsDTO): Promise<AjaxResult<EmbedChannelsVO>> => {
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

export const EmbedChannels = {
  list,
  single,
  insert,
  update,
  delete: _delete
};
