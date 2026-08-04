import request, { postDownload } from '@/utils/request';
import qs from 'qs';
const api = {};
const SERVER_NAME = '/work-order';
const CONTROLLE_NAME = 'conProgram';
const CONTROLLE_NAME_MULTI = 'conSeries';

/** ********通用API开始**********/

// 新增单集,子集
api.add = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/save`, params);
};
// 新增剧集
api.addConSeries = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/save`, params);
};
// 媒资分页获取数据
api.list = (params, pageInfo, sortInfo) => {
  const pageSortInfo = { ...pageInfo, ...sortInfo };
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/list?${qs.stringify(pageSortInfo)}`, {params});
};
// 媒资分页获取数据-剧集
api.listMulti = (params, pageInfo, sortInfo) => {
  const pageSortInfo = { ...pageInfo, ...sortInfo };
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/list?${qs.stringify(pageSortInfo)}`, {params});
};
// 媒资分页获取数据-剧集-子集
api.listMultiProgram = (params, pageInfo, sortInfo) => {
  const pageSortInfo = { ...pageInfo, ...sortInfo };
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/list?${qs.stringify(pageSortInfo)}`, params);
};

// 按ID查询
api.getDetail = (id) => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/single?id=${id}`);
};
// 按ID查询
api.getDetailConSeries = (id) => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/single?id=${id}`);
};
// 按id更新
api.update = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/update`, params);
};
// 按剧集id更新
api.updateConSeries = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/update`, params);
};

// 批量删除
api.batchDelete = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/batchDelete`, params);
};

// 批量删除剧集
api.batchDeleteConSeries = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/batchDelete`, params);
};

// 删除(含介质)
api.delConrogram = (id) => {
  return request.delete(`${SERVER_NAME}/con-program/${id}`);
};
// 删除(含介质)剧集
api.delConrogramConSeries = (id) => {
  return request.delete(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/${id}`);
};
// // 导出
// api.export = (params) => {
//   return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/export`, params);
// };
// 导出 子集，单集
api.export = (params, filename) => {
  if (!filename) {
    filename = '单集列表';
  }
  filename += new Date().format('yyyyMMddHHmmss') + '.xlsx';
  postDownload(`${SERVER_NAME}/${CONTROLLE_NAME}/export`, params, filename);
};

// 剧集导出
api.exportMulti = (params, filename) => {
  if (!filename) {
    filename = '剧集列表';
  }
  filename += new Date().format('yyyyMMddHHmmss') + '.xlsx';
  postDownload(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/export`, params, filename);
};

//  批量启用-停用
api.batchUpdateEnabled = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/batchUpdateEnabled`, params);
};
//  批量启用-停用剧集
api.batchUpdateEnabledConSeries = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/batchUpdateEnabled`, params);
};
//  批量单集-子集互转
api.batchUpdateSeriesFlag = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/batchUpdateSeriesFlag`, params);
};

//  批量修改详细信息 - 单集子集
api.batchUpdateDetailInfo = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/batchUpdateDetailInfo`, params);
};

//  批量提审
api.batchAudit = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/batchAudit`, params);
};
//  批量提审剧集
api.batchAuditConSeries = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/batchAudit`, params);
};
//   查询单集-子集总数
api.getCount = () => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/getCount`);
};

const CONTROLLE_NAME2 = 'con-program-picture';
// 媒资分页获取数据
api.picturelist = (params, pageInfo) => {
  // const searchInfo = { ...pageInfo, ...params };
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME2}/list`, params);
};

// 更新图片权重
api.updatePictureSequence = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME2}/updatePictureSequence`, params);
};
// 剧集图片列表
api.conSeriesPicturelist = (params, pageInfo) => {
  // const searchInfo = { ...pageInfo, ...params };
  return request.post(`${SERVER_NAME}/con-series-picture/list`, params);
};

// 剧集按id查询
api.getDetailBySeries = (id) => {
  console.log(id);
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/getDetailById?id=${id}`);
};

//  批量修改详细信息 - 剧集
api.batchUpdateDetailInfoBySeries = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/batchUpdateDetailInfo`, params);
};

// 源片管理，分页获取数据
api.listConMovie = (params, pageInfo, sortInfo) => {
  const pageSortInfo = { ...pageInfo, ...sortInfo };
  return request.post(`/media-capital/con-movie/list?${qs.stringify(pageSortInfo)}`, params);
};

// 单集、子集-媒资详情
api.getDetailPublish = (id) => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/detailPublish/${id}`);
};

// 剧集-媒资详情
api.getDetailPublishBySeries = (id) => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME_MULTI}/detailPublish/${id}`);
};

// 媒资关联视频校验
api.checkBindMovie = (params) => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/checkProgramBindMovie?${qs.stringify(params)}`);
};

api.submitUpAudit = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/submitUpAudit?`, params);
};

api.getAITagList = (params) => {
  // return request.post(`/media-capital/aiTag/list`, data)
  return request({
    url: '/media-capital/aiTag/list',
    method: 'get',
    params
  });
};

api.postAITagBatch = (data) => {
  return request.post(`/media-capital/aiTag/update/batch`, data);
};

// 查询内容池管理详情
api.getContentPoolConfigById = (id) => {
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/contentType/code?code=${id}`);
};
// 保存内容池管理
api.saveContentPoolConfig = (params) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/contentType`, params);
};
// 查询内容池列表
api.getContentPoolList = (params, pageInfo, sortInfo) => {
  const pageSortInfo = { ...pageInfo, ...sortInfo };
  return request.get(`${SERVER_NAME}/${CONTROLLE_NAME}/crawlerRecommend/list?${qs.stringify(pageSortInfo)}`, {params});
};
// 删除内容池
api.deleteContentPool = (id) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/crawlerRecommend/delete`, {id});
};
// 批量删除内容池
api.batchDeleteContentPool = (ids) => {
  return request.post(`${SERVER_NAME}/${CONTROLLE_NAME}/crawlerRecommend/batch/delete`, ids);
};

export default { ...api };
