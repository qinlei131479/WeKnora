import type { AjaxResult, AmpParserEnginesDTO, AmpParserEnginesPageDTO, AmpParserEnginesVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const PATH = '/business/ampParserEngines';

const list = (dto: AmpParserEnginesPageDTO, page: PageDomain): Promise<TableDataInfo<AmpParserEnginesVO>> => {
  return request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page }
  });
};

const single = (id: number): Promise<AjaxResult<AmpParserEnginesVO>> => {
  return request({
    url: `${PATH}/single`,
    method: 'GET',
    params: { id }
  });
};

const insert = (data: AmpParserEnginesDTO): Promise<AjaxResult<AmpParserEnginesVO>> => {
  return request({
    url: `${PATH}/insert/single`,
    method: 'POST',
    data
  });
};

const update = (data: AmpParserEnginesDTO): Promise<AjaxResult<AmpParserEnginesVO>> => {
  return request({
    url: `${PATH}/update/single`,
    method: 'POST',
    data
  });
};

const _delete = (id: number): Promise<AjaxResult<void>> => {
  return request({
    url: `${PATH}/delete/single`,
    method: 'POST',
    params: { id }
  });
};

export const AmpParserEngines = {
  list,
  single,
  insert,
  update,
  delete: _delete
};
