import {
  AjaxResult,
  DatasourceCallLogVO,
  DatasourceDTO,
  DatasourcePageDTO,
  DatasourceSyncTableVO,
  DatasourceTableDTO,
  DatasourceVO,
  PageDomain,
  SqlTrainDTO,
  TableDataInfo,
  TerminologyDTO
} from '@/types';
import request from '@/utils/request';

const path = '/business/agiDatasource';

// 列表
const list = (dto: DatasourcePageDTO, pg: PageDomain): Promise<TableDataInfo<DatasourceVO>> => {
  return request({
    url: `${path}/list`,
    method: 'GET',
    params: { ...dto, ...pg }
  });
};

// 统计上个自然月访问次数
const countLastMonth = (): Promise<AjaxResult<DatasourceCallLogVO[]>> => {
  return request({
    url: `${path}/count/last-month`,
    method: 'GET'
  });
};

// 详情（含 表/术语/SQL训练 子对象详情）
const single = (id: number): Promise<AjaxResult<DatasourceVO>> => {
  return request({
    url: `${path}/single`,
    method: 'GET',
    params: { id }
  });
};

// 新增
const insert = (data: DatasourceDTO): Promise<AjaxResult<DatasourceVO>> => {
  return request({
    url: `${path}/insert/single`,
    method: 'POST',
    data
  });
};

// 更新
const update = (data: DatasourceDTO): Promise<AjaxResult<DatasourceVO>> => {
  return request({
    url: `${path}/update/single`,
    method: 'POST',
    data
  });
};

// 删除
const deleteById = (id: number): Promise<AjaxResult> => {
  return request({
    url: `${path}/delete/single`,
    method: 'POST',
    params: { id }
  });
};

// 保存表结构
const saveTable = (data: DatasourceTableDTO[]): Promise<AjaxResult> => {
  return request({
    url: `${path}/save/table`,
    method: 'POST',
    data
  });
};

// 保存行业术语
const saveTerm = (dsId: number, data: TerminologyDTO[]): Promise<AjaxResult<void>> => {
  return request({
    url: `${path}/save/term`,
    method: 'POST',
    params: { dsId },
    data
  });
};

// 保存SQL模板
const saveSqlTrain = (dsId: number, data: SqlTrainDTO[]): Promise<AjaxResult> => {
  return request({
    url: `${path}/save/sql`,
    method: 'POST',
    params: { dsId },
    data,
    timeout: 15000
  });
};

// 数据源连接测试
const ping = (id: number): Promise<AjaxResult<DatasourceVO>> => {
  return request({
    url: `${path}/ping`,
    method: 'GET',
    params: { id },
    timeout: 15000
  });
};

// 数据源连接测试2
const ping2 = (
  dsType: number,
  host: string,
  port: number,
  dbName: string,
  schema: string | null,
  username: string,
  password: string
): Promise<AjaxResult<boolean>> => {
  return request({
    url: `${path}/ping2`,
    method: 'GET',
    params: { dsType, host, port, dbName, schema, username, password },
    timeout: 15000
  });
};

// 同步表结构
const syncTable = (id: number): Promise<AjaxResult<DatasourceSyncTableVO[]>> => {
  return request({
    url: `${path}/sync/table`,
    method: 'GET',
    params: { id },
    timeout: 600000
  });
};

export const agiDatasource = {
  list,
  countLastMonth,
  single,
  insert,
  update,
  deleteById,
  saveTable,
  saveTerm,
  saveSqlTrain,
  ping,
  ping2,
  syncTable
};
