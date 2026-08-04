import { AjaxResult, KnowledgeOptLogPageDTO, KnowledgeOptLogVO, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';

const path = '/business/agiKnowledgeOptLog';

// 获取记录梳理
const count = (dto: KnowledgeOptLogPageDTO): Promise<AjaxResult<number>> => {
  return request({
    url: `${path}/count`,
    method: 'GET',
    params: { ...dto }
  });
};

// 列表
const list = (dto: KnowledgeOptLogPageDTO, pg: PageDomain): Promise<TableDataInfo<KnowledgeOptLogVO>> => {
  return request({
    url: `${path}/list`,
    method: 'GET',
    params: { ...dto, ...pg }
  });
};

// 导出 Excel
const exportExcel = (dto: KnowledgeOptLogPageDTO, pg: PageDomain): Promise<any> => {
  return request({
    url: `${path}/excel`,
    method: 'GET',
    params: { ...dto, ...pg },
    responseType: 'blob'
  });
};

export const agiKnowledgeOptLog = {
  count,
  list,
  exportExcel
};
