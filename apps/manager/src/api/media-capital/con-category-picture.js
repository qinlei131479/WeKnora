import request from '@/utils/request';
const api = {};
const SERVER_NAME = 'media-capital';
const CONTROLLE_NAME = 'con-category-picture';

/** ********通用API开始**********/

// 列表
api.list = (params) => {
  return request.post(`/${SERVER_NAME}/${CONTROLLE_NAME}/list`, params);
};

export default { ...api };
