/*
 * @Author: wanghf wanghf@isvtop.com
 * @Date: 2024-04-09 14:59:55
 * @LastEditors: wanghf wanghf@isvtop.com
 * @LastEditTime: 2024-06-28 10:42:14
 * @FilePath: \ruoyi-cloud-vue3\src\api\system\area.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// import request from '@/utils/request'
// import qs from 'qs'
import request from "@/utils/request";
let api = {};
const API = "/system";

api.userTenantInputList = () => {
  const productCode = "big_data_base";
  // return request.get(`/system/tenant/get-alltenant?product=${productCode}`);
  return request({
    url: `/system/tenant/get-alltenant`,
    method: "get",
  });
};

api.getAllTanent = () => {
  return request({
    url: `/system/tenant/get-alltenant`,
    method: "get",
  });
}

api.getCurTanent = () => {
  return request({
    url: `/system/tenant/queryCurrentList`,
    method: "get",
  });
}

api.validTenantName = (name, tenantId = null) => {
  const params = { name, tenantId };
  return request({
    url: `/system/tenant/name`,
    method: "get",
    params: params,
  });
};

api.list = (param) => {
  return request({
    url: `/system/tenant/list`,
    method: "post",
    data: param,
  });
};
// 新增租户
api.add = (params) => {
  return request({
    url: `/system/tenant/insert/single`,
    method: "post",
    data: params,
  });
};
// 编辑租户
api.edit = (params) => {
  return request({
    url: `/system/tenant/update/single`,
    method: "post",
    data: params,
  });
};
// 数据回显
api.echo = (params) => {
  return request({
    url: `/system/tenant/get-tenant-data?tenantId=${params}`,
    method: "get",
  });
};
// 查看租户数据
api.getById = (id) => {
  return request({
    url: `/system/tenant/single?id=${id}`,
    method: "get",
  });
};

// 删除租户
api.deleteById = (id) => {
  return request({
    url: `/system/tenant/single?id=${id}`,
    method: "delete",
  });
}

// 禁用
api.cancel = (id) => {
  return request({
    url: `/system/tenant/cancel?id=${id}`,
    method: "post",
  });
}
// 启用
api.open = (id) => {
  return request({
    url: `/system/tenant/open?id=${id}`,
    method: "post",
  });
}

api.globalList = () => {
  return request({
    url: `/system/tenant/global-tenant-list`,
    method: "get",
  });
}
// 租户列表（非树）
api.userTenantList = () => {
  return request({
    url: `/system/tenant/user-tenant-list`,
    method: "get",
  });
}
api.listAll = api.globalList;

api.updateGlobal = (tenantId) =>{
  return request({
    url: `/system/tenant/global-tenant?tenantId=${tenantId}`,
    method: "post",
  });
}

// 租户api
api.getApi = (params) =>
  request.post(`/system/sys-api-tenant/getApiInfoByTenantId`, params);
// 修改租户api
api.updataApi = (params) =>
  request.post(`/system/sys-api-tenant/insert/single`, params);

// 租户api权限列表
api.getApiList = (params) =>
  request.post(`/system/sys-api-tenant/list`, params);
// 修改租户api权限列表
api.updataApiList = (params) =>
  request.post(`/system/sys-api-tenant/insert/tenant-api`, params);

// 租户请求api统计报表
api.getApiEcharts = (params) =>
  request.post(
    `/api-mgr/jxm-api-statistical/query-api-request-statistical-by-time`,
    params
  );
// 租户请求api表格
api.getApiTable = (params, pageInfo) =>
  request.post(
    `/api-mgr/jxm-api-statistical/query-api-request-log-by-time?${qs.stringify(
      pageInfo
    )}`,
    params
  );
// 租户请求api表格下载
api.downloadApiTable = (data) => {
  const filename = new Date().format("请求日志数据_yyyyMMddhhmmss.xlsx");
  return downloadPost(
    "/api-mgr/jxm-api-statistical/query-api-request-log-by-time-excel-download",
    filename,
    data
  );
};

// 验证关联租户CODE
api.validThirdTenantId = (thirdTenantId, tenantId = null) => {
  const params = { thirdTenantId, tenantId };
  return request.get(
    `/system/tenant/checkThirdTenantId?${qs.stringify(params)}`
  );

  // const mockData = {
  //   msg: '关联租户CODE重复，请重新输入',
  //   code: 500,
  //   data: ''
  // };
  // return getMockData(mockData);
};

export default { ...api };
