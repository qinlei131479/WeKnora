import request from "@/utils/request";
import qs from 'qs';

let api = {};
const API = "/system/tenant";

let isDev = false;

// 查询列表
api.list = (query) => {
  if (isDev) {
    return {
      code: 200,
      msg: "",
      total: 1,
      data: [
        {
          id: 1,
          name: "租户1",
          createBy: "tenant1",
          updateTime: "2021-01-01 12:00:00",
        },
        {
          id: 2,
          name: "租户2",
          createBy: "tenant1",
          updateTime: "2021-01-01 12:00:00",
        },
      ],
    };
  } else {
    return request({
      url: `${API}/list`,
      method: "get",
      params: query
    });
  }
};

// 新增租户
api.add = (params) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/insert/single`,
      method: "post",
      data: params,
    });
  }
};

// 编辑租户
api.edit = (params) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/update/single`,
      method: "post",
      data: params,
    });
  }
};

// 查看租户数据
api.getById = (id) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {
        id: 1,
        name: "租户1",
        createBy: "tenant1",
        updateTime: "2021-01-01 12:00:00",
      },
    };
  } else {
    return request({
      url: `${API}/single?id=${id}`,
      method: "get",
    });
  }
};

// 删除租户
api.deleteById = (id) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/single?id=${id}`,
      method: "delete",
    });
  }
};

// 添加调用次数
api.addCallCount = (params) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/addCallTimes?${qs.stringify(params)}`,
      method: "get",
    });
  }
};

// 验证租户名称是否重复
api.isCheck = (name, tenantId) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: false,
    };
  } else {
    return request({
      url: `${API}/name?name=${name}&tenantId=${tenantId}`,
      method: "get",
    });
  }
};

// 查询租户请求趋势
api.getStaticTrend = (params) => {
  return request({
    url: `${API}/requestTrend`,
    method: "post",
    data: params,
  });
};

// 导出租户请求趋势
api.exportStaticTrend = (params) => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: {},
    };
  } else {
    return request({
      url: `${API}/requestTrend/export`,
      method: "post",
      data: params,
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

// 获取所有租户 - 下拉列表
api.getAllTenant = () => {
  if (isDev) {
    return {
      code: 200,
      msg: "success",
      data: [
        {
          id: 1,
          name: "租户1",
        },
        {
          id: 2,
          name: "租户2",
        },
      ],
    };
  } else {
    return request({
      url: `${API}/get-alltenant`,
      method: "get",
    });
  }
};

// 获取租户已调用次数、剩余次数
api.getTenantCount = (tenantId) => {
  return request({
    url: `${API}/getCalledTimes?tenantId=${tenantId}`,
    method: "get",
  });
};

// 系统配置下拉框
api.getSystemList = (tenantId) => {
  return request({
    url: `/audit/system/select`+ (tenantId?'?tenantId='+tenantId:''),
    method: "get",
  });
};

// 导出租户请求趋势
api.exportRequestTrend = (params) => {
  return request({
      url: `/system/tenant/requestTrend/export`,
      method: "post",
      data: params,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
};
export default { ...api };
